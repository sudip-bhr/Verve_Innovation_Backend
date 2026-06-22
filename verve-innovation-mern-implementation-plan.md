# Verve Innovation — MERN Stack Implementation Plan

## 1. Context & Goals

The current production site (`verveinnovation.com.np`) is a server-rendered PHP/Laravel-style application with pages for Home, About, Service, Project/Portfolio, Career, and Contact, backed by a database that drives services (`/service/{id}`) and a "Get Quote" lead form.

The Figma redesign keeps the same conceptual pages — Intro, About, Services, Cases, Contact — but introduces a new visual system: dark-mode-first sections, a glass-pill navbar, `Space Grotesk` display type paired with `Libre Caslon Text` italic accents, an orange/blue accent pair, and gradient CTA bands.

This plan rebuilds the site as a MERN application that preserves the database-driven content model of the current site (services, portfolio/cases, testimonials, team, leads) while implementing the new design system. Content like services and case studies stay dynamic and editable rather than hardcoded into JSX.

---

## 2. Design System Reference

Tokens extracted from the Figma hero section CSS, to be implemented as CSS custom properties / Tailwind theme extensions:

| Token | Value | Usage |
|---|---|---|
| `--color-bg-dark` | `#131313` / `#000000` | Dark section backgrounds |
| `--color-bg-light` | `#FFFFFF` | Light section backgrounds (About hero) |
| `--color-footer-bg` | `#F1F1F1` | Footer (light variant) |
| `--color-accent-orange` | `#FF9900` | Primary CTA, stat "+" marks, active nav |
| `--color-accent-blue` | `#0067FF` | Italic accent words, copyright text |
| `--font-display` | `Space Grotesk` (700/400) | Headlines |
| `--font-script` | `Libre Caslon Text` (italic) | Single accent word per headline (e.g. "*humans.*", "*Verve*", "*drives*", "*great*") |
| `--font-body` | `Inter` (400/600) | Body copy, nav links, buttons |
| `--radius-pill` | `9999px` | Nav, buttons |
| `--blur-nav` | `12px` (light) / `7px` (dark scroll state) | Glassmorphic navbar |

**Recurring pattern — "Accent Headline":** every major section headline is bold sans-serif text with exactly one word set in blue/orange italic serif (`We are *Verve*`, `What *drives* us`, `Let's create something *great*`, `for *humans*.`). This should be a single reusable component, not re-marked-up per page.

**Recurring pattern — Stat Block:** large `Space Grotesk` number + orange `+` + small caption (`15+ Years of experience`, `200+ Projects completed`, `35+ Team members`). Values should come from the API, not be hardcoded, since they'll need updating.

**Component library — shadcn/ui:** rather than hand-building primitives (buttons, inputs, selects, dialogs, tabs), the `ui/` layer is composed from shadcn/ui (Radix UI primitives + Tailwind + `class-variance-authority` for variants). shadcn components are copied into the repo via its CLI rather than installed as an opaque npm package, so every primitive lives in `components/ui/` and can be restyled to match the Figma tokens directly (pill radius, orange/blue accents, glass blur) instead of fighting a third-party theme. Custom site-specific components (`AccentHeadline`, `StatBlock`, `GradientBand`) are built on top of shadcn primitives rather than replacing them.

---

## 3. Folder Structure

