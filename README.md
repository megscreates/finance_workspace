Crystal Dashboard
=================

A lightweight, install‑free dashboard starter that matches the style of the provided mockups: soft cards, rounded corners, purple/gradient accents, sidebar navigation, stat cards, charts, and an orders table.

Quick start
-----------

1) Open `index.html` in your browser directly (no build step needed).

2) Toggle the accent gradient using the moon button in the header.

3) Edit colors, radii, and shadows via CSS variables in `styles.css`.

Google Apps Script (GAS)
------------------------

Files under `gas/` are ready for Apps Script HTML Service.

- `gas/Code.gs` – contains `doGet()` and an `include()` helper.
- `gas/Index.html` – main template that includes the styles and scripts partials.
- `gas/Styles.html` – CSS wrapped in a `<style>` tag.
- `gas/Scripts.html` – JS wrapped in a `<script>` tag; loads Chart.js via CDN in `Index.html`.

Deploy steps:

1) Go to script.google.com → New project.
2) Create files with the same names and paste contents from `gas/`.
3) Run `doGet()` with the debugger to preview, or Deploy → Web app → set access to "Anyone with the link".
4) Open the deployment URL; the dashboard should render with charts.

Project structure
-----------------

- `index.html` – layout and components
- `styles.css` – theme, spacing, shadows, responsive tweaks
- `app.js` – sample data, status badges, and charts

Notes
-----

- Charts use Chart.js via CDN; you can replace with Recharts or ECharts if you later add a build tool.
- The palette and gradient can be customized by changing `--primary*` variables and the `.theme-sunset` class in `styles.css`.
- The UI is responsive down to tablet; for mobile nav collapse you can extend the sidebar behavior as needed.

Next steps (optional)
---------------------

- Install a framework (Vite + React + Tailwind) and componentize the cards/panels.
- Wire the table to real data and add sorting/filtering.
- Add authentication and a backend if needed.
