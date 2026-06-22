# Verve Innovation — Performance Optimization Plan

## 0. Alignment With Existing Architecture

This plan optimizes the stack already specified across the implementation, UX, and security plans rather than proposing alternatives. It assumes:

- **Vite** as the build tool (already chosen) — most of the bundling/code-splitting recommendations below lean on Vite-native features rather than webpack-specific config.
- **shadcn/ui + Radix + Tailwind** for components — meaning bundle-size discipline matters at the *page* level (which primitives a given page imports), not at the component-library level, since shadcn components are copied into the repo rather than pulled from a monolithic package.
- **Content fetched from the Express/MongoDB API** for services, cases, team, stats, testimonials — meaning most pages are not fully static; caching strategy has to account for data freshness, not just asset delivery.
- **Specific heavy interactive elements already planned**: hover-to-video case cards (`coverVideo` field), a CSS logo marquee, a dark/light `ThemeContext` toggle, self-hosted custom fonts (`Space Grotesk`, `Libre Caslon Text`, `Inter`), and Framer Motion transitions on the nav pill and gradient CTA bands. Each gets a specific treatment below rather than generic advice.
- **`helmet`, CORS, rate limiting** already specified in the security plan — this plan adds compression and caching headers alongside those, in the same `app.js` middleware stack, rather than a separate file.

No new architectural layers are introduced. Additions slot into the existing `client/src/lib/`, `server/src/middleware/`, and `server/src/config/` directories.

---

## 1. Performance Targets

Concrete targets worth designing against, rather than optimizing in the abstract:

| Metric | Target | Why it matters here |
|---|---|---|
| Largest Contentful Paint (LCP) | < 2.5s | Hero section's large `Space Grotesk` headline is almost certainly the LCP element on Home — font loading strategy (§3) directly determines this number |
| Cumulative Layout Shift (CLS) | < 0.1 | Stat blocks, team grids, and case cards load from the API after initial paint — without reserved space, these cause visible jank as content pops in |
| Total Blocking Time (TBT) | < 200ms | Framer Motion + multiple Radix primitives hydrating at once on first load is the main risk here |
| Time to First Byte (TTFB) | < 600ms | Express response time + MongoDB query time, addressed in §6 |
| JS bundle (initial, gzipped) | < 180KB | Achievable given shadcn's copy-in-repo model, but only if route-based code splitting (§2) is actually applied |

These are stated as targets to design toward, not guarantees — actual numbers depend on final hosting and asset choices, but having them now shapes the decisions below (e.g., whether a given animation library call is worth its weight).

---

## 2. JavaScript Bundle Optimization

### 2.1 Route-based code splitting

Each page (`Home`, `About`, `Services`, `Cases`, `CaseDetail`, `Contact`) is lazy-loaded rather than bundled into a single chunk, since a first-time visitor to `/` shouldn't download `ContactForm`'s validation logic or `CaseFeatureRow`'s gallery code before they've even clicked anywhere:

```jsx
// client/src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from './components/common/Loader';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:slug" element={<CaseDetail />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Suspense>
  );
}
```

Vite handles this as automatic chunk-splitting per dynamic `import()` — no extra config needed beyond writing the imports this way.

### 2.2 Heavy dependency isolation

Two dependencies from the existing plan are worth specifically isolating rather than letting them bleed into the main bundle:

