# Verve Innovation — Security Implementation Plan

## 0. Alignment With Existing Architecture

This plan activates and hardens security primitives already scaffolded in the implementation plan rather than introducing a parallel system. Specifically, it builds on:

- `server/src/middleware/adminAuth.js` — currently a placeholder; this plan defines what it actually does.
- `jsonwebtoken` and `bcryptjs` — already listed as dependencies, currently unused.
- `server/src/middleware/rateLimiter.js` — currently scoped only to the contact form; this plan extends its use.
- The Admin-marked rows in the API endpoint table (`POST/PUT/DELETE` on services, cases, team, testimonials, stats; `GET`/`PATCH` on contact) — currently unauthenticated in practice since no admin UI exists yet. This plan makes those routes actually enforce auth, independent of whether an admin panel UI exists yet.
- `helmet`, `cors`, `express-validator` — already listed; this plan specifies their configuration rather than just their presence.

No new top-level folders are introduced. New files slot into the existing `middleware/`, `models/`, `utils/`, and `config/` directories.

---

## 1. Threat Model (Scoped to This Site)

Before specifying controls, worth being explicit about what this site actually needs to defend against, since over-engineering security for a marketing/portfolio site wastes effort that's better spent elsewhere:

| Asset | Realistic threat | Priority |
|---|---|---|
| `ContactSubmission` data (names, emails, phone, budget info) | Spam bots flooding the form; scraping of lead data if endpoint is unauthenticated for reads | High |
| Admin CRUD routes (services/cases/team/stats) | Unauthenticated tampering — defacement, fake case studies, deleted content | High |
| Admin credentials | Brute-force login attempts, credential stuffing | High |
| MongoDB connection | Injection via unsanitized query operators (`$where`, `$gt` etc. passed through user input) | Medium |
| Static assets (images, fonts) | Low — no user-generated upload pipeline planned yet | Low |
| API generally | DDoS / scraping at volume | Medium (mitigate, don't over-invest) |

This is a content-driven marketing site with one privileged role (admin), not a multi-tenant SaaS product — the plan below is scoped accordingly. It does not include things like per-resource ACLs, OAuth, or multi-factor infrastructure, since there's currently no user base beyond a small internal admin group.

---

## 2. Authentication

### 2.1 Admin model

A new model is needed since none of the six models in the existing schema represent a privileged user — `ContactSubmission` is lead data, not an account.

```js
// server/src/models/AdminUser.js
{
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'editor'], default: 'editor' },
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

No self-registration endpoint. Admin accounts are created via a one-off seed script (`server/scripts/createAdmin.js`) run manually from the server, not exposed as a public API route — there's no legitimate reason for `/api/auth/register` to exist on a single-studio site with a handful of editors.

### 2.2 Password handling

```js
// server/src/utils/password.js
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12; // 10 is bcryptjs default; 12 costs more compute but is the
                          // current general-purpose recommendation for 2026 hardware

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
```

Passwords are never logged, never returned in any API response (`passwordHash` excluded via Mongoose `select: false` on the schema field, not just by convention in controllers).

### 2.3 Login flow & JWT issuance

```js
// server/src/controllers/auth.controller.js (new file)
POST /api/auth/login
  → validate body (email, password) via express-validator
  → look up AdminUser by email
  → check lockedUntil — if locked, reject with 423 before even checking password
  → bcrypt.compare password
  → on failure: increment failedLoginAttempts, lock for 15 min after 5 failures, return generic
    401 ("Invalid credentials") — never reveal whether the email exists or the password was wrong
  → on success: reset failedLoginAttempts to 0, update lastLoginAt, issue JWT
```

**JWT contents — kept minimal:**
```js
{
  sub: adminUser._id,
  role: adminUser.role,
  iat, exp
}
```
No email or other PII embedded in the token payload (JWTs are base64, not encrypted — anything in the payload is trivially readable by anyone who has the token).

**Token delivery:** the JWT is set as an **httpOnly, Secure, SameSite=Strict cookie**, not returned in the response body for the client to store in localStorage. This is a deliberate deviation from a common but weaker pattern:

| Pattern | Risk |
|---|---|
| JWT in localStorage, sent via `Authorization` header | Readable by any injected script — a single XSS hole anywhere in the admin UI compromises every session |
| JWT in httpOnly cookie | Inaccessible to JavaScript entirely; CSRF becomes the remaining concern, mitigated by `SameSite=Strict` + a CSRF token on state-changing requests (see §4.3) |

```js
res.cookie('verve_admin_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // allow non-HTTPS only in local dev
  sameSite: 'strict',
  maxAge: 1000 * 60 * 60 * 8 // 8 hours
});
```

Short-lived tokens (8 hours, matching a working session) rather than long-lived "remember me" tokens — there's no admin-side mobile app or background job that needs a token to outlive a single working session.

### 2.4 `adminAuth` middleware (fills the existing placeholder)

```js
// server/src/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