```
verve-innovation/
├── client/                              # React + Vite
│   ├── public/
│   │   ├── favicon.svg
│   │   └── og-image.png
│   ├── src/
│   │   ├── assets/
│   │   │   ├── fonts/                   # Space Grotesk, Libre Caslon Text, Inter (self-hosted .woff2)
│   │   │   └── logo/                    # verve-logo.svg (light + dark variants)
│   │   ├── components/
│   │   │   ├── ui/                          # shadcn/ui primitives (generated via CLI, then restyled)
│   │   │   │   ├── button.jsx               # variants extended: solid-orange | outline-orange | gradient | ghost
│   │   │   │   ├── input.jsx
│   │   │   │   ├── textarea.jsx
│   │   │   │   ├── select.jsx                # Project Type, Budget Range dropdowns
│   │   │   │   ├── tabs.jsx                  # Cases filter (All/Digital Products/Software/Mobile/Marketing)
│   │   │   │   ├── badge.jsx                 # case study tags ("Web App", "UX/UI")
│   │   │   │   ├── card.jsx                  # base for CaseCard, team member card
│   │   │   │   ├── dialog.jsx                # "Get Quote" / legacy modal pattern if retained
│   │   │   │   ├── separator.jsx             # hairlines in WhatDrivesUs rows
│   │   │   │   ├── avatar.jsx                 # team photos
│   │   │   │   ├── navigation-menu.jsx       # base for pill Navbar
│   │   │   │   ├── tooltip.jsx
│   │   │   │   ├── sonner.jsx                 # toast feedback on contact form submit
│   │   │   │   └── form.jsx                   # shadcn form wrapper (react-hook-form + zod bindings)
│   │   │   ├── site/                         # custom components composed from ui/ primitives
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Navbar.jsx            # built on ui/navigation-menu + ui/button
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   └── PageWrapper.jsx
│   │   │   │   ├── AccentHeadline.jsx        # bold text + one italic accent word, color prop
│   │   │   │   ├── StatBlock.jsx             # number + "+" + caption
│   │   │   │   ├── GradientBand.jsx          # blue→orange CTA section wrapper
│   │   │   │   └── CaseTag.jsx               # thin wrapper around ui/badge with project-specific styling
│   │   │   ├── sections/
│   │   │   │   ├── home/
│   │   │   │   │   ├── Hero.jsx
│   │   │   │   │   ├── TrustedByStrip.jsx
│   │   │   │   │   └── SolutionsSection.jsx
│   │   │   │   ├── about/
│   │   │   │   │   ├── AboutIntro.jsx
│   │   │   │   │   ├── StatsRow.jsx
│   │   │   │   │   ├── WhatDrivesUs.jsx     # Clarity / Craft / Confidence / Outcome Focus / Partnership
│   │   │   │   │   └── TeamGrid.jsx
│   │   │   │   ├── cases/
│   │   │   │   │   ├── CaseFilterTabs.jsx    # wraps ui/tabs
│   │   │   │   │   ├── CaseCard.jsx          # wraps ui/card + ui/badge, compact 2-up card
│   │   │   │   │   └── CaseFeatureRow.jsx    # full-width alternating row
│   │   │   │   └── contact/
│   │   │   │       ├── ContactForm.jsx       # wraps ui/form, ui/input, ui/select, ui/textarea
│   │   │   │       └── ContactInfoPanel.jsx  # email, office, phone, socials, discovery-call CTA
│   │   │   └── common/
│   │   │       ├── SEO.jsx              # react-helmet-async wrapper
│   │   │       ├── Loader.jsx
│   │   │       └── ErrorBoundary.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── Cases.jsx
│   │   │   ├── CaseDetail.jsx           # /cases/:slug
│   │   │   ├── Contact.jsx
│   │   │   └── NotFound.jsx
│   │   ├── hooks/
│   │   │   ├── useServices.js
│   │   │   ├── useCaseStudies.js
│   │   │   ├── useTeamMembers.js
│   │   │   ├── useCompanyStats.js
│   │   │   └── useContactForm.js
│   │   ├── lib/
│   │   │   ├── api.js                   # axios instance + interceptors
│   │   │   ├── motionVariants.js        # shared framer-motion presets
│   │   │   └── utils.js                 # shadcn's `cn()` helper (clsx + tailwind-merge)
│   │   ├── styles/
│   │   │   ├── tokens.css               # shadcn CSS variables remapped to Verve palette (see §2)
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── components.json                  # shadcn CLI config (aliases, style, Tailwind paths)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                              # Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── Service.js
│   │   │   ├── CaseStudy.js
│   │   │   ├── TeamMember.js
│   │   │   ├── Testimonial.js
│   │   │   ├── CompanyStat.js
│   │   │   └── ContactSubmission.js
│   │   ├── controllers/
│   │   │   ├── service.controller.js
│   │   │   ├── caseStudy.controller.js
│   │   │   ├── team.controller.js
│   │   │   ├── testimonial.controller.js
│   │   │   ├── stat.controller.js
│   │   │   └── contact.controller.js
│   │   ├── routes/
│   │   │   ├── service.routes.js
│   │   │   ├── caseStudy.routes.js
│   │   │   ├── team.routes.js
│   │   │   ├── testimonial.routes.js
│   │   │   ├── stat.routes.js
│   │   │   ├── contact.routes.js
│   │   │   └── index.js                 # mounts all routes under /api
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── validate.js              # express-validator result handler
│   │   │   └── adminAuth.js             # JWT guard for future admin/CMS routes
│   │   ├── utils/
│   │   │   ├── mailer.js                # nodemailer, sends lead notifications
│   │   │   └── asyncHandler.js
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Component Breakdown by Page

### Home (`/`)
- `Navbar` — glass pill nav, active-state pill follows current route
- `Hero` — `AccentHeadline` ("We create digital products & experiences for *humans*.") + dual CTA (`Start Your Project` solid, `View Our Work` outline)
- `TrustedByStrip` — logo wall, label "TRUSTED BY LEADING COMPANIES"
- `SolutionsSection` — two-column: `AccentHeadline` ("Services & *Solution*") + list of service links pulled from `/api/services`
- `GradientBand` (CTA) — "Let's create something *great* together." + `Get in Touch` button
- `Footer`

### About (`/about`)
- `Navbar` (light variant, active = About)
- `AccentHeadline` ("We are *Verve*") + subhead
- `AboutIntro` — two paragraphs + `StatsRow` (15+ / 200+ / 35+ using `StatBlock`)
- `WhatDrivesUs` — 5 rows (Clarity, Craft, Confidence, Outcome Focus, Partnership), each a label + description, divided by `ui/separator` hairlines
- `TeamGrid` — `ui/avatar` (circular photo) + name + role, sourced from `/api/team`
- `GradientBand` ("Join our team" + `View Openings`)
- `Footer`

### Services (`/services`)
- Reuses `SolutionsSection` pattern but expanded — full list with descriptions, pulled from `/api/services`
- Optional per-service detail via `/services/:slug` later if content grows

### Cases (`/cases`)
- `AccentHeadline` ("Cases & *References*") + subhead
- `CaseFilterTabs` — All / Digital Products / Software / Mobile / Marketing (client-side filter or query param to API)
- Mixed grid: `CaseCard` (2-up) and `CaseFeatureRow` (full-width) driven by a `layout` field on the `CaseStudy` model — **not** hardcoded in the component
- `GradientBand` ("Got a project in mind?")
- `Footer`

### Case Detail (`/cases/:slug`)
- Hero image, full description, tag list, tech stack, possibly client name/testimonial

### Contact (`/contact`)
- `AccentHeadline` ("Let's *talk*")
- `ContactForm` — name (first/last), email, project type (select), budget range (select), message; react-hook-form + zod validation; submits to `/api/contact`
- `ContactInfoPanel` — general inquiries email (copy-to-clipboard), office address, phone, social links, `Book a Discovery Call` gradient button
- `Footer`

---

## 5. API Endpoints

Base path: `/api`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/services` | List all services | Public |
| `GET` | `/services/:slug` | Single service detail | Public |
| `POST` | `/services` | Create service | Admin |
| `PUT` | `/services/:id` | Update service | Admin |
| `DELETE` | `/services/:id` | Delete service | Admin |
| `GET` | `/cases` | List case studies, supports `?category=` filter | Public |
| `GET` | `/cases/:slug` | Single case study detail | Public |
| `POST` | `/cases` | Create case study | Admin |
| `PUT` | `/cases/:id` | Update case study | Admin |
| `DELETE` | `/cases/:id` | Delete case study | Admin |
| `GET` | `/team` | List team members | Public |
| `POST` | `/team` | Add team member | Admin |
| `PUT` | `/team/:id` | Update team member | Admin |
| `DELETE` | `/team/:id` | Remove team member | Admin |
| `GET` | `/testimonials` | List testimonials | Public |
| `POST` | `/testimonials` | Add testimonial | Admin |
| `GET` | `/stats` | Company stats (years, projects, clients, team size) | Public |
| `PUT` | `/stats` | Update stats | Admin |
| `POST` | `/contact` | Submit contact/lead form | Public (rate-limited) |
| `GET` | `/contact` | List submissions | Admin |
| `PATCH` | `/contact/:id/status` | Mark lead as contacted/closed | Admin |

