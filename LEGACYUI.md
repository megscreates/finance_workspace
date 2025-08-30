
<body class="theme-slate">
  <a class="sr-only" href="#contentArea">Skip to content</a>

  <!-- ===== Header with theme swatch menu ===== -->
  <header class="app-header">
    <div class="brand">
      <div class="logo" aria-hidden="true">ƒ</div>
      <div class="titles">
        <h1>Finance Workspace</h1>
        <p class="subtitle">Consolidated Dashboard (sample data)</p>
      </div>
    </div>

    <div class="header-actions">
      <!-- Global Search -->
      <form id="globalSearchForm" role="search" style="display:flex; gap:.5rem; align-items:center">
        <label for="globalSearch" class="sr-only">Search</label>
        <input id="globalSearch" type="search" placeholder="Search clients, invoices, projects…" aria-label="Search the workspace" />
        <button class="btn-primary" type="submit" title="Search">Search</button>
      </form>

      <!-- Theme switcher (swatch menu populated by styles.html) -->
      <div class="theme-switcher" data-open="false">
        <button id="themeBtn" class="btn-tonal theme-trigger"
                type="button" aria-haspopup="listbox" aria-expanded="false"
                title="Change theme">
          <span class="swatch" aria-hidden="true"></span>
          <span class="label" id="themeBtnLabel">Theme</span>
          <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M5.6 7.6a1 1 0 0 1 1.4 0L10 10.6l3-3a1 1 0 1 1 1.4 1.4l-3.7 3.7a1 1 0 0 1-1.4 0L5.6 9a1 1 0 0 1 0-1.4Z"/></svg>
        </button>
        <div class="menu" role="listbox" aria-label="Select theme" tabindex="-1">
          <!-- items injected by styles.html script -->
        </div>
      </div>
    </div>
  </header>

  <!-- ===== Main workspace ===== -->
  <main class="workspace">
    <!-- Left subnav -->
    <aside class="subnav" aria-label="Main Sections">
      <!-- ===== Subnav (primary tabs) ===== -->
<nav class="subnav" role="tablist" aria-label="Primary navigation">
<button class="tab active" data-target="dashboard" aria-selected="true">Dashboard</button>
<button class="tab" data-target="cash_page">Finance</button>
<button class="tab" data-target="collections">Receivables</button>
<button class="tab" data-target="payments">Payables</button>
<button class="tab" data-target="projects">Projects</button>
<button class="tab" data-target="service">Service</button>
<button class="tab" data-target="dq">Data Quality</button>
<button class="tab" data-target="search">Utilities</button>
<button class="tab" data-target="admin">Admin</button>
</nav>
    </aside>

    <!-- Right content with tabs -->
    <section class="content" aria-live="polite">
      <nav id="pageTabs" class="tabs" role="tablist" aria-label="Section Pages"></nav>

      <div id="contentArea" class="content-body fade">
  <div class="pane">
    <!-- Dashboard visible on first paint -->
    <section id="page-dashboard" class="page">
      <!-- DASHBOARD -->
<div class="section">
  <div class="section-header">
    <h2>My Dashboard</h2>
    <div class="row">
      <span class="badge">Live Sample Data</span>
      <span class="badge" data-tint="a">Theme-aware</span>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Monthly Revenue</div>
      <div class="kpi-value">$1.42M</div>
      <div class="kpi-trend up">▲ 6.3% vs last month</div>
      <div class="progress"><span id="kpiRevBar" style="width:0%"></span></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Gross Margin</div>
      <div class="kpi-value">38.4%</div>
      <div class="kpi-trend up">▲ 1.1 pts</div>
      <div class="progress"><span id="kpiGMBar" style="width:0%"></span></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Open A/R</div>
      <div class="kpi-value">$612k</div>
      <div class="kpi-trend down">▼ –2.5% DSO</div>
      <div class="progress"><span id="kpiARBar" style="width:0%"></span></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">On-time Pay</div>
      <div class="kpi-value">92.1%</div>
      <div class="kpi-trend up">▲ 0.9 pts</div>
      <div class="progress"><span id="kpiOTPBar" style="width:0%"></span></div>
    </div>
  </div>
</div>

<!-- CHARTS -->
<div class="widget-grid">

  <!-- Revenue trend (area) -->
  <section class="widget span-2" aria-labelledby="w_rev_title">
    <header class="widget-header">
      <h3 id="w_rev_title" class="widget-title">Revenue Trend (12m)</h3>
      <div class="widget-actions">
        <span class="chip"><span class="dot a"></span>Actual</span>
        <span class="chip"><span class="dot b"></span>Forecast</span>
      </div>
    </header>
    <div class="widget-body">
      <div id="chartRevenueArea" style="height:280px"></div>
    </div>
  </section>

  <!-- A/R aging (column) -->
  <section class="widget" aria-labelledby="w_ar_title">
    <header class="widget-header">
      <h3 id="w_ar_title" class="widget-title">A/R Aging</h3>
      <div class="widget-actions">
        <span class="pill-count" data-tint="c">38</span>
      </div>
    </header>
    <div class="widget-body">
      <div id="chartARAging" style="height:220px"></div>
    </div>
  </section>

  <!-- Product mix (donut) -->
  <section class="widget" aria-labelledby="w_mix_title">
    <header class="widget-header">
      <h3 id="w_mix_title" class="widget-title">Product Mix</h3>
    </header>
    <div class="widget-body">
      <div id="chartProductDonut" style="height:220px"></div>
    </div>
  </section>

  <!-- Cash vs Burn (combo) -->
  <section class="widget" aria-labelledby="w_cash_title">
    <header class="widget-header">
      <h3 id="w_cash_title" class="widget-title">Cash vs Burn</h3>
    </header>
    <div class="widget-body">
      <div id="chartCashCombo" style="height:220px"></div>
    </div>
  </section>

  <!-- Gauges -->
  <section class="widget" aria-labelledby="w_gauge_title">
    <header class="widget-header">
      <h3 id="w_gauge_title" class="widget-title">Health Gauges</h3>
    </header>
    <div class="widget-body" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:.5rem;">
      <div id="gaugeUtil" style="height:160px"></div>
      <div id="gaugeCSAT" style="height:160px"></div>
      <div id="gaugeQuota" style="height:160px"></div>
    </div>
  </section>

  <!-- Project timeline -->
  <section class="widget span-3" aria-labelledby="w_timeline_title">
    <header class="widget-header">
      <h3 id="w_timeline_title" class="widget-title">Key Project Timeline</h3>
    </header>
    <div class="widget-body">
      <div id="timelineProjects" style="height:220px"></div>
    </div>
  </section>