- **Framer Motion** is only actually needed on the nav pill transition and gradient CTA bands (per the existing plan's Polish phase). Rather than importing the full library at the app root, import it only inside the specific components that animate (`Navbar.jsx`, `GradientBand.jsx`), so pages that don't render those (unlikely here, but the principle holds for future pages) don't pay for it. Consider `motion/react`'s lighter `m` component + `LazyMotion` pattern if bundle analysis (§2.4) shows Framer Motion as a disproportionate chunk:
```jsx
import { LazyMotion, domAnimation, m } from 'framer-motion';
// domAnimation feature bundle is smaller than the full feature set most sites never use (e.g. layout animations, drag)
```
- **react-hook-form + zod** are only needed on `Contact.jsx` — already isolated correctly if route-based splitting (§2.1) is applied, since the lazy-loaded `Contact` chunk is the only one that imports them.

### 2.3 Icon imports (lucide-react)

`lucide-react` (already a dependency via shadcn) supports per-icon imports — confirm components use:
```js
import { ArrowRight } from 'lucide-react'; // correct — tree-shakes to just this icon
```
not a barrel import pattern that pulls the whole icon set. This is usually automatic with modern bundlers and ESM, but worth a one-time bundle-analyzer check (§2.4) to confirm Vite is actually tree-shaking it rather than including the full icon library.

### 2.4 Bundle analysis (add to build tooling)

```json
// package.json devDependencies addition
"rollup-plugin-visualizer": "^5.x"
```
```js
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    react(),
    visualizer({ filename: './dist/stats.html', gzipSize: true })
  ]
};
```
Run after the Polish phase of the existing build sequence (once Framer Motion, all shadcn primitives, and react-hook-form are actually in use) to catch any unexpectedly large chunk before launch, rather than guessing at what's heavy.

---

## 3. Font Loading Strategy (Space Grotesk, Libre Caslon Text, Inter)

This is the single highest-leverage item for LCP, since the hero headline (Home's `AccentHeadline`, using `Space Grotesk` at 92px) is almost certainly the LCP element, and webfonts block text rendering by default unless handled deliberately.

### 3.1 Self-host, don't load from Google Fonts CDN

The existing plan already specifies self-hosted `.woff2` files in `assets/fonts/` — confirming why this matters: a Google Fonts `<link>` adds a DNS lookup + connection + redirect chain (`fonts.googleapis.com` → `fonts.gstatic.com`) before the font file even starts downloading. Self-hosting from the same origin as the HTML eliminates that entirely.

### 3.2 Subset and preload only what's used

`Space Grotesk` is used at two weights (700, 400 per the design tokens) and `Libre Caslon Text` only as italic — no need to ship the full variable font or unused weights/styles:

```html
<!-- index.html, in <head>, before any other resource hints -->
<link rel="preload" href="/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/libre-caslon-text-italic.woff2" as="font" type="font/woff2" crossorigin>
```
Only the two weights/styles actually rendered above the fold on the most common entry page (Home's hero) are preloaded — `Inter` (body text) and `Space Grotesk 400` can load normally without a preload hint since they're not typically the LCP element.

### 3.3 `font-display` strategy

```css
/* client/src/styles/tokens.css */
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk-700.woff2') format('woff2');
  font-weight: 700;
  font-display: optional; /* see reasoning below */
}
```
`font-display: optional` (rather than the more common `swap`) is deliberately chosen for the hero headline's font specifically: it tells the browser to use the custom font only if it's ready within ~100ms, otherwise fall back to the system font for that render and never swap later. This avoids the layout shift a late swap-in would cause on a slow connection — for a hero headline, a fast-appearing fallback-font headline beats a correct-font headline that pops in and shifts the layout after the user's already started reading. Secondary text (`Inter` body copy) can safely use `font-display: swap` since body text reflow is far less visually disruptive than a 92px headline shifting.

### 3.4 Fallback font matching (reduce CLS further)

Define a fallback stack with similar metrics to minimize the size/position jump if the fallback render does occur:
```css
--font-display: 'Space Grotesk', 'Arial', sans-serif;
```
Optionally generate a metric-matched fallback via a tool like Fontaine or manually tune `size-adjust`/`ascent-override` in the `@font-face` block if CLS measurements (post-launch, via real user monitoring) show this is still a measurable contributor.

---

## 4. Image & Media Optimization

### 4.1 Format and responsive delivery

Given the asset types already implied by the schema (`coverImage`, `gallery`, team `photo`, logo files): serve modern formats with fallback, and responsive sizes rather than one fixed-resolution image for every viewport.

If using a managed asset host (Cloudinary, as referenced as a placeholder in the security plan's CSP config) — use its on-the-fly transformation API rather than storing multiple pre-rendered sizes manually:
```jsx
// Example: CaseCard cover image
<img
  src={`${case.coverImage}?f_auto,q_auto,w_600`}
  srcSet={`${case.coverImage}?f_auto,q_auto,w_400 400w, ${case.coverImage}?f_auto,q_auto,w_800 800w`}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  decoding="async"
  alt={case.title}
/>
```
`f_auto` serves AVIF/WebP automatically based on browser support without manual format management; `q_auto` applies perceptual quality compression.

If self-hosting images instead (no CDN chosen yet): `sharp` (new server dependency) generates WebP/AVIF variants at upload time, stored alongside the original, with the controller returning all variants in the API response so the frontend can build the `srcSet` without guessing.

### 4.2 Lazy loading — explicit exceptions

`loading="lazy"` by default on all images **except**:
- The hero section's any imagery (if added later) — should load eagerly, since it's likely above the fold and possibly the LCP element.
- The first 1-2 case cards on the `Cases` page — same reasoning, anything visible without scrolling shouldn't be deferred.

This distinction matters because blanket lazy-loading everything (including above-the-fold images) actually *hurts* LCP by adding an unnecessary delay to an image the browser could have started fetching immediately.

### 4.3 Video teasers (hover-to-play case cards)

This is the highest-risk item in the entire media strategy, flagged specifically because the UX plan's `coverVideo` hover pattern can quietly tank performance if implemented naively:

```jsx
// CaseCard.jsx
const [isHovering, setIsHovering] = useState(false);
const videoRef = useRef(null);

// Video element only mounts on first hover, not on initial render —
// the <source> isn't even requested until the user actually hovers
{isHovering && caseStudy.coverVideo && (
  <video
    ref={videoRef}
    src={caseStudy.coverVideo}
    autoPlay
    muted
    loop
    playsInline
    preload="none"
  />
)}
```
Concretely: **never** render a `<video>` tag with a real `src` on initial page load for cards not currently hovered — even with `preload="none"`, having 13+ video elements in the DOM simultaneously (per the Cases page's grid size noted in the UX plan) causes the browser to do non-trivial setup work for each. Mount the element conditionally on hover instead, and unmount (not just pause) on mouse-leave to free the decoder resources.

Video files themselves: short (2-4 second loop), small dimensions (this is a card teaser, not a full player — 480p is plenty), H.264 MP4 + WebM pair for compatibility, ideally under 1-2MB each after compression.

### 4.4 Logo marquee assets

The UX plan specifies this as CSS-only animation (correct call, already made) — the remaining performance consideration is just the logo image files themselves: SVG where possible (partner logos are usually available as SVG from the partner, and scale losslessly at any marquee speed/size) rather than raster PNGs, which avoids needing multiple resolution variants for an element that's purely decorative trust-signaling.

---

## 5. Rendering & Interaction Performance

### 5.1 Layout shift prevention for API-driven sections

Since `StatBlock`, `TeamGrid`, `CasesGrid`, and `SolutionsSection` all populate from API calls after mount (not server-rendered with data baked in, per the current CSR/Vite setup), each needs a **reserved-space skeleton** rather than a blank area that suddenly fills:

```jsx
// hooks/useCaseStudies.js pattern, applied consistently across data hooks
function useCaseStudies() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ...fetch logic
  return { data, isLoading };
}

// CasesGrid.jsx
const { data, isLoading } = useCaseStudies();
if (isLoading) return <CasesGridSkeleton count={6} />; // fixed-height placeholder cards, same grid dimensions
return <div className="grid ...">{data.map(...)}</div>;
```
The skeleton component should match the real content's exact dimensions (same card height, same grid gap) — a skeleton that's the wrong size just relocates the layout shift to when real content replaces it, rather than eliminating it.

### 5.2 Dark/light theme toggle — avoiding flash and re-render cost

The UX plan already specifies reading the stored theme in a blocking inline script before React hydrates (correct, prevents flash-of-wrong-theme). Performance addition: the toggle itself should only flip a `data-theme` attribute and let CSS variables cascade, not trigger a React re-render of the entire component tree:
```html
<!-- index.html, inline, before any stylesheet that depends on it -->
<script>
  (function() {
    const stored = localStorage.getItem('verve-theme');
    const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```
```js
// ThemeContext.jsx — toggleTheme only touches the DOM attribute + localStorage,
// context value itself can stay minimal (just the current theme string) so consuming
// components only re-render if they actually read the theme value, not on every toggle
```

### 5.3 Multi-tag case filtering — client vs. re-fetch

Per the UX plan's existing recommendation (filter client-side against an already-fetched list, don't re-hit the API per click) — performance note to add: this is correct *until* the case count grows large enough that fetching the full list + all cover images up front becomes the bottleneck instead. A reasonable threshold: if `cases` exceeds roughly 30-40 items, switch to server-side filtered pagination (`GET /api/cases?tag=Design&page=2`) rather than continuing to ship the entire dataset to every visitor regardless of which filter they end up choosing. Not needed at launch, but worth a comment in the code (`// revisit: switch to server-side filtering if case count > ~40`) so it isn't forgotten.

### 5.4 Debouncing and avoiding unnecessary re-renders

Contact form (`react-hook-form`) already avoids the classic "re-render on every keystroke" problem by design (it's uncontrolled-by-default), so no extra debouncing needed there. The one place worth explicit debouncing: if a search/filter input is ever added to Cases or Blog (per the UX plan's optional Magazine module) beyond the existing tag tabs, debounce that input (150-250ms) before triggering any filter recalculation or API call.

---

## 6. Backend & API Performance

### 6.1 Database indexing

Given the Mongoose schemas already defined, the following fields are queried frequently enough to need indexes rather than relying on full collection scans:

```js
// CaseStudy.js
caseStudySchema.index({ slug: 1 }, { unique: true });
caseStudySchema.index({ categories: 1 }); // supports the multi-tag filter, if/when moved server-side per §5.3
caseStudySchema.index({ isActive: 1, order: 1 }); // compound index for the common "active, sorted" query

// Service.js
serviceSchema.index({ slug: 1 }, { unique: true });
serviceSchema.index({ isActive: 1, order: 1 });

// ContactSubmission.js
contactSubmissionSchema.index({ status: 1, createdAt: -1 }); // for the admin's lead list, sorted newest-first
```

### 6.2 Response payload shaping

API responses should return only the fields each page actually renders, rather than full documents by default — particularly relevant for the Cases list view, which doesn't need the full `description` body (only used on `CaseDetail`):

```js
// caseStudy.controller.js
async function list(req, res) {
  const cases = await CaseStudy.find({ isActive: true })
    .select('title slug categories summary tags coverImage coverVideo layout order') // excludes full description/gallery
    .sort({ order: 1 });
  res.json(cases);
}

async function getBySlug(req, res) {
  const caseStudy = await CaseStudy.findOne({ slug: req.params.slug, isActive: true }); // full document, detail page needs everything
  res.json(caseStudy);
}
```

### 6.3 Compression middleware

Add alongside the existing `helmet`/CORS middleware stack in `app.js`:
```js
const compression = require('compression');
app.use(compression());
```
Gzip/Brotli compression on JSON API responses and any server-served static assets — a near-zero-effort addition with meaningful payload size reduction, especially for the larger case-study list responses.

### 6.4 HTTP caching headers for semi-static content

`Service`, `TeamMember`, and `CompanyStat` data changes infrequently (an admin manually updates it, not a high-frequency write path) — worth short-lived HTTP caching rather than treating every request as needing a fresh DB hit:

```js
// Applied to low-churn GET routes specifically, not to /api/contact or anything mutating
router.get('/services', cacheControl('public, max-age=300'), serviceController.list); // 5 min
router.get('/team', cacheControl('public, max-age=300'), teamController.list);
router.get('/stats', cacheControl('public, max-age=300'), statController.get);
```
```js
// server/src/middleware/cacheControl.js (new small middleware)
function cacheControl(value) {
  return (req, res, next) => {
    res.set('Cache-Control', value);
    next();
  };
}
```
`Cases` is deliberately excluded from this list at launch since it's more likely to be updated as new projects ship — revisit once update frequency is observed in practice.

### 6.5 Connection pooling (Mongoose default, confirm not overridden)

Mongoose's default connection pool size (100) is generally fine for a site this size — explicitly calling this out only to confirm `config/db.js` doesn't accidentally set `poolSize`/`maxPoolSize` to something small (like 5) under a mistaken impression that smaller is safer; an undersized pool causes queued/slow requests under any concurrent load (e.g., several admin tabs open plus normal visitor traffic).

---

## 7. Additions to Existing Dependency List

```json
{
  "server": {
    "compression": "^1.x",
    "sharp": "^0.33.x"
  },
  "client_devDependencies": {
    "rollup-plugin-visualizer": "^5.x"
  }
}
```
`sharp` is conditional — only needed if self-hosting images rather than using a managed asset CDN with on-the-fly transforms (§4.1). If Cloudinary/similar is the final choice, `sharp` can be dropped entirely.

---

## 8. Build Sequence Addition

Slots in as a final pre-launch phase, after the existing Polish phase (Phase 6) and after the Security Hardening phase already defined:

**Phase 7 — Performance pass (renumbers the prior "Optional phase 2" admin panel to Phase 8)**
1. Convert all page imports in `App.jsx` to `lazy()` + `Suspense`.
2. Add font preload tags and `font-display: optional` for hero-critical weights; confirm self-hosted `.woff2` files are subset to only the weights/styles in use.
3. Add `compression` middleware and DB indexes from §6.1–6.3.
4. Build skeleton/placeholder components for every API-driven section (`StatBlock`, `TeamGrid`, `CasesGrid`, `SolutionsSection`) to eliminate layout shift.
5. Implement the conditional-mount video hover pattern on `CaseCard` (§4.3) — audit that no card renders an active `<video src>` outside of hover state.
6. Run `rollup-plugin-visualizer` build output, address any unexpectedly large chunk.
7. Run Lighthouse/WebPageTest against the deployed staging build, compare against the targets in §1, and iterate on whichever metric misses first rather than optimizing uniformly.

---

## 9. Explicit Non-Goals (For Now)

- **No server-side rendering (SSR) / Next.js migration** — the existing plan commits to Vite + client-side React Router. SSR would meaningfully help LCP/SEO further, but it's an architecture change, not a tuning pass, and is out of scope for this plan. Worth a separate, deliberate conversation if SEO performance (rather than raw load speed) becomes the priority later.
- **No service worker / offline-first PWA setup** — not a meaningful need for a marketing/portfolio site; added complexity without a corresponding user benefit here.
- **No CDN selection made on this site's behalf** — asset delivery (§4) assumes *a* CDN/transform service exists but doesn't mandate Cloudinary specifically; that's a hosting decision to make alongside the deployment platform choice, not a performance-plan decision.
- **No real user monitoring (RUM) tooling specified** — recommend revisiting post-launch once real traffic exists to validate the targets in §1 against actual visitors rather than synthetic Lighthouse runs alone, but selecting a specific RUM tool is outside this plan's scope.