Admin-protected routes are scaffolded now but can stay unused until a CMS/admin panel is built — no need to build auth UI in phase 1 if content is seeded directly via MongoDB.

---

## 6. Database Schema (Mongoose)

### `Service`
```js
{
  title: String,           // "App Development"
  slug: String,             // unique, indexed
  shortDescription: String, // card summary
  description: String,      // full rich text/markdown
  icon: String,              // icon identifier or asset path
  order: Number,             // manual sort order on Solutions section
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `CaseStudy`
```js
{
  title: String,                 // "FinTech Dashboard"
  slug: String,                   // unique
  category: String,               // enum: Digital Products | Software | Mobile | Marketing
  clientIndustry: String,         // "Financial Services"
  summary: String,                // one-line result stat, e.g. "Increased user retention by 40%..."
  description: String,            // longer body for feature rows / detail page
  tags: [String],                 // ["Web App", "UX/UI"]
  coverImage: String,             // asset URL
  gallery: [String],
  layout: String,                 // enum: "grid" | "feature" — drives frontend rendering
  order: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `TeamMember`
```js
{
  name: String,
  role: String,           // "Design Director"
  photo: String,
  order: Number,
  isActive: Boolean
}
```

### `Testimonial`
```js
{
  quote: String,
  authorName: String,
  authorRole: String,     // "Managing Director"
  authorPhoto: String,
  isActive: Boolean
}
```

### `CompanyStat`
```js
{
  key: String,             // "years_experience" | "projects_completed" | "active_clients" | "team_members"
  value: Number,
  suffix: String,          // "+"
  label: String            // "Years of experience"
}
```

### `ContactSubmission`
```js
{
  firstName: String,
  lastName: String,
  email: String,
  companyName: String,
  phone: String,
  projectType: String,     // select value
  budgetRange: String,     // select value
  message: String,
  source: String,           // enum: "contact_form" | "discovery_call" | "quote_modal" — consolidates old "Get Quote" flow
  status: String,            // enum: "new" | "contacted" | "closed", default "new"
  createdAt: Date
}
```

**Note on consolidation:** the live site's "Get Quote" modal and the redesign's "Let's Talk" / "Book a Discovery Call" CTAs all serve the same lead-capture purpose. Using a single `ContactSubmission` model with a `source` field avoids maintaining three near-duplicate collections and keeps lead reporting in one place.

---

## 7. Key Dependencies

**Client**
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "tailwindcss-animate": "^1.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x",
  "@radix-ui/react-slot": "^1.x",
  "@radix-ui/react-dialog": "^1.x",
  "@radix-ui/react-select": "^2.x",
  "@radix-ui/react-tabs": "^1.x",
  "@radix-ui/react-tooltip": "^1.x",
  "@radix-ui/react-navigation-menu": "^1.x",
  "@radix-ui/react-avatar": "^1.x",
  "lucide-react": "^0.4xx.x",
  "sonner": "^1.x",
  "framer-motion": "^11.x",
  "axios": "^1.x",
  "react-helmet-async": "^2.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x"
}
```
Note: the `@radix-ui/*` packages above are what shadcn/ui pulls in under the hood — they aren't installed directly, they get added automatically as each component is generated via the shadcn CLI (`npx shadcn@latest add button input select tabs badge card dialog separator avatar navigation-menu tooltip sonner form`). The CLI itself isn't a project dependency, just a one-time scaffolding tool per component.

**Server**
```json
{
  "express": "^4.x",
  "mongoose": "^8.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "express-validator": "^7.x",
  "express-rate-limit": "^7.x",
  "nodemailer": "^6.x",
  "helmet": "^7.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x"
}
```

---

## 8. Build Sequence (Suggested Phasing)

1. **Foundation** — `npx shadcn@latest init` to scaffold `components.json` and base Tailwind config, then remap shadcn's default CSS variables (`--primary`, `--radius`, etc.) to the Verve tokens in §2 so every generated primitive inherits the orange/blue palette and pill radius automatically. Add `button`, `input`, `select`, `tabs`, `badge`, `card`, `separator`, `avatar`, `navigation-menu`, `tooltip`, `sonner`, `form` via the CLI, then build `AccentHeadline`, `StatBlock`, `Navbar`, `Footer` on top of them.
2. **Backend core** — DB connection, all six models, CRUD controllers/routes, seed script with current live-site content (services, about copy) migrated in.
3. **Home + About pages** — static-feeling sections wired to live API data.
4. **Cases** — filter logic (`ui/tabs`), `grid`/`feature` layout switch, detail page.
5. **Contact** — `ui/form` + `ui/input`/`ui/select`/`ui/textarea` + zod validation + `/api/contact` + `sonner` toast on success + email notification via nodemailer.
6. **Polish** — Framer Motion transitions on nav pill and gradient bands, SEO meta per page, responsive QA against the mobile breakpoints implied by the Figma frames.
7. **Optional phase 2** — lightweight admin panel (JWT-protected routes already scaffolded) so non-developers can edit services/cases/team without touching the database directly.