</div>




  </main>

  <footer class="app-footer">
    <span>© 2025 Finance Workspace</span>
  </footer>
</body>
<style>
/* =========================================================
   Finance Workspace — Polished Glass UI v3 (Bubble/Meybeel family)
   ========================================================= */

/* ---------- Reset / Base ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

html {
  font-size: 15px;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  line-height: 1.58;
  color: var(--ink-900);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-variant-numeric: tabular-nums;
}

img,
svg,
video {
  max-width: 100%;
  display: block;
}

button {
  font: inherit;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.page { 
  display: none; 
}
.page:not(.hidden) { 
  display: block; 
}

/* ---------- Global Motion & Focus ---------- */
:root {
  --ease: cubic-bezier(.22, .61, .36, 1);
  --dur-1: 140ms;
  --dur-2: 220ms;
  --dur-3: 380ms;
}

* {
  transition: background-color var(--dur-1) var(--ease), color var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease);
}

:focus-visible {
  outline: 2px solid transparent;
  box-shadow: 0 0 0 4px var(--ring);
  border-radius: 10px;
}

@media (prefers-reduced-motion:reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* ---------- Sidebar Enhancements ---------- */
.subnav-item {
  transition: background 200ms ease, transform 150ms ease;
}

.subnav-item:hover {
  background: color-mix(in srgb, var(--accent) 25%, var(--glass-2) 75%);
  transform: translateX(4px); /* Slightly shift on hover */
}

.subnav-item.active {
  background: var(--tint);
  border-color: var(--accent);
  box-shadow: inset 0 0 0 4px var(--accent); /* Add a border effect */
}

.subnav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: var(--accent); /* A small vertical accent line */
}

@media (max-width:1080px) {
  .subnav {
    position: absolute;
    left: -260px;
    top: 0;
    bottom: 0;
    transition: left 300ms ease;
    z-index: 10;
  }

  .subnav.visible {
    left: 0;
  }

  #sidebarToggle {
    display: block;
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 20;
  }
}

