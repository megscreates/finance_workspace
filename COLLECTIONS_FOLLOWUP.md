This dashboard module extends the Collections → Master tab glassy Follow-up modal and supporting tools for collectors and managers. It bundles the feature sweeps 1–4.

---

## Sweep 1 — Context, Timeline, Composer
- Context-rich header: Chips show Customer, Invoice, Open Balance, Days Past Due (DPD), Risk, Project #, Terms, Customer ID, and Email. Risk tinting highlights severity.
- Grouped timeline: Notes grouped by Week → Day with sticky headers. Entries show status badges, tags, and attachments.
- Composer with variables: Quick templates auto-insert variables (`{{invoiceId}}`, `{{customerName}}`, etc.). Drafts autosave.

## Sweep 2 — Workflow & Automation
- Reminders: If Next Follow-up lapses, a banner appears in the modal and a badge is added on the Master row.
- Escalation rules: Auto-tags notes as “Escalated” when DPD ≥ 60 (or Risk = High).
- Bulk actions: Multi-select rows in Master and open a Bulk Draft that pre-fills all selected accounts.
- Attachments: Add URLs (or files in future) to notes; displayed as chips in the timeline.
- Voice dictation: Dictate directly into the composer using the browser Speech API.

## Sweep 3 — Analytics & Integrations
- Analytics overlay: KPIs in the modal header: Overdue count, Promises kept %, Avg DSO. Sparkline chart (Chart.js) shows recent aging trend.
- Slack & Google Chat webhooks: Configure webhook URLs. Escalations auto-post summaries to connected channels.
- Exports: Download timeline as CSV or JSON. Export “Next Follow-up” as .ics (calendar event).

## Sweep 4 — Statements, Playbooks, Manager View
- Statement generation: One-click Statement builds a printable invoice statement with logo, remit-to block, open items, and recent notes. Link is also attached to the note.
- Brand settings: Configure statement logo and remit-to address.
- Playbooks library: Drawer with reusable templates (call/email/SMS). Templates support tags, CRUD, and manager “Promote to Org” actions.
- Manager dashboard: Tab inside modal showing PTP kept %, Avg DPD; Avg DPD by Collector (bar chart); Top hot accounts (DPD & open balance); CSV export of manager metrics.

## Usage
1. Navigate to Collections → Master.
2. Double-click a row (or select multiple and click “Follow-up”) to open the modal.
3. Use the header chips, timeline, composer, playbooks, analytics, and manager tab as needed.

## Implementation Notes
- All UI is injected by `initCollectionsFollowupModal()` in `app.js`.
- Styles live in `styles.css` under the AR Follow-up Modal section.
- Data is client-side only for now; adapters are ready to be swapped with an API backend in later sweeps.