function adminAuth(requiredRole = null) {
  return (req, res, next) => {
    const token = req.cookies.verve_admin_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.adminId = payload.sub;
      req.adminRole = payload.role;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

module.exports = adminAuth;
```

Applied to every Admin-marked route from the existing API table:
```js
router.post('/services', adminAuth(), serviceController.create);
router.put('/services/:id', adminAuth(), serviceController.update);
router.delete('/services/:id', adminAuth('owner'), serviceController.delete); // deletes restricted to owner role
```


Destructive operations (`DELETE`) are restricted to the `owner` role specifically — an `editor` (e.g., someone managing case study content) can create/update but not delete services, cases, or team members. This prevents a compromised or careless editor account from being able to wipe content.

### 2.5 Logout

```js
POST /api/auth/logout
  → res.clearCookie('verve_admin_token', { httpOnly: true, secure: ..., sameSite: 'strict' })
```

Stateless JWTs can't be server-side revoked before expiry by design — since sessions are capped at 8 hours, this is an acceptable tradeoff rather than adding a token-blocklist (Redis or a `RevokedToken` collection) that this site's scale doesn't yet justify. If a compromised-account scenario ever requires immediate revocation, the JWT secret itself can be rotated, invalidating all active sessions at once — documented as the manual incident-response step rather than building infrastructure for a scenario that hasn't occurred.

### 2.6 Login rate limiting (extends existing `rateLimiter.js`)

The existing `rateLimiter.js` is scoped to the contact form. Extend it with a second, stricter limiter for login:

```js
// server/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // per-IP, independent of the per-account lockout in §2.3
  message: { error: 'Too many login attempts. Please try again later.' }
});

module.exports = { contactFormLimiter, loginLimiter };
```

Two independent layers on login: per-account lockout (in the `AdminUser` model, §2.3) stops targeted attacks on one known email; per-IP rate limiting stops a single attacker from rotating through many email guesses.

---

## 3. Data Protection

### 3.1 Environment & secrets

`.env.example` (already in the repo root) should enumerate every required variable without real values, and the plan assumes `.env` itself is git-ignored (already specified in `.gitignore` per the existing structure):

```
MONGODB_URI=
JWT_SECRET=
NODE_ENV=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CLIENT_ORIGIN=
```

`JWT_SECRET` requirements: minimum 32 random bytes, generated via `crypto.randomBytes(32).toString('hex')` — never a memorable phrase. Rotated immediately if ever accidentally committed to version control (treat as compromised the moment it touches a public or shared repo, regardless of whether the repo is private, since private repos still get cloned onto laptops, CI runners, etc.).

Production secrets live in the hosting platform's environment variable store (Render/Railway/VPS systemd env file/etc., whichever is chosen for deployment) — never in a checked-in `.env.production` file.

### 3.2 Database-level protections

**Connection string:** MongoDB Atlas (or equivalent managed host) connection restricted by IP allowlist to the application server's outbound IP, not left open to `0.0.0.0/0`.

**Field-level exclusion:** sensitive fields excluded from query results by default at the schema level, not relied upon at the controller level where a forgotten `.select()` could leak data:
```js
// AdminUser.js
passwordHash: { type: String, required: true, select: false }
```

**NoSQL injection prevention:** user input passed into Mongoose queries is never passed as a raw object. Specifically:
```js
// VULNERABLE — req.body.email could be { "$gt": "" }, bypassing the intended match
AdminUser.findOne({ email: req.body.email });