/* Other existing CSS rules remain unchanged */

  /* =========================================================
   Finance Workspace — Polished Glass UI v3 (Bubble/Meybeel family)
   ========================================================= */

  /* ---------- Reset / Base ---------- */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
  }

  html {
    font-size: 15px;
  }

  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    line-height: 1.58;
    color: var(--ink-900);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-variant-numeric: tabular-nums;
  }

  img,
  svg,
  video {
    max-width: 100%;
    display: block;
  }

  button {
    font: inherit;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* one-at-a-time page visibility */
.page { display: none; }
.page:not(.hidden) { display: block; }


  /* ---------- Global Motion & Focus ---------- */
  :root {
    --ease: cubic-bezier(.22, .61, .36, 1);
    --dur-1: 140ms;
    --dur-2: 220ms;
    --dur-3: 380ms;
  }

  * {
    transition: background-color var(--dur-1) var(--ease), color var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease);
  }

  :focus-visible {
    outline: 2px solid transparent;
    box-shadow: 0 0 0 4px var(--ring);
    border-radius: 10px;
  }

  @media (prefers-reduced-motion:reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }

  /* ---------- Base tokens (overridden per theme) ---------- */
  :root {
    --bg: linear-gradient(180deg, #FCFEFF, #F6F9FD);

    /* Glass surfaces — slightly more transparent */
    --glass-1: rgba(255, 255, 255, .74);
    --glass-2: rgba(255, 255, 255, .62);
    --glass-3: rgba(255, 255, 255, .50);
    --glass-border: rgba(16, 24, 40, .06);

    /* Neutral ink scale */
    --ink-900: #0F172A;
    --ink-700: #344155;
    --ink-500: #5B6B7A;
    --ink-300: #93A1B1;

    /* Accent set (per-theme overrides) */
    --accent: #6CAFA0;
    --accent-2: #A8E0CE;
    --accent-3: #FFF1D6;
    --tint: color-mix(in srgb, var(--accent) 12%, #fff 88%);
    --ring: rgba(108, 175, 160, .22);

    /* Charts */
    --chart-a: var(--accent);
    --chart-b: #8FD6B3;
    --chart-c: #F2C172;
    --chart-d: #E56B6F;

    /* Misc */
    --border: #E6EAF2;
    --radius: 16px;
    --radius-sm: 12px;
    --shadow-1: 0 1px 2px rgba(16, 24, 40, .04), 0 2px 8px rgba(16, 24, 40, .06);
    --shadow-2: 0 8px 22px rgba(16, 24, 40, .10);

    /* Buttons */
    --btn-radius: 12px;
    --btn-border: color-mix(in srgb, var(--accent) 18%, var(--glass-border));
    --btn-glass: color-mix(in srgb, var(--accent) 8%, #fff 92%);
  }

  /* =========================================================
   THEMES — Bubble/Meybeel-inspired family
   ========================================================= */

  .theme-slate {
    --accent: #3B82F6;
    --accent-2: #94A3B8;
    --accent-3: #E2E8F0;
    --tint: color-mix(in srgb, #3B82F6 12%, #fff 88%);
    --ring: rgba(59, 130, 246, .22);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #EAF2FFAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #F2F5F9AA 0%, transparent 60%),
      linear-gradient(180deg, #FFFFFF, #F7FAFF);
    --ink-900: #0F172A;
    --ink-700: #334155;
    --ink-500: #64748B;
    --ink-300: #A3AFBF;
    --chart-a: #3B82F6;
    --chart-b: #22D3EE;
    --chart-c: #A78BFA;
    --chart-d: #10B981;
  }

  .theme-bubble {
    --accent: #5F6CF1;
    --accent-2: #C084FC;
    --accent-3: #F472B6;
    --tint: color-mix(in srgb, #5F6CF1 14%, #fff 86%);
    --ring: rgba(95, 108, 241, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #ECE9FFAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #FFE4F5AA 0%, transparent 60%),
      linear-gradient(180deg, #FEFEFF, #F6F8FD);
    --ink-900: #141226;
    --ink-700: #3B3660;
    --ink-500: #6C6AA2;
    --ink-300: #A8A6D3;
    --chart-a: #5F6CF1;
    --chart-b: #C084FC;
    --chart-c: #F472B6;
    --chart-d: #22D3EE;
  }

  .theme-meybeel {
    --accent: #5BAF88;
    --accent-2: #8FD6B3;
    --accent-3: #F0EBD8;
    --tint: color-mix(in srgb, #5BAF88 16%, #fff 84%);
    --ring: rgba(91, 175, 136, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #E9F7F0AA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #FFF7E6AA 0%, transparent 60%),
      linear-gradient(180deg, #FDFFFE, #F7FBFA);
    --ink-900: #0E1A16;
    --ink-700: #2F4D41;
    --ink-500: #5D7D72;
    --ink-300: #9CB7AE;
    --chart-a: #5BAF88;
    --chart-b: #8FD6B3;
    --chart-c: #E9C46A;
    --chart-d: #2A9D8F;
  }

  .theme-seagrass {
    --accent: #2AA7A1;
    --accent-2: #7DDCE3;
    --accent-3: #E2FFF3;
    --tint: color-mix(in srgb, #2AA7A1 15%, #fff 85%);
    --ring: rgba(42, 167, 161, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #E3FBFFAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #EAFBF3AA 0%, transparent 60%),
      linear-gradient(180deg, #FDFFFF, #F6FBFB);
    --ink-900: #0E1A19;
    --ink-700: #234A48;
    --ink-500: #4C7C79;
    --ink-300: #95BDB9;
    --chart-a: #2AA7A1;
    --chart-b: #7DDCE3;
    --chart-c: #34D399;
    --chart-d: #22C55E;
  }

  .theme-peach {
    --accent: #FF8C66;
    --accent-2: #FFD3A6;
    --accent-3: #FFF1DF;
    --tint: color-mix(in srgb, #FF8C66 16%, #fff 84%);
    --ring: rgba(255, 140, 102, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #FFF3E5AA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #FFF9F2AA 0%, transparent 60%),
      linear-gradient(180deg, #FFFDF9, #FFF7F1);
    --ink-900: #2A1510;
    --ink-700: #6A3E33;
    --ink-500: #9A6D61;
    --ink-300: #C7A49C;
    --chart-a: #FF8C66;
    --chart-b: #FFD3A6;
    --chart-c: #F59E0B;
    --chart-d: #F97316;
  }

  .theme-lilac {
    --accent: #7C6EE6;
    --accent-2: #D6B4FF;
    --accent-3: #FFD7EA;
    --tint: color-mix(in srgb, #7C6EE6 14%, #fff 86%);
    --ring: rgba(124, 110, 230, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #EEEAFEAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #FFF0F6AA 0%, transparent 60%),
      linear-gradient(180deg, #FFFFFF, #F8F7FF);
    --ink-900: #171329;
    --ink-700: #3E3964;
    --ink-500: #6B6694;
    --ink-300: #A7A3C8;
    --chart-a: #7C6EE6;
    --chart-b: #D6B4FF;
    --chart-c: #FF8AB3;
    --chart-d: #6EE7B7;
  }

  .theme-glacier-soft {
    --accent: #47A9FF;
    --accent-2: #9CD3FF;
    --accent-3: #EAF5FF;
    --tint: color-mix(in srgb, #47A9FF 14%, #fff 86%);
    --ring: rgba(71, 169, 255, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #E6F5FFAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #EEF5FFAA 0%, transparent 60%),
      linear-gradient(180deg, #FEFFFF, #F4F8FB);
    --ink-900: #0F172A;
    --ink-700: #1F3348;
    --ink-500: #4A6076;
    --ink-300: #93A6BA;
    --chart-a: #47A9FF;
    --chart-b: #22D3EE;
    --chart-c: #818CF8;
    --chart-d: #14B8A6;
  }

  .theme-pistachio {
    --accent: #58D39D;
    --accent-2: #B7F0D4;
    --accent-3: #F1FFF6;
    --tint: color-mix(in srgb, #58D39D 16%, #fff 84%);
    --ring: rgba(88, 211, 157, .24);
    --bg:
      radial-gradient(1200px 700px at -12% -12%, #EAFEFAAA 0%, transparent 55%),
      radial-gradient(900px 620px at 110% -14%, #F6FFF8AA 0%, transparent 60%),
      linear-gradient(180deg, #FDFFFE, #F6FBF9);
    --ink-900: #0D1A14;
    --ink-700: #1E4A37;
    --ink-500: #4E7D68;
    --ink-300: #96B8A9;
    --chart-a: #58D39D;
    --chart-b: #34D399;
    --chart-c: #84CC16;
    --chart-d: #22C55E;
  }

  /* ---------- Typography hooks ---------- */
  h1,
  h2,
  h3,
  h4 {
    font-family: "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    letter-spacing: .2px;
    line-height: 1.22;
    color: var(--ink-900);
  }

  a {
    color: var(--accent);
    text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }

  a:hover {
    text-decoration-color: var(--accent);
  }

  .subtitle {
    color: var(--ink-500);
  }

  .widget-title {
    color: var(--ink-900);
  }

  .kpi-value {
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 70%, #000 30%), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /* ---------- Header ---------- */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .8rem;
    padding: .9rem 1.1rem;
    background: var(--glass-1);
    border-bottom: 1px solid var(--glass-border);
    backdrop-filter: blur(12px) saturate(120%);
    box-shadow: 0 1px 10px rgba(16, 24, 40, .06);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .logo {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-weight: 800;
    color: #fff;
    letter-spacing: .2px;
    background:
      radial-gradient(120% 120% at 30% 10%, #fff8, transparent 40%),
      linear-gradient(135deg, var(--accent), var(--accent-2));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55), 0 8px 18px rgba(0, 0, 0, .08);
  }

  .titles h1 {
    margin: 0;
    font-size: 1.12rem;
  }

  .subtitle {
    margin: 0;
    font-size: .84rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: .55rem;
  }

  /* Global search */
  #globalSearch {
    min-width: 280px;
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    padding: .55rem .85rem;
    transition: box-shadow var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease), background var(--dur-2) var(--ease);
  }

  #globalSearch:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--ring);
  }

  /* ---------- Tabs ---------- */
  .tabs {
    display: flex;
    gap: .45rem;
    padding: .55rem 1.1rem;
    background: var(--glass-1);
    border-bottom: 1px solid var(--glass-border);
    backdrop-filter: blur(10px) saturate(115%);
  }

  .tab {
    position: relative;
    padding: .5rem .85rem;
    border: 0;
    background: transparent;
    color: var(--ink-900);
    border-radius: 999px;
    cursor: pointer;
    font-weight: 600;
    transition: background var(--dur-1) var(--ease), transform var(--dur-1) var(--ease);
  }

  .tab:hover {
    background: var(--glass-2);
    transform: translateY(-1px);
  }

  .tab[aria-selected="true"] {
    background: var(--tint);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 24%, #ffffff 76%);
  }

  /* ---------- Layout ---------- */
  .workspace {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 1.1rem;
    padding: 1.1rem;
  }

  @media (max-width:1080px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .subnav {
      order: 2;
    }
  }

  .subnav {
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-1);
    padding: .6rem;
    backdrop-filter: blur(12px) saturate(120%);
  }

  .subnav-list {
    display: grid;
    gap: .3rem;
  }

  .subnav-item {
    width: 100%;
    text-align: left;
    padding: .55rem 1rem .55rem 1.2rem;
    background: transparent;
    color: var(--ink-900);
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    transition: background var(--dur-1) var(--ease), transform var(--dur-1) var(--ease);
  }

  .subnav-item:hover {
    background: var(--glass-2);
    transform: translateX(1px);
  }

  .subnav-item.active {
    background: var(--tint);
    border-color: transparent;
  }

  .subnav-item.active::before {
    content: "";
    position: absolute;
    left: 6px;
    top: 6px;
    bottom: 6px;
    width: 5px;
    border-radius: 6px;
    background: linear-gradient(180deg, var(--accent), var(--accent-2));
  }

  .content {
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-2);
    padding: 1rem;
    min-height: 62vh;
    backdrop-filter: blur(14px) saturate(120%);
  }

  .pane {
    display: block;
  }

  /* ---------- Buttons ---------- */
  :where(button, .btn) {
    --_bg: var(--btn-glass);
    --_br: var(--btn-border);
    --_fg: var(--ink-900);
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    padding: .56rem .9rem;
    border-radius: var(--btn-radius);
    border: 1px solid var(--_br);
    background: var(--_bg);
    color: var(--_fg);
    cursor: pointer;
    user-select: none;
    transition: transform var(--dur-1) var(--ease), box-shadow var(--dur-2) var(--ease), background var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }

  :where(button, .btn):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(16, 24, 40, .12);
  }

  :where(button, .btn):active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(16, 24, 40, .08);
  }

  .btn-primary {
    --_bg: linear-gradient(180deg,
        color-mix(in srgb, var(--accent) 96%, white 4%),
        color-mix(in srgb, var(--accent) 82%, black 18%));
    --_br: transparent;
    --_fg: #fff;
    border: 0;
    box-shadow: none;
    /* softer as requested */
  }

  .btn-primary:hover {
    --_bg: linear-gradient(180deg,
        color-mix(in srgb, var(--accent) 98%, white 2%),
        color-mix(in srgb, var(--accent) 88%, black 12%));
  }

  .btn-tonal {
    --_bg: color-mix(in srgb, var(--accent) 18%, #ffffff 82%);
    --_br: color-mix(in srgb, var(--accent) 26%, #E5EAF4);
  }

  .btn-ghost {
    --_bg: transparent;
    --_br: transparent;
  }

  .btn-ghost:hover {
    --_bg: var(--glass-2);
  }

  .btn-outline {
    border: 1px solid transparent;
    background-image: linear-gradient(var(--glass-2), var(--glass-2)),
      linear-gradient(90deg, var(--accent), var(--accent-2));
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }

  .btn-link {
    --_bg: transparent;
    --_br: transparent;
    --_fg: var(--accent);
    padding: .2rem .1rem;
    border-radius: 8px;
  }

  .btn-link:hover {
    background: color-mix(in srgb, var(--accent) 12%, #fff 88%);
  }

  .btn-chip {
    font-size: .84rem;
    padding: .34rem .6rem;
    border-radius: 999px;
    --_bg: color-mix(in srgb, var(--accent) 10%, #fff 90%);
    --_br: color-mix(in srgb, var(--accent) 24%, #E7EDF9);
  }

  /* ---------- Form Controls ---------- */
  :where(input, textarea, select) {
    width: 100%;
    padding: .58rem .7rem;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    background: var(--glass-1);
    color: var(--ink-900);
    outline: none;
    transition: border-color var(--dur-2) var(--ease), box-shadow var(--dur-2) var(--ease), background var(--dur-2) var(--ease);
  }

  :where(input, textarea, select):focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--ring);
  }

  /* ---------- Tables ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(6px);
  }

  thead th {
    text-align: left;
    font-weight: 700;
    color: var(--ink-700);
    background: color-mix(in srgb, #ffffff 85%, var(--tint) 15%);
    border-bottom: 1px solid var(--border);
    font-size: .9rem;
  }

  th,
  td {
    padding: .64rem .7rem;
    border-bottom: 1px solid var(--border);
    font-size: .92rem;
    color: var(--ink-900);
  }

  tbody tr:hover {
    background: color-mix(in srgb, var(--tint) 42%, #ffffff 58%);
  }

  /* ---------- Cards & Widgets ---------- */
  .card,
  .widget {
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: var(--shadow-1);
    backdrop-filter: blur(10px);
  }

  .card {
    padding: .95rem;
  }

  .section {
    padding: .95rem;
  }

  .section+.section {
    border-top: 1px solid var(--border);
    background: transparent;
  }

  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: .6rem;
    margin-bottom: .6rem;
  }

  .section-header h2,
  .section-header h3 {
    margin: 0;
  }

  /* KPIs */
  .kpi-grid {
    display: grid;
    gap: .9rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .kpi {
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    padding: .85rem;
    box-shadow: var(--shadow-1);
    backdrop-filter: blur(6px);
  }

  .kpi-label {
    font-size: .82rem;
    color: var(--ink-500);
  }

  .kpi-value {
    font-size: 1.46rem;
    font-weight: 800;
    letter-spacing: .2px;
    margin-top: .1rem;
  }

  .kpi-trend {
    margin-top: .3rem;
    font-size: .82rem;
  }

  .kpi-trend.up {
    color: #16a34a;
  }

  .kpi-trend.down {
    color: #dc2626;
  }

  .progress {
    height: 8px;
    background: #EEF2F7;
    border-radius: 999px;
    overflow: hidden;
    margin-top: .45rem;
  }

  .progress>span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--chart-a), var(--chart-b));
    border-radius: 999px;
    transition: width 600ms var(--ease), background var(--dur-2) var(--ease);
  }

  /* Widgets grid */
  .widget-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 1rem;
  }

  .widget {
    grid-column: span 4 / span 4;
    display: flex;
    flex-direction: column;
    min-height: 220px;
    transition: transform var(--dur-1) var(--ease), box-shadow var(--dur-2) var(--ease);
  }

  .widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(16, 24, 40, .12);
  }

  .widget.span-2 {
    grid-column: span 8 / span 8;
  }

  .widget.span-3 {
    grid-column: span 12 / span 12;
  }

  @media (max-width:1200px) {
    .widget {
      grid-column: span 6 / span 6;
    }

    .widget.span-2 {
      grid-column: span 12 / span 12;
    }
  }

  @media (max-width:720px) {

    .widget,
    .widget.span-2,
    .widget.span-3 {
      grid-column: 1 / -1;
    }
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .45rem;
    padding: .75rem .85rem;
    border-bottom: 1px solid var(--border);
    background: var(--glass-2);
  }

  .widget-title {
    margin: 0;
    font-size: .98rem;
    font-weight: 700;
    letter-spacing: .2px;
  }

  .widget-actions {
    display: flex;
    gap: .4rem;
    align-items: center;
  }

  .widget-body {
    padding: .85rem;
    display: grid;
    align-content: start;
    gap: .7rem;
  }

  .toolbar {
    display: flex;
    gap: .45rem;
    align-items: center;
  }

  /* Badges / Chips */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .78rem;
    font-weight: 700;
    padding: .26rem .5rem;
    background: color-mix(in srgb, var(--accent) 10%, #ffffff 90%);
    color: var(--ink-900);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, #E7EDF9);
    border-radius: 999px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .82rem;
    font-weight: 600;
    padding: .26rem .55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 10%, #fff 90%);
    color: var(--ink-900);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, #E7EDF9);
  }

  /* Avatars */
  .avatar {
    --size: 36px;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    display: inline-grid;
    place-items: center;
    font-weight: 700;
    color: #fff;
    background: radial-gradient(120% 120% at 30% 10%, #fff8, transparent 40%),
      linear-gradient(135deg, var(--chart-a), var(--chart-b));
    border: 1px solid rgba(255, 255, 255, .6);
    box-shadow: 0 4px 12px rgba(16, 24, 40, .12);
    user-select: none;
  }

  .avatar.sm {
    --size: 24px;
    font-size: .72rem;
  }

  .avatar.lg {
    --size: 48px;
    font-size: 1rem;
  }

  /* Inline SVG hooks (fallbacks) */
  .line-a polyline {
    stroke: var(--chart-a);
    opacity: .95;
  }

  .donut-a {
    stroke: var(--chart-a);
  }

  .donut-b {
    stroke: var(--chart-b);
  }

  .donut-c {
    stroke: var(--chart-c);
  }

  .donut-d {
    stroke: var(--chart-d);
  }

  /* Utilities */
  .loading {
    display: grid;
    place-items: center;
    height: 40vh;
    color: var(--ink-500);
  }

  .grid {
    display: grid;
    gap: 1rem;
  }

  .grid.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width:1100px) {
    .grid.cols-3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width:720px) {

    .grid.cols-2,
    .grid.cols-3 {
      grid-template-columns: 1fr;
    }
  }

  /* Print */
  @media print {

    .app-header,
    .app-footer,
    .tabs,
    .subnav {
      display: none !important;
    }

    .workspace {
      padding: 0;
    }

    .content {
      border: 0;
      box-shadow: none;
      padding: 0;
      background: #fff;
    }

    body {
      background: #fff;
    }
  }

  /* === Theme Switcher — global styles (popover) === */
  .theme-switcher {
    position: relative;
  }

  .theme-trigger {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    min-width: 150px;
  }

  .theme-trigger .swatch {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55);
  }

  .theme-trigger .label {
    min-width: 72px;
    text-align: left;
  }

  .theme-switcher .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 70;
    min-width: 240px;
    max-height: 60vh;
    overflow: auto;
    background: var(--glass-1);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    box-shadow: var(--shadow-2);
    backdrop-filter: blur(10px) saturate(120%);
    padding: .4rem;
    display: none;
    animation: menuIn 160ms var(--ease);
  }

  .theme-switcher[data-open="true"] .menu {
    display: block;
  }

  @keyframes menuIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .theme-item {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: .6rem;
    padding: .45rem .55rem;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    outline: 0;
    border: 1px solid transparent;
  }

  .theme-item:hover {
    background: var(--glass-2);
  }

  .theme-item[aria-selected="true"] {
    background: var(--tint);
    border-color: color-mix(in srgb, var(--accent) 25%, var(--glass-border));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 25%, #fff);
  }

  .theme-item .mini {
    width: 28px;
    height: 24px;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .6);
    background: linear-gradient(135deg, var(--t1), var(--t2));
  }

  .theme-item .name {
    font-weight: 700;
  }

  .theme-item .tones {
    display: flex;
    gap: 6px;
  }

  .theme-item .tone {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .06);
  }

  @media (max-width:720px) {
    .theme-switcher .menu {
      left: 0;
      right: 0;
      width: min(100vw - 2rem, 420px);
      margin-inline: auto;
    }
  }

</style>

/* =========================================================
   Unified Theme Engine + Charts bridge + robust switcher mount
   - SAFE for early execution (head) — waits for <body>
   ========================================================= */
(function(){
  // --- Wait until <body> exists
  const bodyReady = new Promise(resolve => {
    if (document.body) resolve();
    else if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', () => resolve(), { once:true });
    } else {
      // DOM already interactive but body not set — microtask
      queueMicrotask(resolve);
    }
  });
  const getRoot = () => document.body || document.documentElement;

  // ---- Read theme list (id + name) from JSON
  function readThemeList(){
    try{
      const node = document.getElementById('fw-themes');
      const data = node ? JSON.parse(node.textContent || '[]') : [];
      return Array.isArray(data) ? data : [];
    }catch(e){ return []; }
  }
  const THEME_LIST = readThemeList();

  // ---- Probe CSS vars of a theme by temporary element (after body is ready)
  async function probeThemeVars(themeId){
    await bodyReady;
    const probe = document.createElement('div');
    probe.className = themeId;
    probe.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:1px; height:1px;';
    getRoot().appendChild(probe);
    const cs = getComputedStyle(probe);
    const get = (n, fb='') => (cs.getPropertyValue(n).trim() || fb);
    const accent  = get('--accent', '#3B82F6');
    const accent2 = get('--accent-2', '#94A3B8');
    const seriesA = get('--chart-a', accent);
    const seriesB = get('--chart-b', accent2);
    const seriesC = get('--chart-c', '#A78BFA');
    const seriesD = get('--chart-d', '#10B981');
    probe.remove();
    return { t1:accent, t2:accent2, tones:[seriesA,seriesB,seriesC,seriesD] };
  }

  const THEMES = THEME_LIST.map(t => Object.assign({ t1:null, t2:null, tones:null }, t));
  async function ensureThemeMeta(theme){
    if (theme.t1 && theme.t2 && theme.tones) return theme;
    const meta = await probeThemeVars(theme.id);
    theme.t1 = meta.t1; theme.t2 = meta.t2; theme.tones = meta.tones;
    return theme;
  }

  // ---- applyTheme + event (safe for early call)
  function applyTheme(theme){
    const root = getRoot();
    // if still no body, store to localStorage and bail — ensureBodyTheme will apply
    if (!root) { localStorage.setItem('fw_theme', theme); return; }
    root.className = root.className
      .split(' ')
      .filter(c=>c && !/^theme-/.test(c))
      .concat(theme)
      .join(' ');
    localStorage.setItem('fw_theme', theme);
    window.dispatchEvent(new CustomEvent('fw:theme-change', { detail:{ theme } }));
  }
  window.applyTheme = window.applyTheme || applyTheme;

  // Ensure body has a theme (runs after bodyReady)
  (async function ensureBodyTheme(){
    await bodyReady;
    const root = getRoot();
    const saved = localStorage.getItem('fw_theme');
    const known = THEME_LIST.map(t=>t.id);
    const fallback = known.includes('theme-slate') ? 'theme-slate' : (known[0] || 'theme-slate');
    const current = (root.className.split(' ').find(c=>/^theme-/.test(c)) || saved || fallback);
    if (!root.classList.contains(current)) root.classList.add(current);
  })();

  // ---- Google Charts bridge
  const FWGC = window.FWGC = window.FWGC || {};
  FWGC.palette = function(){
    const g = getComputedStyle(getRoot());
    const v = n => g.getPropertyValue(n).trim();
    const p = {
      a: v('--chart-a') || v('--accent') || '#3B82F6',
      b: v('--chart-b') || '#22D3EE',
      c: v('--chart-c') || '#A78BFA',
      d: v('--chart-d') || '#10B981',
      text:  v('--ink-900') || '#0F172A',
      muted: v('--ink-500') || '#64748B',
      grid:  v('--border')  || '#E5E7EB',
      bg:    v('--glass-1') || '#F5F7FB'
    };
    p.series = [p.a,p.b,p.c,p.d];
    return p;
  };
  FWGC.ensureLoaded = function(cb){
    function go(){ if (google && google.visualization) cb(); }
    if (!(window.google && google.charts && google.charts.load)){
      return setTimeout(()=>FWGC.ensureLoaded(cb), 80);
    }
    if (!google.visualization){
      google.charts.load('current', { packages:['corechart','gauge','timeline'] });
      google.charts.setOnLoadCallback(()=>cb());
    } else { go(); }
  };
  const listeners = new Set();
  FWGC.onRedraw = fn => { listeners.add(fn); return ()=>listeners.delete(fn); };
  function fire(){ listeners.forEach(fn=>{ try{ fn(); }catch(_){}}); }
  window.addEventListener('fw:theme-change', fire);
  window.addEventListener('resize', fire);

  // ---- Header switcher mount (robust, body-safe)
  function mountSwitcher(){
    const rootEl = document.querySelector('.theme-switcher');
    if (!rootEl) return false;

    const btn    = rootEl.querySelector('#themeBtn');
    const label  = rootEl.querySelector('#themeBtnLabel');
    const menu   = rootEl.querySelector('.menu');
    const swatch = btn?.querySelector('.swatch');
    if (!menu || menu.children.length) return !!menu;

    // Build items (async derive tones from CSS if needed)
    (async () => {
      const itemsHTML = await Promise.all(THEMES.map(async t => {
        const m = await ensureThemeMeta(t);
        const tones = m.tones.map(c=>`<span class="tone" style="background:${c}"></span>`).join('');
        return `
          <div class="theme-item" role="option" tabindex="-1" data-id="${t.id}"
               style="--t1:${m.t1}; --t2:${m.t2};">
            <span class="mini" aria-hidden="true"></span>
            <span class="name">${t.name}</span>
            <span class="tones" aria-hidden="true">${tones}</span>
          </div>`;
      }));
      menu.innerHTML = itemsHTML.join('');

      const items = Array.from(menu.querySelectorAll('.theme-item'));

      function setButtonVisual(themeId){
        const t = THEMES.find(x=>x.id===themeId) || THEMES[0];
        // t now has t1/t2 thanks to ensureThemeMeta above
        if (label)  label.textContent = t.name;
        if (swatch) swatch.style.background = `linear-gradient(135deg, ${t.t1}, ${t.t2})`;
        items.forEach(el => el.setAttribute('aria-selected', String(el.dataset.id===t.id)));
      }
      function openMenu(){
        rootEl.dataset.open='true';
        btn?.setAttribute('aria-expanded','true');
        const current = localStorage.getItem('fw_theme')
          || getRoot().className.split(' ').find(c=>/^theme-/.test(c))
          || (THEMES[0] && THEMES[0].id);
        const el = items.find(i=>i.dataset.id===current) || items[0];
        el.setAttribute('tabindex','0'); el.focus();
      }
      function closeMenu(){
        rootEl.dataset.open='false';
        btn?.setAttribute('aria-expanded','false');
        btn?.focus();
        items.forEach(i=>i.setAttribute('tabindex','-1'));
      }
      function chooseTheme(id){
        window.applyTheme(id);
        setButtonVisual(id);
      }

      const initial = localStorage.getItem('fw_theme')
        || getRoot().className.split(' ').find(c=>/^theme-/.test(c))
        || (THEMES[0] && THEMES[0].id);
      setButtonVisual(initial);

      btn?.addEventListener('click', ()=> rootEl.dataset.open==='true' ? closeMenu() : openMenu());
      menu.addEventListener('click', e=>{
        const it = e.target.closest('.theme-item'); if (!it) return;
        chooseTheme(it.dataset.id); closeMenu();
      });
      menu.addEventListener('keydown', e=>{
        const itemsArr = Array.from(menu.querySelectorAll('.theme-item'));
        const idx = itemsArr.indexOf(document.activeElement);
        if (e.key==='Escape'){ e.preventDefault(); closeMenu(); }
        else if (e.key==='ArrowDown'){ e.preventDefault(); (itemsArr[idx+1]||itemsArr[0]).focus(); }
        else if (e.key==='ArrowUp'){ e.preventDefault(); (itemsArr[idx-1]||itemsArr[itemsArr.length-1]).focus(); }
        else if (e.key==='Home'){ e.preventDefault(); itemsArr[0].focus(); }
        else if (e.key==='End'){ e.preventDefault(); itemsArr[itemsArr.length-1].focus(); }
        else if (e.key==='Enter' || e.key===' '){
          e.preventDefault(); const it=document.activeElement;
          if (it?.classList.contains('theme-item')){ chooseTheme(it.dataset.id); closeMenu(); }
        }
      });

      window.addEventListener('fw:theme-change', e=>{
        const id = e.detail?.theme || localStorage.getItem('fw_theme');
        if (id) setButtonVisual(id);
      });
    })();

    return true;
  }

  window.FWTheme = window.FWTheme || {};
  window.FWTheme.mountSwitcher = mountSwitcher;

  // Try after body is ready, with retries; also observe late inserts
  function tryMountWithRetry(retries=10){
    if (mountSwitcher()) return;
    if (retries > 0) setTimeout(()=>tryMountWithRetry(retries-1), 120);
  }
  bodyReady.then(tryMountWithRetry);
  const mo = new MutationObserver(() => { mountSwitcher(); });
  bodyReady.then(() => mo.observe(getRoot(), { childList:true, subtree:true }));
})();


<script>
(function(){
  // ----- Utility: theme-aware chart options
  function baseOpts() {
    const p = (window.FWGC && FWGC.palette) ? FWGC.palette() : {
      series: ['#3B82F6','#22D3EE','#A78BFA','#10B981'],
      text:'#0F172A', muted:'#64748B', grid:'#E5E7EB', bg:'#F5F7FB',
      a:'#3B82F6', b:'#22D3EE', c:'#A78BFA', d:'#10B981'
    };
    const fonts = "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    return {
      legend: { position: 'none', textStyle: { color: p.muted, fontName: fonts, fontSize: 12 } },
      hAxis: { textStyle:{ color:p.muted }, gridlines:{ color:p.grid }, baselineColor:p.grid },
      vAxis: { textStyle:{ color:p.muted }, gridlines:{ color:p.grid }, baselineColor:p.grid },
      backgroundColor: 'transparent',
      chartArea: { left: 44, top: 18, right: 12, bottom: 36 },
      colors: p.series,
      fontName: fonts
    };
  }

  // ----- Draw all charts
  function drawAllCharts(){
    const p = FWGC.palette();
    const opts = baseOpts();

    // 1) Revenue Area (Actual + Forecast)
    (function(){
      const data = new google.visualization.DataTable();
      data.addColumn('string', 'Month');
      data.addColumn('number', 'Actual');
      data.addColumn('number', 'Forecast');

      const months = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
      const actual = [1120,1080,1160,1210,1250,1280,1310,1340,1390,1410,1420,1440];
      const fcst   = [null,null,null, null,1260,1295,1330,1365,1415,1450,1490,1525];

      data.addRows(months.map((m,i)=>[m, actual[i] ?? null, fcst[i] ?? null]));

      const o = {
        ...opts,
        legend: { position:'top', textStyle:{ color:p.muted } },
        isStacked: false,
        areaOpacity: 0.18,
        series: {
          0: { type:'area', color: p.a || p.series[0], lineWidth: 2 },
          1: { type:'line', color: p.b || p.series[1], lineDashStyle: [6,4], lineWidth: 2 }
        }
      };

      new google.visualization.ComboChart(document.getElementById('chartRevenueArea')).draw(data, o);
    })();

    // 2) A/R Aging (Column)
    (function(){
      const data = google.visualization.arrayToDataTable([
        ['Bucket', 'Amount', { role:'style' }],
        ['Current', 320000, p.a || p.series[0]],
        ['30–60',  170000, p.b || p.series[1]],
        ['60–90',   82000, p.c || p.series[2]],
        ['90+',     40000, p.d || p.series[3]]
      ]);

      const o = {
        ...opts,
        legend: { position:'none' },
        bar: { groupWidth: '58%' }
      };

      new google.visualization.ColumnChart(document.getElementById('chartARAging')).draw(data, o);
    })();

    // 3) Product Mix (Donut)
    (function(){
      const data = google.visualization.arrayToDataTable([
        ['Product','Revenue'],
        ['Services', 520],
        ['SaaS',     410],
        ['Hardware', 300],
        ['Other',    190]
      ]);
      const o = {
        ...opts,
        pieHole: 0.58,
        legend: { position:'right', alignment:'center', textStyle:{ color: p.muted } },
        chartArea: { left: 10, top: 10, right: 10, bottom: 10 },
        slices: {
          0:{ color:p.a || p.series[0] },
          1:{ color:p.b || p.series[1] },
          2:{ color:p.c || p.series[2] },
          3:{ color:p.d || p.series[3] }
        }
      };
      new google.visualization.PieChart(document.getElementById('chartProductDonut')).draw(data, o);
    })();

    // 4) Cash vs Burn (Combo: bars + line)
    (function(){
      const data = google.visualization.arrayToDataTable([
        ['Month', 'Cash In', 'Cash Out', 'Net'],
        ['May', 410, 330, 80],
        ['Jun', 430, 350, 80],
        ['Jul', 470, 360, 110],
        ['Aug', 520, 390, 130]
      ]);
      const o = {
        ...opts,
        seriesType: 'bars',
        series: {
          0: { color: p.a || p.series[0] },
          1: { color: p.c || p.series[2] },
          2: { type: 'line', color: p.b || p.series[1], lineWidth: 2 }
        },
        bar: { groupWidth: '58%' }
      };
      new google.visualization.ComboChart(document.getElementById('chartCashCombo')).draw(data, o);
    })();

    // 5) Gauges
    (function(){
      const util = new google.visualization.Gauge(document.getElementById('gaugeUtil'));
      const csat = new google.visualization.Gauge(document.getElementById('gaugeCSAT'));
      const quota = new google.visualization.Gauge(document.getElementById('gaugeQuota'));

      const o = (tone) => ({
        width: '100%', height: 160,
        greenFrom: 70, greenTo: 100,
        redFrom: 0, redTo: 35,
        yellowFrom: 35, yellowTo: 70,
        minorTicks: 4,
        max: 100,
        // Use themed needle/labels if browser honors (Google Charts is limited)
        // Still, colors of green/yellow/red are fixed by lib; background blends w/ container
      });

      util.draw(google.visualization.arrayToDataTable([['Label','Value'],['Util%', 78]]), o(p.a));
      csat.draw(google.visualization.arrayToDataTable([['Label','Value'],['CSAT', 91]]), o(p.b));
      quota.draw(google.visualization.arrayToDataTable([['Label','Value'],['Quota', 66]]), o(p.c));
    })();

    // 6) Timeline (projects)
    (function(){
      const container = document.getElementById('timelineProjects');
      const chart = new google.visualization.Timeline(container);
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn({ type: 'string', id: 'Project' });
      dataTable.addColumn({ type: 'string', id: 'Task' });
      dataTable.addColumn({ type: 'date',   id: 'Start' });
      dataTable.addColumn({ type: 'date',   id: 'End' });

      const now = new Date();
      const d = (y,m,d)=>new Date(y,m,d);
      const y = now.getFullYear();
      // Sample items
      dataTable.addRows([
        ['Mercury', 'Design',  d(y,  4,  1), d(y,  5, 10)],
        ['Mercury', 'Build',   d(y,  5, 11), d(y,  6, 25)],
        ['Mercury', 'Pilot',   d(y,  6, 26), d(y,  7, 20)],
        ['Orion',   'SOW',     d(y,  3,  5), d(y,  3, 28)],
        ['Orion',   'Delivery',d(y,  3, 29), d(y,  5, 30)],
        ['Apollo',  'Phase 1', d(y,  1, 15), d(y,  2, 28)],
        ['Apollo',  'Phase 2', d(y,  3,  1), d(y,  4, 30)]
      ]);

      const o = {
        timeline: {
          barLabelStyle: { color: p.text },
          rowLabelStyle: { color: p.muted }
        },
        backgroundColor: 'transparent'
      };
      chart.draw(dataTable, o);
    })();

    // Progress bars (KPI)
    try {
      if (window.FWUI && FWUI.setProgressInline) {
        FWUI.setProgressInline(document.getElementById('kpiRevBar').parentElement, 71);
        FWUI.setProgressInline(document.getElementById('kpiGMBar').parentElement, 38);
        FWUI.setProgressInline(document.getElementById('kpiARBar').parentElement, 62);
        FWUI.setProgressInline(document.getElementById('kpiOTPBar').parentElement, 92);
      } else {
        // fallback widths
        document.getElementById('kpiRevBar').style.width = '71%';
        document.getElementById('kpiGMBar').style.width  = '38%';
        document.getElementById('kpiARBar').style.width  = '62%';
        document.getElementById('kpiOTPBar').style.width = '92%';
      }
    } catch(_) {}
  }

  // ----- Init: load + redraw on theme change / resize
  function initDashboard(){
    if (!(window.google && google.charts && google.charts.load)) return;
    google.charts.load('current', { packages: ['corechart','gauge','timeline'] });
    google.charts.setOnLoadCallback(drawAllCharts);
  }

  if (window.FWGC && FWGC.ensureLoaded) {
    // use shared loader so other pages can piggyback
    FWGC.ensureLoaded(drawAllCharts);
  } else {
    initDashboard();
  }

  // Redraw on theme change & window resize
  if (window.FWGC && FWGC.onRedraw) {
    FWGC.onRedraw(drawAllCharts);
  } else {
    window.addEventListener('resize', drawAllCharts);
    window.addEventListener('fw:theme-change', drawAllCharts);
  }
})();
</script>