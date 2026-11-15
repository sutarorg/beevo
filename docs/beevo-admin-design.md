# Beevo Admin Dashboard — Visual & Interaction Design Specification

**Brand Continuity:** Directly extends Phase 1 & Phase 2 Beevo tokens while tightening spatial density, corner radii, and chromatic restraint for daily financial and technical operations.

---

## 1. Brand & Visual Restraint Rules
- **Logo:** Reuses the exact geometric `BeevoLogo` (`variant="icon"` + concise `Admin` workspace badge in sidebar; never creates a second mark).
- **Color Hierarchy:**
  - **Primary Workspace Canvas:** Warm off-white `#FFFEFB` (`bg-beevo-canvas`)
  - **Elevated Panels & Tables:** Pure white `#FFFFFF` with `1px solid #ECE7DB` (`border-beevo-border`)
  - **Primary Typography:** Charcoal `#171717` / `#1B1916` (`text-beevo-ink`)
  - **Secondary & Label Typography:** Neutral gray `#6C675E` (`text-beevo-muted`) and body `#36332D` (`text-beevo-body`)
  - **Honey Accent (Used Sparingly):** `#FFC928` for active navigation indicator bar, primary action CTA, and primary chart focus series; `#C48400` (`text-beevo-honey-text`) for high-contrast text accents.
  - **Semantic Operational Tones (Subtle Borders + Tinted Pills Only):**
    - Healthy / Captured / Completed: Emerald (`text-emerald-800 bg-emerald-50 border-emerald-200`)
    - In Progress / Pending / Reserved: Amber (`text-amber-900 bg-amber-50 border-amber-200`)
    - Failed / Suspended / Error: Red (`text-red-800 bg-red-50 border-red-200`)
    - Neutral / Unconfigured / Estimate: Warm Stone (`text-beevo-body bg-beevo-canvas border-beevo-border`)
- **Explicit Anti-Patterns Excluded:** No purple charts, no rainbow charts, no decorative hero artwork, no excessive bento cards, no overly rounded (`rounded-3xl`) data tables, no mixed icon sets (`lucide-react` exclusively, consistent `1.75px` stroke).

---

## 2. Typography & Tabular Numerals
- **Headings (`Sora`):** Compact operational scale — Page Title `22–26px` (`font-extrabold tracking-[-0.025em]`), Section Title `15–16px`, KPI Value `22–26px tabular-nums`.
- **Body, Tables & Metadata (`Manrope`):** `13–14px` UI copy, `12–13px` table cells with `tabular-nums`, `11px` uppercase column headers (`tracking-[0.06em]`), monospace (`font-mono`) for IDs, Razorpay order/payment IDs, Cloudflare R2 storage keys, and audit JSON metadata.

---

## 3. Compact Operational Geometry
- **Cards / Panels:** `12px` radius (`rounded-[12px]`), crisp `1px solid #ECE7DB`, restrained elevation (`shadow-[0_1px_2px_rgba(23,23,23,0.03)]`).
- **Tables:** `10–12px` outer wrapper radius, compact `42–46px` row height, crisp horizontal row dividers (`divide-y divide-beevo-border`), subtle sticky/muted header (`bg-[#FAF8F3]`), zero outer page scroll.
- **Buttons & Inputs:** `8–10px` radius (`rounded-[10px]`), `min-h-[40px]` desktop / `min-h-[44px]` touch controls, crisp `2px` charcoal focus ring.

---

## 4. Responsive Shell Geometry (`320px–1920px`)
- **Desktop (`>= 1280px`):** Fixed `248px` left sidebar (`BeevoLogo` icon + `Admin` header, 10 primary routes grouped by function: Operations, Financials, Assets & System) + `60px` sticky top bar (Breadcrumb + Current Page title, Global Search box, Notifications shortcut, Admin Profile menu) + centered content rail (`max-w-[1440px]`).
- **Tablet (`600px–1279px`):** Collapsible slide-over sidebar drawer (`role="dialog" aria-modal="true"`), full breadcrumb & search in compact top bar, 2-column KPI & chart grids, horizontal-safe table containers + responsive card breakpoints.
- **Mobile (`320px–599px`):** Compact `56px` header (`Menu` trigger + `BeevoLogo` icon + current route label / search toggle + profile icon), slide-out drawer with Escape/backdrop close, stacked KPI cards, horizontal-scrolling filter chip strip where helpful, and semantic `<dl>` card-based table alternatives — `0px` horizontal document overflow down to `320px`.

---

## 5. Data Visualization Design (Restrained Custom SVG)
- **Library Decision:** Custom semantic React + SVG chart engine (`src/components/admin/AdminMetricChart.tsx`) rather than pulling a heavy React-18-bound charting package. Guarantees React 19 compatibility, deterministic SSR rendering, zero bundle bloat, and complete WCAG 2.2 keyboard tooltip control.
- **Palette:** Maximum 2 restrained series tones per chart: Beevo Charcoal (`#1B1916`) + Honey Amber (`#D99400`) — plus muted red (`#C53030`) exclusively for failure series.
- **Required Elements:** Chart title, unit label (`₹`, `min`, `users`, `credits`, `jobs`), active date range badge, axis labels, accessible hover/focus tooltip readout, and clean intentional zero-data canvas when no backend time series is present.