// SAFE — validated and coerced to a string type before use
const { email } = req.body;
if (typeof email !== 'string') return res.status(400).json({ error: 'Invalid input' });
AdminUser.findOne({ email });
```
Combined with `express-mongo-sanitize` middleware (new addition to dependencies — see §5) applied globally in `app.js`, which strips any key starting with `$` or containing `.` from `req.body`, `req.query`, and `req.params` before it reaches a controller.

**Mongoose schema-level validation** on every model (`required`, `enum`, `maxlength`) as a second layer behind `express-validator` at the route level — defense in depth, not redundant, since the schema layer protects against any future code path that writes to the DB outside the validated route (a script, a migration, an admin panel built later).

### 3.3 PII handling — `ContactSubmission`

This is the most sensitive data the site collects (names, emails, phone numbers, budget information). Concrete protections:

- **Access restricted to `owner` and `editor` roles** via `adminAuth()` on `GET /api/contact` — already marked Admin in the existing table; this plan specifies that no public or partially-authenticated read path exists.
- **No third-party analytics or marketing pixel** receives `ContactSubmission` data directly — if analytics are added later (e.g., for conversion tracking), only an anonymized "form submitted" event fires, never the form's field values.
- **Retention consideration:** flag for a future decision rather than solving now — whether closed/rejected leads should be auto-purged after a retention period (e.g., 24 months) for data minimization. Worth deciding once Nepal's data protection regulatory landscape is clearer, but the schema's `status` and `createdAt` fields already support adding a scheduled cleanup job later without a schema change.
- **Email notifications (nodemailer)** sent on submission should not echo the full submission back in a way that could be intercepted in transit without TLS — confirm the SMTP provider enforces TLS (most modern providers like SendGrid/Mailgun/SES do by default; self-hosted SMTP needs explicit configuration).

### 3.4 Transport security

- **HTTPS enforced everywhere in production** — no plaintext HTTP fallback. If deployed behind a reverse proxy (nginx) or platform load balancer, HTTP requests are redirected to HTTPS at that layer.
- **HSTS** enabled via `helmet`'s `strictTransportSecurity` option (see §5 config) once HTTPS is confirmed stable, instructing browsers to never attempt plaintext HTTP to the domain again.

---

## 4. Secure API Practices

### 4.1 Input validation (express-validator — already a dependency)

Every route that accepts a request body gets an explicit validation chain, not just type-checking inside the controller:

```js
// server/src/routes/contact.routes.js
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/contact',
  contactFormLimiter,
  [
    body('firstName').trim().isLength({ min: 1, max: 100 }).escape(),
    body('lastName').trim().isLength({ min: 1, max: 100 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('projectType').isIn(['web-app', 'mobile-app', 'mvp', 'redesign', 'other']),
    body('budgetRange').isIn(['under-5k', '5k-15k', '15k-50k', '50k-plus', 'not-sure']),
    body('message').trim().isLength({ min: 1, max: 5000 }).escape()
  ],
  validate, // existing middleware — returns 400 with field errors if validation fails
  contactController.create
);
```

The `.isIn()` allowlists for `projectType` and `budgetRange` matter specifically because these are `<select>` values on the frontend — validating them server-side as an enum (matching the Mongoose schema's own `enum`) prevents a malicious client from POSTing arbitrary strings directly to the API, bypassing the dropdown entirely.

### 4.2 CORS configuration

```js
// server/src/app.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN, // e.g. https://verveinnovation.com.np — single allowed origin, not '*'
  credentials: true, // required since auth uses cookies, not bearer headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

app.use(cors(corsOptions));
```

`credentials: true` paired with a wildcard origin is rejected by browsers anyway (a built-in safeguard), but worth being explicit: the origin allowlist is a single known frontend domain, with a second entry added only for `localhost:5173` (Vite's default dev port) gated behind `NODE_ENV !== 'production'`.

### 4.3 CSRF protection

Since admin auth uses cookies (§2.3), CSRF is the relevant residual risk (an attacker's page tricking a logged-in admin's browser into firing a state-changing request). `SameSite=Strict` on the auth cookie already blocks the overwhelming majority of CSRF vectors by itself — cookies aren't even sent on cross-site requests under that setting. As a second layer for the state-changing admin routes specifically (`POST`/`PUT`/`PATCH`/`DELETE`), a double-submit CSRF token pattern:

```js
// On login success, also set a non-httpOnly token the frontend can read and echo back
res.cookie('csrf_token', csrfToken, { httpOnly: false, secure: ..., sameSite: 'strict' });

// Frontend axios interceptor (lib/api.js) attaches it as a header on mutating requests
config.headers['X-CSRF-Token'] = getCsrfTokenFromCookie();

// Middleware compares header value to cookie value — they must match
```

This is intentionally lightweight (no server-side token store needed) and proportionate to the risk — public-facing routes (`GET /api/services`, `POST /api/contact`) don't need CSRF protection since they either don't rely on cookie-based auth or aren't sensitive to being triggered cross-site.

### 4.4 Rate limiting (general API, beyond login/contact)

A lighter global limiter across all `/api/*` routes, layered beneath the stricter per-route limiters already defined:
```js
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // generous enough for normal frontend usage, blocks scripted scraping/abuse
});
app.use('/api', globalApiLimiter);
```

### 4.5 Security headers (helmet — already a dependency)

```js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // adjust to actual asset host
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind/shadcn inline styles in dev; tighten with nonces if feasible later
      connectSrc: ["'self'", process.env.CLIENT_ORIGIN]
    }
  },
  crossOriginEmbedderPolicy: false, // avoid breaking embedded content (e.g. case study videos) unless confirmed needed
  strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true }
}));
```

CSP's `imgSrc`/`connectSrc` allowlists need updating once the actual asset CDN/storage host (Cloudinary, S3, or local `/uploads`) is finalized — placeholder above assumes Cloudinary as an example.

### 4.6 Error handling (extends existing `errorHandler.js`)

The existing `errorHandler.js` middleware should ensure stack traces and internal error details never reach the client in production:

```js
// server/src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err); // full detail to server logs only

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.statusCode || 500).json({
    error: isProd ? 'Something went wrong. Please try again.' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
}
```

This matters specifically for Mongoose validation errors and duplicate-key errors, which by default include schema field names and sometimes query details — informative for debugging, but unnecessary information disclosure to expose to an end user or attacker probing the API.

### 4.7 Output sanitization for rich-text fields

`Service.description` and `CaseStudy.description` are noted as "rich text/markdown" in the existing schema. If the future admin panel allows rich-text/HTML input (rather than plain markdown rendered safely on the frontend), stored HTML must be sanitized server-side before saving — `sanitize-html` (new dependency) stripping `<script>`, inline event handlers (`onclick` etc.), and `javascript:` URLs — rather than trusting the admin panel's client-side editor to never produce unsafe markup. If the field stays markdown-only (recommended — simpler and avoids this class of risk entirely), the frontend's markdown renderer should still escape raw HTML by default rather than enabling `dangerouslySetInnerHTML`-style raw passthrough.

---

## 5. Additions to Existing Dependency List

New packages this plan requires, layered onto what's already specified in the implementation plan:

```json
{
  "server": {
    "express-mongo-sanitize": "^2.x",
    "cookie-parser": "^1.x",
    "sanitize-html": "^2.x"
  }
}
```

`jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-validator`, `express-rate-limit` were already listed in the original plan and are simply put to use here rather than re-specified.

No new client-side security dependencies are required — the client's job is mostly to send cookies correctly (`axios` with `withCredentials: true` in `lib/api.js`) and avoid `dangerouslySetInnerHTML`/`eval`-style patterns, not to enforce security itself (client-side checks are UX conveniences, never the actual security boundary).

---

## 6. Build Sequence Addition

This slots into the existing phased build sequence as an addition between phases 2 and 3 (Backend core → Home/About pages), since admin auth needs to exist before any Admin-marked route is meaningfully protected:

**Phase 2.5 — Security hardening (new)**
1. Add `AdminUser` model, `auth.controller.js`, `auth.routes.js` (`/api/auth/login`, `/api/auth/logout`).
2. Implement `adminAuth` middleware fully (§2.4), apply to all Admin-marked routes from the existing API table.
3. Add `express-mongo-sanitize`, `cookie-parser`, `helmet` configuration, CORS configuration globally in `app.js`.
4. Add CSRF double-submit pattern for mutating admin routes.
5. Extend `rateLimiter.js` with `loginLimiter` and a global API limiter.
6. Write `scripts/createAdmin.js` (one-off CLI script, not an API route) to seed the first owner account.
7. Confirm `errorHandler.js` suppresses stack traces when `NODE_ENV=production`.

Everything from Phase 3 onward (Home/About pages, Cases, Contact form, Polish) proceeds as already planned, now sitting on top of an actually-enforced auth layer rather than placeholder middleware.

---

## 7. Explicit Non-Goals (For Now)

To keep this proportionate to the site's actual risk profile:

- No OAuth/SSO — a single small admin group doesn't need it, and it would add complexity disproportionate to the benefit.
- No WAF/CDN-level bot protection (e.g., Cloudflare-specific rules) specified here — that's an infrastructure/hosting decision orthogonal to the application code, worth revisiting once a hosting provider is chosen.
- No end-to-end encryption of `ContactSubmission` fields at rest — TLS in transit + restricted DB access + restricted API read access is judged sufficient for this data's sensitivity level; revisit if the form ever starts collecting more sensitive data (e.g., payment details).
- No automated penetration testing/SAST pipeline specified — worth adding once there's a CI pipeline in place, but not a blocker for initial launch.
