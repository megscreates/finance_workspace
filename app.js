// App bootstrap: charts + orders table with search/sort

document.addEventListener('DOMContentLoaded', () => {
  // Use fixed 100% base scale (manual scale removed; Auto-fit controls scaling)
  try{ document.documentElement.style.setProperty('--ui-scale', '1'); }catch{}
  initCharts();
  initOrders();
  initSubtabs();
  initNavSubJumps();
  initSearchMirror();
  initTasks();
  initMessages();
  initCalendar();
  initReports();
  initAggregatedSearch();
  initReceivablesSearch();
  initPayablesSearch();
  initCashflowSearch();
  initCollections();
  // Some builds include an optional basic Collections bootstrap.
  if (typeof initCollectionsBasic === 'function') { initCollectionsBasic(); }
  initCollectionsTimeline();
  initMasterGrid();
  initCollectionsConfig();
  initCollectionsFollowupModal();
  initServiceTabs();
  initAdmin();
  // Apply any security/feature gates once on load
  try { applySecurityGates(); } catch {}
  initSidebarToggle();
  initAutoFit();
  bootWidgets();
  // Scoped widgets disabled (Home only)
});

// ------------------------------ Toast + Export ------------------------------
function ensureToastContainer(){
  let c = document.getElementById('toastContainer');
  if(!c){ c = document.createElement('div'); c.id='toastContainer'; c.setAttribute('aria-live','polite'); c.setAttribute('aria-atomic','true'); Object.assign(c.style,{position:'fixed',right:'16px',bottom:'16px',display:'grid',gap:'8px',zIndex:99999}); document.body.appendChild(c); }
  return c;
}
function showToast(message, type){
  const c = ensureToastContainer();
  const t = document.createElement('div'); t.className = 'toast ' + (type||'info'); t.textContent = message;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=> t.remove(), 350); }, 2400);
}
function downloadJSON(obj, filename){
  try{
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename || 'export.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch{}
}

// Sidebar collapse toggle (with persistence)
function initSidebarToggle(){
  const btn = document.getElementById('sidebarToggleBtn');
  if(!btn) return;
  const KEY = 'ui.sidebarCollapsed.v1';
  function applyState(collapsed){
    document.body.classList.toggle('is-sidebar-collapsed', !!collapsed);
    btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    btn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }
  try{
    const saved = localStorage.getItem(KEY);
    if(saved === '1') applyState(true);
  }catch{}
  btn.addEventListener('click', () => {
    const next = !document.body.classList.contains('is-sidebar-collapsed');
    applyState(next);
    try{ localStorage.setItem(KEY, next ? '1' : '0'); }catch{}
  });
}

// Auto-fit to window width (with gutters and persistence)
function initAutoFit(){
  const btn = document.getElementById('autoFitBtn');
  const KEY = 'ui.autoFit.v1';
  if(!btn) return;

  function cssPxVar(name, fallback){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(v || '');
    return isNaN(n) ? (fallback || 0) : n;
  }

  function applyAutoScale(){
    if(!document.body.classList.contains('is-autofit')) return;
    const sidebarW = cssPxVar('--sidebar-width', 260);
    const contentW = cssPxVar('--content-fixed-width', 1280);
    const padX = cssPxVar('--content-pad-x', 52);
    const base = sidebarW + contentW + padX; // unscaled app-shell width
    const gutter = cssPxVar('--edge-gutter', 20);
    const vw = Math.max(320, window.innerWidth || document.documentElement.clientWidth || base);
    // target visual width leaves symmetric gutters
    const target = Math.max(0, vw - 2*gutter);
    let scale = base > 0 ? (target / base) : 1;
    // clamp sensible range
    scale = Math.max(0.65, Math.min(1, scale));
    try{ document.documentElement.style.setProperty('--ui-scale', String(scale)); }catch{}
    // reflect in button label for quick sanity (optional): keep icon only
  }

  function setState(on){
    document.body.classList.toggle('is-autofit', !!on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? 'Auto-fit: on' : 'Auto-fit: off';
    try{ localStorage.setItem(KEY, on ? '1' : '0'); }catch{}
    if(on){ applyAutoScale(); } else {
      // Manual scale removed: always reset to 100%
      try{ document.documentElement.style.setProperty('--ui-scale', '1'); }catch{}
    }
  }

  // init from saved state
  try{ setState(localStorage.getItem(KEY) === '1'); }catch{ setState(false); }

  // toggle on click
  btn.addEventListener('click', () => setState(!document.body.classList.contains('is-autofit')));
  // recalc on resize/orientation changes
  window.addEventListener('resize', applyAutoScale);
  window.addEventListener('orientationchange', applyAutoScale);
}

async function bootWidgets(){
  try {
    const mod = await import('./widget.js');
    if (mod && typeof mod.initWidgetSystem === 'function') {
      mod.initWidgetSystem();
      return;
    }
  } catch (e) {
    // Fallback to inline implementation
  }
  if (typeof __inlineInitWidgetSystem === 'function') {
    __inlineInitWidgetSystem();
  }
}
/* --------------------------------------------------------------------------
   iOS-style Widget System (glass-themed, localStorage-backed)
   -------------------------------------------------------------------------- */
function __inlineInitWidgetSystem(){
  const grid = document.getElementById('widgetGrid');
  const addBtn = document.getElementById('widgetsAddBtn');
  const editBtn = document.getElementById('widgetsEditBtn');
  const sideGallery = document.getElementById('widgetGallerySide');
  if(!grid || !addBtn || !editBtn) return;

  // Live region for subtle announcements (resize, mode toggles)
  let live = document.getElementById('widgetsLive');
  if (!live) {
    live = document.createElement('div');
    live.id = 'widgetsLive';
    live.setAttribute('aria-live','polite');
    live.className = 'visually-hidden';
    document.body.appendChild(live);
  }

  // Settings persistence helpers
  const CFG_KEY = 'widgets.config.v1';
  function readAllCfg(){ try { return JSON.parse(localStorage.getItem(CFG_KEY)||'{}'); } catch { return {}; } }
  function getCfg(id){ const all = readAllCfg(); return all[id] || {}; }
  function setCfg(id, cfg){ const all = readAllCfg(); all[id] = cfg; localStorage.setItem(CFG_KEY, JSON.stringify(all)); }

  function openWidgetSettings(anchorEl, cardEl){
    document.getElementById('widgetSettingsMenu')?.remove();
    const menu = document.createElement('div');
    menu.id = 'widgetSettingsMenu';
    Object.assign(menu.style, { position:'absolute', zIndex:'9999', background:'#fff', border:'1px solid #e7e7f3', borderRadius:'14px', boxShadow:'0 12px 36px rgba(31,35,70,.16)', padding:'10px', width:'340px' });
    const id = cardEl.dataset.id; const type = cardEl.dataset.type; const curr = getCfg(id);

    const size = (cardEl.dataset.size||'xs');
    const ori = (cardEl.dataset.orient||defaultOrientFor(size)||'');
    const sizeRow = `
      <div class="settings-row"><label>Size</label>
        <select id="ws_size">
          <option value="xs" ${size==='xs'?'selected':''}>XS</option>
          <option value="s" ${size==='s'?'selected':''}>S</option>
          <option value="m" ${size==='m'?'selected':''}>M</option>
          <option value="l" ${size==='l'?'selected':''}>L</option>
          <option value="xl" ${size==='xl'?'selected':''}>XL</option>
          <option value="xxl" ${size==='xxl'?'selected':''}>XXL</option>
        </select>
        <button id="ws_flip" class="mini-btn" title="Flip orientation">↔︎</button>
      </div>`;

    function typeSection(t){
      switch(t){
        case 'kpi':{
          const options = (window.WIDGET_DATA?.kpis?.map((k,i)=>({label:k.label||`KPI ${i+1}`, value:i})) || [
            {label:'Revenue', value:0},{label:'Expenses', value:1},{label:'Profit', value:2}
          ]);
          const sel = curr.metricIndex ?? 0;
          const fmt = curr.format || 'auto';
          const cur = curr.currency || 'USD';
          const dec = Number.isInteger(curr.decimals) ? curr.decimals : 0;
          return `
            <div class="settings-row"><label>Metric</label>
              <select id="ws_kpi_idx">${options.map(o=>`<option value="${o.value}" ${String(sel)===String(o.value)?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}</select>
            </div>
            <div class="settings-row"><label>Format</label>
              <select id="ws_kpi_fmt"><option value="auto" ${fmt==='auto'?'selected':''}>Auto</option><option value="currency" ${fmt==='currency'?'selected':''}>Currency</option><option value="number" ${fmt==='number'?'selected':''}>Number</option><option value="percent" ${fmt==='percent'?'selected':''}>Percent</option></select>
            </div>
            <div class="settings-row"><label>Currency</label>
              <select id="ws_kpi_cur"><option value="USD" ${cur==='USD'?'selected':''}>USD</option><option value="EUR" ${cur==='EUR'?'selected':''}>EUR</option><option value="GBP" ${cur==='GBP'?'selected':''}>GBP</option></select>
            </div>
            <div class="settings-row"><label>Decimals</label>
              <input id="ws_kpi_dec" type="number" min="0" max="4" value="${dec}" />
            </div>`;
        }
        case 'metrics':{
          const ctype = curr.chartType || 'line';
          const ds = (window.WIDGET_DATA?.metrics?.datasets || []).map((d,i)=>({label:d.label||`Series ${i+1}`, value:i}));
          const dsIdx = curr.datasetIndex ?? 0;
          const color = curr.chartColor || '#6f5cff';
          return `
            <div class="settings-row"><label>Chart</label>
              <select id="ws_chart_type"><option value="line" ${ctype==='line'?'selected':''}>Line</option><option value="bar" ${ctype==='bar'?'selected':''}>Bar</option><option value="area" ${ctype==='area'?'selected':''}>Area</option></select>
            </div>
            ${ds.length ? `<div class="settings-row"><label>Dataset</label><select id=\"ws_chart_dataset\">${ds.map(o=>`<option value=\"${o.value}\" ${String(dsIdx)===String(o.value)?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}</select></div>` : ''}
            <div class="settings-row"><label>Color</label>
              <select id="ws_chart_color">
                <option value="#6f5cff" ${color==="#6f5cff"?'selected':''}>Violet</option>
                <option value="#19c37d" ${color==="#19c37d"?'selected':''}>Green</option>
                <option value="#ff6a4d" ${color==="#ff6a4d"?'selected':''}>Coral</option>
                <option value="#64d2ff" ${color==="#64d2ff"?'selected':''}>Sky</option>
              </select>
            </div>`;
        }
        case 'email':{
          const accounts = curr.accounts || ['Work'];
          return `<div class="settings-row"><label>Email Accounts</label>
            <input id="ws_email_accounts" placeholder="Comma-separated" value="${escapeHtml(accounts.join(', '))}" />
          </div>`;
        }
        case 'messages':{
          const sources = curr.sources || ['Slack'];
          return `<div class="settings-row"><label>Sources</label>
            <input id="ws_msg_sources" placeholder="Slack, GChat" value="${escapeHtml(sources.join(', '))}" />
          </div>`;
        }
        case 'calendar':{
          const cals = curr.calendars || ['Work'];
          return `<div class="settings-row"><label>Calendars</label>
            <input id="ws_cal_accounts" placeholder="Work, Personal" value="${escapeHtml(cals.join(', '))}" />
          </div>`;
        }
        case 'weather':{
          const loc = curr.location || 'Local';
          const units = curr.units || 'F';
          return `
            <div class="settings-row"><label>Location</label>
              <input id="ws_weather_loc" placeholder="City" value="${escapeHtml(loc)}" />
            </div>
            <div class="settings-row"><label>Units</label>
              <select id="ws_weather_units"><option value="F" ${units==='F'?'selected':''}>Fahrenheit</option><option value="C" ${units==='C'?'selected':''}>Celsius</option></select>
            </div>`;
        }
        default:
          return '';
      }
    }

    menu.innerHTML = `
      <div class="settings-head"><strong>Widget Settings</strong><span class="muted">${typeTitle(type)}</span></div>
      ${sizeRow}
      ${typeSection(type)}
      <div class="settings-actions">
        <div style="margin-right:auto; display:flex; gap:6px">
          <button class="mini-btn" id="ws_dup" title="Duplicate">Duplicate</button>
          <button class="mini-btn" id="ws_reset" title="Reset settings">Reset</button>
        </div>
        <button class="mini-btn" id="ws_remove" title="Remove">Remove</button>
        <button class="mini-btn" id="ws_cancel">Cancel</button>
        <button class="mini-btn" id="ws_save" style="font-weight:800">Save</button>
      </div>`;
    document.body.appendChild(menu);
    // Auto-place menu within viewport with caret direction
    const rect = anchorEl.getBoundingClientRect();
    const mrect = menu.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = rect.left + window.scrollX;
    let top = rect.bottom + 8 + window.scrollY;
    let caret = 'up';
    if (top + mrect.height > window.scrollY + vh){
      // place above
      top = rect.top + window.scrollY - mrect.height - 8;
      caret = 'down';
    }
    // clamp within viewport horizontally
    if (left + mrect.width > window.scrollX + vw) left = Math.max(8, vw + window.scrollX - mrect.width - 8);
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.setAttribute('data-caret', caret);

    function cleanup(){ document.removeEventListener('click', onDoc, true); menu.remove(); }
    function onDoc(e){ if (!menu.contains(e.target) && e.target !== anchorEl) cleanup(); }
    setTimeout(()=> document.addEventListener('click', onDoc, true), 0);

    function syncFlipEnabled(){ const s = document.getElementById('ws_size').value; const btn = document.getElementById('ws_flip'); btn.disabled = !['s','l','xl'].includes(s); }
    syncFlipEnabled();
    document.getElementById('ws_size').addEventListener('change', syncFlipEnabled);

    document.getElementById('ws_flip').addEventListener('click', ()=>{
      const s = document.getElementById('ws_size').value;
      if (!['s','l','xl'].includes(s)) return;
      const currOri = (cardEl.dataset.orient || defaultOrientFor(s) || 'landscape');
      const next = currOri === 'portrait' ? 'landscape' : 'portrait';
      cardEl.dataset.orient = next; applySpans(cardEl);
    });

    document.getElementById('ws_cancel').addEventListener('click', cleanup);
    document.getElementById('ws_save').addEventListener('click', ()=>{
      const newSize = document.getElementById('ws_size').value;
      cardEl.classList.remove('size-xs','size-s','size-m','size-l','size-xl','size-xxl');
      cardEl.classList.add(`size-${newSize}`);
      cardEl.dataset.size = newSize;
      if (!['s','l','xl'].includes(newSize)) cardEl.dataset.orient = '';
      applySpans(cardEl);

      const cfg = getCfg(id);
      if (type === 'kpi') { cfg.metricIndex = parseInt(document.getElementById('ws_kpi_idx')?.value || '0', 10); cfg.format = (document.getElementById('ws_kpi_fmt')?.value || 'auto'); cfg.currency = (document.getElementById('ws_kpi_cur')?.value || 'USD'); cfg.decimals = parseInt(document.getElementById('ws_kpi_dec')?.value || '0', 10); }
      if (type === 'metrics') { cfg.chartType = (document.getElementById('ws_chart_type')?.value || 'line'); cfg.datasetIndex = parseInt(document.getElementById('ws_chart_dataset')?.value || '0', 10); cfg.chartColor = (document.getElementById('ws_chart_color')?.value || '#6f5cff'); }
      if (type === 'email') cfg.accounts = (document.getElementById('ws_email_accounts')?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (type === 'messages') cfg.sources = (document.getElementById('ws_msg_sources')?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (type === 'calendar') cfg.calendars = (document.getElementById('ws_cal_accounts')?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (type === 'weather') { cfg.location = (document.getElementById('ws_weather_loc')?.value || 'Local'); cfg.units = (document.getElementById('ws_weather_units')?.value || 'F'); }
      setCfg(id, cfg);

      save();
      hydrate(cardEl);
      cleanup();
      if (live) live.textContent = 'Settings saved';
    });

    // Extra actions
    document.getElementById('ws_dup')?.addEventListener('click', ()=>{
      const newId = uid();
      const cloneData = { id:newId, type:cardEl.dataset.type, size:cardEl.dataset.size, orient:cardEl.dataset.orient||'' };
      const el = createWidgetEl(cloneData);
      grid.insertBefore(el, cardEl.nextElementSibling);
      const cfg = getCfg(id);
      if (Object.keys(cfg).length) setCfg(newId, JSON.parse(JSON.stringify(cfg)));
      save(); hydrate(el);
      if (live) live.textContent = 'Widget duplicated';
    });
    document.getElementById('ws_reset')?.addEventListener('click', ()=>{
      const all = readAllCfg(); delete all[id]; localStorage.setItem(CFG_KEY, JSON.stringify(all));
      hydrate(cardEl); if (live) live.textContent = 'Settings reset';
    });
    document.getElementById('ws_remove')?.addEventListener('click', ()=>{
      cardEl.remove(); save(); cleanup(); if (live) live.textContent = 'Widget removed';
    });
  }

  const LS_KEY = 'widgets.layout.v1';
  const DEFAULT_LAYOUT = [
    { id: uid(), type:'kpi',        size:'xs' },
    { id: uid(), type:'metrics',    size:'xs' },
    { id: uid(), type:'tasks',      size:'xs' },
    { id: uid(), type:'calendar',   size:'s' },
    { id: uid(), type:'quicklinks', size:'xs' },
    { id: uid(), type:'email',      size:'xs' },
    { id: uid(), type:'weather',    size:'s' },
    { id: uid(), type:'notes',      size:'xs' },
  ];
  // Helper to map widget size to grid spans with orientation
  // Squares ignore orientation; rectangular sizes flip cols/rows when portrait
  function spanFor(size, orient){
    const s = (size || '').toLowerCase();
    const o = (orient || '').toLowerCase();
    const isPortrait = o === 'portrait';
    switch(s){
      case 'xxl': return { cols: 3, rows: 3 }; // 3x3
      case 'xl':  return isPortrait ? { cols: 2, rows: 4 } : { cols: 4, rows: 2 }; // 2x4 (portrait) or 4x2 (landscape)
      case 'l':   return isPortrait ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 }; // 2x3 or 3x2
      case 'm':   return { cols: 2, rows: 2 }; // 2x2
      case 's':   return isPortrait ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 }; // 1x2 or 2x1
      case 'xs':
      default:    return { cols: 1, rows: 1 }; // 1x1
    }
  }
  // Default orientation for each size (only matters for rectangular sizes)
  function defaultOrientFor(size){
    switch((size || '').toLowerCase()){
      case 's': return 'landscape';
      case 'l': return 'portrait';
      case 'xl': return 'portrait';
      default: return ''; // squares / n/a
    }
  }
  // Apply current grid spans to an element based on its size + orientation
  function applySpans(el){
    const sz = el.dataset.size || 'xs';
    const ori = el.dataset.orient || defaultOrientFor(sz) || '';
    const { cols, rows } = spanFor(sz, ori);
    el.style.gridColumn = `span ${cols}`;
    el.style.gridRow = `span ${rows}`;
    el.classList.toggle('orient-portrait', ori === 'portrait');
    el.classList.toggle('orient-landscape', ori === 'landscape');
  }

  let layout;
  try { layout = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { layout = null; }
  if(!Array.isArray(layout) || layout.length === 0) layout = DEFAULT_LAYOUT;

  // Render current layout
  grid.innerHTML = '';
  layout.forEach(w => {
    if (!w.orient) { w.orient = defaultOrientFor(w.size) || ''; }
    grid.appendChild(createWidgetEl(w));
  });

  // Persist on changes
  function save(){
    const items = Array.from(grid.querySelectorAll('.widget-card')).map(el => ({
      id: el.dataset.id, type: el.dataset.type, size: el.dataset.size, orient: el.dataset.orient || ''
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  // Keep 1x1 units visually square by syncing row height to column width
  function syncGridRowSize(){
    // Respect fixed block sizing: if grid uses auto-fit with fixed px columns, do not override --widget-row
    const cs = getComputedStyle(grid);
    const gcols = cs.gridTemplateColumns || '';
    if (/auto-fit/.test(gcols) && /px/.test(gcols)) return;
    // Otherwise: legacy square syncing for fractional column layouts
    const cols = (gcols.match(/\s/g) || []).length + 1;
    const gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0;
    const totalW = grid.clientWidth;
    const colW = (totalW - gap * (cols - 1)) / cols;
    grid.style.setProperty('--widget-row', `${Math.max(56, Math.round(colW))}px`);
  }
  syncGridRowSize();
  window.addEventListener('resize', syncGridRowSize);
  new ResizeObserver(syncGridRowSize).observe(grid);

  // Edit mode toggle
  let editing = false;
  function setEditing(on){
    editing = !!on;
    grid.classList.toggle('is-editing', editing);
    document.body.classList.toggle('widgets-editing', editing);
    const badge = document.getElementById('widgetsEditBadge');
    if (badge) badge.setAttribute('aria-hidden', editing ? 'false' : 'true');
    grid.querySelectorAll('.widget-card').forEach(el => {
      el.setAttribute('draggable', editing ? 'true' : 'false');
      el.setAttribute('aria-grabbed', 'false');
      // Set tabIndex for keyboard focusability in edit mode
      el.tabIndex = editing ? 0 : -1;
    });
    // Disable Add button outside edit mode
    if (addBtn) {
      addBtn.disabled = !editing;
      addBtn.title = editing ? 'Add Widget' : 'Add Widget (edit mode only)';
    }
    editBtn.classList.toggle('active', editing);
    // Swap icon/title: ✎ ↔ ✓
    editBtn.textContent = editing ? '✓' : '✎';
    editBtn.title = editing ? 'Done' : 'Customize Widgets';
    if (live) { live.textContent = editing ? 'Edit mode on' : 'Edit mode off'; }
  }
  editBtn.addEventListener('click', ()=> setEditing(!editing));
  // Initialize UI to non-editing state on load
  setEditing(false);

  // Long press on any widget to enter edit mode
  grid.addEventListener('pointerdown', (e)=>{
    const card = e.target.closest('.widget-card');
    if(!card || editing) return;
    let pressed = true;
    const to = setTimeout(()=>{ 
      if(pressed) { 
        setEditing(true); 
        card.classList.add('snap');
        setTimeout(()=> card.classList.remove('snap'), 250);
      } 
    }, 500);
    const cancel = ()=>{ pressed=false; clearTimeout(to); window.removeEventListener('pointerup', cancel, true); window.removeEventListener('pointermove', cancel, true); };
    window.addEventListener('pointerup', cancel, true);
    window.addEventListener('pointermove', cancel, true);
  }, {passive:true});

  // Drag & drop reordering using placeholder
  let placeholder = null;

  grid.addEventListener('dragstart', e=>{
    if(!editing) return e.preventDefault();
    const card = e.target.closest('.widget-card');
    if(!card) return;
    card.classList.add('dragging');
    card.setAttribute('aria-grabbed','true');
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';

    // Create placeholder so layout doesn’t collapse
    placeholder = document.createElement('div');
    placeholder.className = 'widget-placeholder';
    placeholder.setAttribute('aria-hidden','true');
    // Carry size/orientation classes & data for CSS hooks
    const sz = (card.dataset.size || 'xs').toLowerCase();
    const ori = (card.dataset.orient || defaultOrientFor(sz) || '').toLowerCase();
    placeholder.dataset.size = sz;
    if (ori) placeholder.dataset.orient = ori;
    placeholder.classList.add(`size-${sz}`);
    if (ori) placeholder.classList.add(`orient-${ori}`);
    // Set grid spans based on the dragged card's size + orientation
    const {cols, rows} = spanFor(sz, ori);
    placeholder.style.gridColumn = `span ${cols}`;
    placeholder.style.gridRow = `span ${rows}`;
    grid.insertBefore(placeholder, card.nextElementSibling);
  });

  grid.addEventListener('dragend', e=>{
    const card = e.target.closest('.widget-card');
    if(card) {
      card.classList.remove('dragging');
      card.setAttribute('aria-grabbed','false');
      if (placeholder && placeholder.parentNode === grid) {
        grid.insertBefore(card, placeholder);
      }
      // Snap animation feedback on drop
      card.classList.add('snap');
      setTimeout(()=> card.classList.remove('snap'), 250);
    }
    if (placeholder) { placeholder.remove(); placeholder = null; }
    if (card) { applySpans(card); }
    save();
  });

  grid.addEventListener('dragover', e=>{
    if(!editing) return;
    e.preventDefault();
    // Auto-scroll window when dragging near viewport edges
    const edge = 80; // px
    const speed = 18; // px per frame
    const y = e.clientY;
    if (y < edge) window.scrollBy(0, -speed);
    else if (window.innerHeight - y < edge) window.scrollBy(0, speed);
    const x = e.clientX;
    if (x < edge) window.scrollBy(-speed, 0);
    else if (window.innerWidth - x < edge) window.scrollBy(speed, 0);
    if(!placeholder) return;

    const after = getDragAfterElement(grid, e.clientY);
    if(after == null) {
      grid.appendChild(placeholder);
    } else {
      grid.insertBefore(placeholder, after);
    }
  });

  function getDragAfterElement(container, y){
    const els = [...container.querySelectorAll('.widget-card:not(.dragging)')];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    for (const child of els){
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset, element: child };
      }
    }
    return closest.element;
  }

  // Bottom sheet gallery
  function openGallery(){ if(sideGallery){ sideGallery.classList.remove('is-hidden'); sideGallery.setAttribute('aria-hidden','false'); document.body.classList.add('widgets-gallery-open'); } }
  function closeGallery(){ if(sideGallery){ sideGallery.classList.add('is-hidden'); sideGallery.setAttribute('aria-hidden','true'); document.body.classList.remove('widgets-gallery-open'); } }
  // Only allow opening the gallery in edit mode and show in sidebar
  addBtn.addEventListener('click', (e)=>{
    if (!editing) {
      if (live) live.textContent = 'Edit mode on — use + to add widgets';
      setEditing(true);
      return; // require a deliberate second click while in edit mode
    }
    openGallery();
  });
  // Sidebar gallery interactions
  if (sideGallery){
    document.getElementById('widgetGalleryClose')?.addEventListener('click', closeGallery);
    sideGallery.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-add-widget]');
      if(!btn) return;
      const type = btn.getAttribute('data-add-widget');
      const data = { id: uid(), type, size:'s', orient: defaultOrientFor('s') || 'landscape' };
      const el = createWidgetEl(data);
      grid.appendChild(el);
      save();
      setEditing(true);
    });
  }

  // Keyboard shortcuts: Esc closes settings/gallery; A toggles gallery in edit mode
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape'){
      document.getElementById('widgetSettingsMenu')?.remove();
      closeGallery();
    }
    if ((e.key === 'a' || e.key === 'A') && editing){
      const isOpen = document.body.classList.contains('widgets-gallery-open');
      if (isOpen) closeGallery(); else openGallery();
    }
  });

  // Utilities
  function uid(){ return 'w' + Math.random().toString(36).slice(2,10); }

  function sizeToggleLabel(size, orient){
    const s = (size || '').toLowerCase();
    const o = (orient || '').toLowerCase();
    const base = sizeToggleText(s);
    if (['s','l','xl'].includes(s)){
      const glyph = o === 'portrait' ? '↕︎' : '↔︎';
      return `${base} ${glyph}`;
    }
    return base;
  }
  function openSizeMenu(anchorEl, cardEl){
    // remove any existing menu
    document.getElementById('widgetSizeMenu')?.remove();
    const menu = document.createElement('div');
    menu.id = 'widgetSizeMenu';
    Object.assign(menu.style, {
      position:'absolute', zIndex:'9999', background:'#fff', border:'1px solid #e7e7f3',
      borderRadius:'12px', boxShadow:'0 10px 30px rgba(18,19,26,.12)', padding:'6px'
    });
    const SIZES = ['xs','s','m','l','xl','xxl'];
    const curr = (cardEl.dataset.size || 'xs').toLowerCase();
    menu.innerHTML = SIZES.map(s=>`<button data-pick-size="${s}" style="display:block; width:100%; text-align:left; padding:8px 10px; border:none; background:#fff; cursor:pointer; ${s===curr?'font-weight:700':''}">
      ${s.toUpperCase()}
    </button>`).join('');
    document.body.appendChild(menu);
    const rect = anchorEl.getBoundingClientRect();
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;
    const onClick = (e)=>{
      const b = e.target.closest('[data-pick-size]');
      if (b){
        const newSize = b.getAttribute('data-pick-size');
        // Update classes
        cardEl.classList.remove('size-xs','size-s','size-m','size-l','size-xl','size-xxl');
        cardEl.classList.add(`size-${newSize}`);
        cardEl.dataset.size = newSize;
        // Reset orientation for squares; keep or default for rectangular
        if (['xs','m','xxl'].includes(newSize)){
          cardEl.dataset.orient = '';
        } else {
          const prevOri = cardEl.dataset.orient;
          cardEl.dataset.orient = prevOri || defaultOrientFor(newSize) || 'landscape';
        }
        // Update button label/title
        const btn = cardEl.querySelector('.size-toggle');
        if (btn){
          btn.textContent = sizeToggleLabel(newSize, cardEl.dataset.orient || '');
          btn.setAttribute('title', `Resize (current: ${newSize.toUpperCase()}${cardEl.dataset.orient?` · ${cardEl.dataset.orient}`:''})`);
        }
        applySpans(cardEl);
        hydrate(cardEl);
        save();
        if (live) { live.textContent = `Resized to ${newSize.toUpperCase()}`; }
        cleanup();
      } else if (!menu.contains(e.target)){
        cleanup();
      }
    };
    function cleanup(){
      document.removeEventListener('click', onClick, true);
      menu.remove();
    }
    setTimeout(()=> document.addEventListener('click', onClick, true), 0);
  }

  function createWidgetEl({id, type, size, orient}){
    const el = document.createElement('article');
    const sz = (size || 'xs').toLowerCase();
    const ori = (orient || defaultOrientFor(sz) || '').toLowerCase();
    el.className = `widget-card size-${sz}`;
    el.dataset.id = id; el.dataset.type = type; el.dataset.size = sz; el.dataset.orient = ori;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', typeTitle(type));
    el.innerHTML = `
      <header class="widget-head">
        <div class="widget-title">
          <svg viewBox="0 0 24 24" class="widget-glyph"><use href="${iconFor(type)}"/></svg>
          <span>${typeTitle(type)}</span>
        </div>
        <div class="widget-actions">
          <button class="mini-btn settings-btn" title="Settings"><svg viewBox="0 0 24 24" style="width:14px;height:14px;vertical-align:-2px"><use href="#i-settings"/></svg></button>
          <button class="mini-btn delete-btn" title="Remove">–</button>
        </div>
      </header>
      <div class="cf-banner" id="cfReminderBanner" style="display:none">Reminder: Next follow-up is past due.</div>
      <div class="widget-body">${renderBody(type, id)}</div>
    `;
    applySpans(el);

    // Interactions
    el.querySelector('.settings-btn')?.addEventListener('click', (ev)=>{
      if(!editing){ setEditing(true); if (live) live.textContent = 'Edit mode on — open settings again'; return; }
      openWidgetSettings(ev.currentTarget, el);
    });
    el.querySelector('.delete-btn')?.addEventListener('click', ()=>{
      if(!editing){
        setEditing(true);
        if (live) { live.textContent = 'Edit mode on — tap delete to remove'; }
        return; // require a second, intentional click
      }
      el.remove(); save();
    });
    // size toggle removed; size is managed via Settings menu

    // Keyboard arrow reordering (iOS-style)
    el.addEventListener('keydown', (ev)=>{
      if(!editing) return;
      if(ev.key==='ArrowLeft' || ev.key==='ArrowUp'){
        ev.preventDefault();
        if(el.previousElementSibling){ grid.insertBefore(el, el.previousElementSibling); save(); }
      }
      if(ev.key==='ArrowRight' || ev.key==='ArrowDown'){
        ev.preventDefault();
        if(el.nextElementSibling){ grid.insertBefore(el.nextElementSibling, el); save(); }
      }
      if(ev.key.toLowerCase() === 'r'){
        ev.preventDefault();
        const sz = el.dataset.size;
        if (['s','l','xl'].includes(sz)){
          const curr = (el.dataset.orient || defaultOrientFor(sz) || 'landscape');
          const nextOri = curr === 'portrait' ? 'landscape' : 'portrait';
          el.dataset.orient = nextOri;
          applySpans(el);
          save();
          if (live) { live.textContent = `Orientation ${nextOri}`; }
        }
      }
    });

    // After attaching, hydrate any dynamic parts (charts, calculators, etc.)
    setTimeout(()=> hydrate(el), 0);
    applySpans(el);
    return el;
  }

  
  function nextSize(s){
    // Cycle: xs → s → m → l → xl → xxl → xs
    if (s === 'xs') return 's';
    if (s === 's')  return 'm';
    if (s === 'm')  return 'l';
    if (s === 'l')  return 'xl';
    if (s === 'xl') return 'xxl';
    return 'xs';
  }

  function sizeToggleText(size) {
    switch(size){
      case 'xs': return 'XS';
      case 's':  return 'S';
      case 'm':  return 'M';
      case 'l':  return 'L';
      case 'xl': return 'XL';
      case 'xxl':return 'XXL';
      default:   return String(size || '').toUpperCase();
    }
  }
  function typeTitle(t){
    return ({
      kpi:'KPI', metrics:'Metrics', email:'Email', messages:'Messages', calendar:'Calendar',
      announcements:'Announcements', reminders:'Reminders', tasks:'Tasks', notes:'Quick Notes',
      quicklinks:'Quick Links', calculator:'Calculator', weather:'Weather'
    })[t] || 'Widget';
  }
  function iconFor(t){
    return ({
      kpi:'#i-stats', metrics:'#i-growth', email:'#i-mail', messages:'#i-mail',
      calendar:'#i-life', announcements:'#i-report', reminders:'#i-settings', tasks:'#i-settings',
      notes:'#i-report', quicklinks:'#i-report', calculator:'#i-settings', weather:'#i-life'
    })[t] || '#i-report';
  }

  function renderBody(t, id){
    switch(t){
      case 'kpi': {
        // Use window.WIDGET_DATA?.kpis?.[0] or fallback
        const kpi = window.WIDGET_DATA?.kpis?.[0];
        if (kpi) {
          return `<div class="kpi-wrap" data-type="kpi">
            <div class="kpi-value">${escapeHtml(kpi.value ?? '')}</div>
            <div class="kpi-label muted">${escapeHtml(kpi.label ?? '')}</div>
            ${kpi.trend ? `<div class="kpi-trend ${kpi.trend > 0 ? 'up' : (kpi.trend < 0 ? 'down' : '')}">${kpi.trend > 0 ? '+' : (kpi.trend < 0 ? '−' : '')}${Math.abs(kpi.trend)}%</div>` : ''}
          </div>`;
        }
        // fallback
        return `<div class="kpi-wrap" data-type="kpi">
          <div class="kpi-value">$132,000</div>
          <div class="kpi-label muted">Revenue this month</div>
        </div>`;
      }
      case 'metrics':
        // Add data-type for metrics, hydrate will use window.WIDGET_DATA?.metrics if available
        return `<div class="chart-box" data-type="metrics"><canvas id="c_${id}" height="120"></canvas></div>`;
      case 'email':
        return sampleList(['Invoice #883 payment received','Q3 planning deck','Legal: MSA update']);
      case 'messages':
        return sampleList(['#alerts: Risk monitor (4)','Fin-Chat: aging review at 3pm','Ops: ETL retry succeeded']);
      case 'calendar':
        return sampleList(['Today 10:00 — AR standup','Today 15:00 — Aging review','Tomorrow 09:00 — Vendor sync']);
      case 'announcements':
        return `<div class="announce"><strong>New:</strong> Collections dashboard v2 rolls out Friday.</div>`;
      case 'reminders':
        return sampleList(['Send statement to ACME','Follow up: Globex dispute','Prep Q3 forecast']);
      case 'tasks':
        try{
          const tasks = JSON.parse(localStorage.getItem('dash.tasks.v1') || '[]');
          if(tasks.length){
            return `<ul class="mini-list">${tasks.slice(0,5).map(t=>`<li>${escapeHtml(t.text)}${t.done?' (Done)':''}</li>`).join('')}</ul>`;
          }
        }catch{}
        return sampleList(['Review KPIs','Approve invoices','Prep forecast']);
      case 'notes':
        return `<textarea class="notes-area" data-notes-key="widget.notes.${id}" placeholder="Quick note..." rows="5"></textarea>`;
      case 'quicklinks':
        return `<div class="links-wrap">
          <a class="link" href="#">Open A/R</a>
          <a class="link" href="#">New Invoice</a>
          <a class="link" href="#">Upload CSV</a>
          <a class="link" href="#">Top Debtors</a>
        </div>`;
      case 'calculator':
        return `<div class="calc" data-calc-id="${id}">
          <div class="calc-display" aria-live="polite">0</div>
          <div class="calc-pad">
            <button class="calc-btn op" data-k="ac">AC</button>
            <button class="calc-btn op" data-k="c">C</button>
            <button class="calc-btn op" data-k="pm">±</button>
            <button class="calc-btn op" data-k="/">÷</button>
            <button class="calc-btn" data-k="7">7</button>
            <button class="calc-btn" data-k="8">8</button>
            <button class="calc-btn" data-k="9">9</button>
            <button class="calc-btn op" data-k="*">×</button>
            <button class="calc-btn" data-k="4">4</button>
            <button class="calc-btn" data-k="5">5</button>
            <button class="calc-btn" data-k="6">6</button>
            <button class="calc-btn op" data-k="-">−</button>
            <button class="calc-btn" data-k="1">1</button>
            <button class="calc-btn" data-k="2">2</button>
            <button class="calc-btn" data-k="3">3</button>
            <button class="calc-btn op" data-k="+">+</button>
            <button class="calc-btn" data-k="0" style="grid-column: span 2">0</button>
            <button class="calc-btn" data-k=".">.</button>
            <button class="calc-btn eq" data-k="=">=</button>
          </div>
        </div>`;
      case 'weather':
        return `<div class="weather"><div class="temp">72°</div><div class="muted">Sunny · Local</div></div>`;
      default:
        return `<div class="muted">Empty</div>`;
    }
  }

  function hydrate(card){
    // Notes persistence
    card.querySelectorAll('.notes-area').forEach(ta=>{
      const key = ta.dataset.notesKey;
      try { ta.value = localStorage.getItem(key) || ''; } catch {}
      ta.addEventListener('input', ()=>{ try{ localStorage.setItem(key, ta.value || ''); }catch{} });
    });

    // Apply widget config on hydrate
    const cfg = (()=>{ try{ const all = JSON.parse(localStorage.getItem('widgets.config.v1')||'{}'); return all[card.dataset.id]||{}; }catch{return {}} })();

    // KPI: use selected metric index + format when available
    if (card.dataset.type === 'kpi') {
      const wrap = card.querySelector('.kpi-wrap');
      if (wrap && window.WIDGET_DATA?.kpis?.length) {
        const idx = Number.isInteger(cfg.metricIndex) ? cfg.metricIndex : 0;
        const kpi = window.WIDGET_DATA.kpis[idx] || window.WIDGET_DATA.kpis[0];
        const val = kpi.value ?? '';
        const fmt = cfg.format || 'auto';
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g,''));
        const pretty = isNaN(num) ? String(val) : formatValue.call({currency: cfg.currency || 'USD', decimals: Number.isInteger(cfg.decimals)?cfg.decimals:0}, num, fmt);
        wrap.innerHTML =
          `<div class="kpi-value">${escapeHtml(pretty)}</div>
          <div class="kpi-label muted">${escapeHtml(kpi.label ?? '')}</div>
          ${kpi.trend ? `<div class="kpi-trend ${kpi.trend > 0 ? 'up' : (kpi.trend < 0 ? 'down' : '')}">${kpi.trend > 0 ? '+' : (kpi.trend < 0 ? '−' : '')}${Math.abs(kpi.trend)}%</div>` : ''}`;
      }
    }

    // Calculator logic (keypad)
    const calc = card.querySelector('.calc');
    if(calc){
      const display = calc.querySelector('.calc-display');
      let cur = '0', prev = null, op = null, justEq = false;
      function setDisplay(v){ display.textContent = v; }
      function inputDigit(d){ if(justEq){ cur='0'; justEq=false; } cur = (cur==='0' && d!=='.') ? d : (cur.includes('.') && d==='.' ? cur : cur + d); setDisplay(cur); }
      function setOp(o){ if(op && prev!=null){ compute(); } else { prev = parseFloat(cur); cur='0'; } op = o; justEq=false; }
      function compute(){ const a = prev ?? 0, b = parseFloat(cur); let r = 0; switch(op){ case '+': r=a+b; break; case '-': r=a-b; break; case '*': r=a*b; break; case '/': r=b!==0? a/b : 0; break; default: r=b; } prev=r; cur='0'; setDisplay(String(r)); }
      function equals(){ if(op==null && prev==null){ setDisplay(cur); return; } compute(); op=null; justEq=true; }
      function pm(){ if(cur==='0'){ if(prev!=null){ prev=-prev; setDisplay(String(prev)); } } else { cur = String(-parseFloat(cur)); setDisplay(cur); } }
      function clearAll(){ cur='0'; prev=null; op=null; justEq=false; setDisplay('0'); }
      function clearEntry(){ cur='0'; setDisplay('0'); }
      calc.querySelector('.calc-pad').addEventListener('click', (e)=>{
        const b = e.target.closest('.calc-btn'); if(!b) return;
        const k = b.dataset.k;
        if(/^[0-9]$/.test(k) || k==='.') inputDigit(k);
        else if(['+','-','*','/'].includes(k)) setOp(k);
        else if(k==='=') equals();
        else if(k==='pm') pm();
        else if(k==='ac') clearAll();
        else if(k==='c') clearEntry();
      });
    }

    // Metrics chart: use WIDGET_DATA.metrics if present
    const chartBox = card.querySelector('.chart-box[data-type="metrics"]');
    const canvas = chartBox ? chartBox.querySelector('canvas[id^="c_"]') : card.querySelector('canvas[id^="c_"]');
    if(canvas && window.Chart){
      let chartData = null, chartLabels = null;
      if (window.WIDGET_DATA?.metrics) {
        chartLabels = window.WIDGET_DATA.metrics.labels || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const ds = window.WIDGET_DATA.metrics.datasets;
        if (Array.isArray(ds) && ds.length){
          const i = Number.isInteger(cfg.datasetIndex) ? cfg.datasetIndex : 0;
          chartData = ds[i]?.data || ds[0].data;
        } else {
          chartData = window.WIDGET_DATA.metrics.data || [12,14,16,13,18,22,24,23,25,28,27,30];
        }
      } else {
        chartLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        chartData = [12,14,16,13,18,22,24,23,25,28,27,30];
      }
      const primary = (cfg.chartColor || getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6f5cff');
      const chartType = (cfg.chartType === 'bar') ? 'bar' : 'line';
      const isArea = cfg.chartType === 'area' || (chartType === 'line');
      // Remove any existing chart instance on this canvas
      if (canvas._chartInstance) { try { canvas._chartInstance.destroy(); } catch(e){} }
      const dsCommon = { data:chartData, borderColor:primary, backgroundColor:hexToRgba(primary, 0.12), pointRadius:0 };
      if (chartType === 'line') Object.assign(dsCommon, { tension:.35, fill:isArea });
      if (chartType === 'bar') Object.assign(dsCommon, { borderRadius:8 });
      canvas._chartInstance = new Chart(canvas.getContext('2d'), {
        type: chartType,
        data:{ labels:chartLabels, datasets:[ dsCommon ] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{display:false}, y:{display:false} } }
      });
    }

    // Weather display based on settings
    if (card.dataset.type === 'weather'){
      const wrap = card.querySelector('.weather');
      if (wrap){
        const units = (cfg.units || 'F');
        const tempF = 72; // placeholder
        const t = units === 'C' ? Math.round((tempF-32)*5/9) : tempF;
        const label = units === 'C' ? '°C' : '°F';
        const loc = cfg.location || 'Local';
        wrap.innerHTML = `<div class="temp">${t}${label}</div><div class="muted">Sunny · ${escapeHtml(loc)}</div>`;
      }
    }
  }

  function sampleList(items){
    return `<ul class="mini-list">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  }

  function formatValue(num, fmt){
    try{
      const decimals = (this && this.decimals != null) ? this.decimals : 0; // optional bind
      const currency = (this && this.currency) || 'USD';
      if (fmt === 'currency') return new Intl.NumberFormat(undefined, {style:'currency', currency, maximumFractionDigits:decimals}).format(num);
      if (fmt === 'percent') return `${(num*100).toFixed(decimals)}%`;
      if (fmt === 'number') return new Intl.NumberFormat(undefined, {maximumFractionDigits:decimals}).format(num);
      // auto: choose currency if big, else number
      if (Math.abs(num) >= 1000) return new Intl.NumberFormat(undefined, {style:'currency', currency, maximumFractionDigits:decimals}).format(num);
      return new Intl.NumberFormat(undefined, {maximumFractionDigits:decimals}).format(num);
    }catch{ return String(num); }
  }

  function hexToRgba(hex, a){
    const m = hex.replace('#','');
    const r = parseInt(m.substring(0,2),16), g = parseInt(m.substring(2,4),16), b = parseInt(m.substring(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // Expose for debugging
  window.WIDGETS_RESET = function(){ localStorage.removeItem(LS_KEY); location.reload(); };

  // Expose data injection for widgets
  window.WIDGETS_SET_DATA = function(data){
    window.WIDGET_DATA = data;
    grid.querySelectorAll('.widget-card').forEach(hydrate);
  };
}

function initCharts(){
  if (!window.Chart) return;
  const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6f5cff';

  const tctx = document.getElementById('trafficChart');
  if (tctx){
    new Chart(tctx, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [{ label:'Hits', data:[4,8,16,12,22,28,36,32,30,38,40,45], tension:.35, borderColor:primary, backgroundColor:'rgba(111,92,255,0.15)', fill:true, pointRadius:0 }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:'rgba(0,0,0,0.05)'}, ticks:{stepSize:10}} } }
    });
  }

  const gctx = document.getElementById('growthChart');
  if (gctx){
    new Chart(gctx, {
      type: 'bar',
      data: { labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[
        {label:'Posts', data:[120,180,160,240,220,260], backgroundColor:'#6f5cff', borderRadius:6},
        {label:'Carousels', data:[80,90,120,140,150,170], backgroundColor:'#5cc2ff', borderRadius:6},
        {label:'Stories', data:[60,70,80,110,120,140], backgroundColor:'#ffa657', borderRadius:6}
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{stacked:true, grid:{display:false}}, y:{stacked:true, grid:{color:'rgba(0,0,0,0.05)'}} } }
    });
  }

  // A/R Trend (Summary)
  const arT = document.getElementById('arTrendChart');
  if (arT){
    const primary2 = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6f5cff';
    new Chart(arT, {
      type:'line',
      data:{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets:[{ label:'A/R', data:[410,420,430,440,455,468,472,480,485,490,478,482],
          tension:.35, borderColor:primary2, backgroundColor:'rgba(111,92,255,0.15)', fill:true, pointRadius:0 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:'rgba(0,0,0,0.05)'}} } }
    });
  }

  // Aging buckets
  const agingBar = document.getElementById('agingBarChart');
  if (agingBar){
    new Chart(agingBar, {
      type:'bar',
      data:{ labels:['Current','1–30','31–60','61–90','90+'],
        datasets:[{ label:'Amount (k$)', data:[322,70,40,30,20], borderRadius:8,
          backgroundColor:['#e7e4ff','#d9f7ee','#fff2cc','#ffd9d9','#ffcccc'] }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'rgba(0,0,0,0.05)'} } } }
    });
  }

  const agingPie = document.getElementById('agingPieChart');
  if (agingPie){
    new Chart(agingPie, {
      type:'doughnut',
      data:{ labels:['Current','1–30','31–60','61–90','90+'],
        datasets:[{ data:[322,70,40,30,20],
          backgroundColor:['#e7e4ff','#d9f7ee','#fff2cc','#ffd9d9','#ffcccc'] }] },
      options:{ responsive:true, plugins:{legend:{position:'bottom'}}, cutout:'62%' }
    });
  }

  // Risk signals
  const riskSig = document.getElementById('riskSignalsChart');
  if (riskSig){
    new Chart(riskSig, {
      type:'bar',
      data:{ labels:['Past Due','Disputes','Credit Limit'],
        datasets:[{ label:'Count', data:[18,6,9], borderRadius:8, backgroundColor:'#ffa657' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'rgba(0,0,0,0.05)'} } } }
    });
  }
}

// Orders table
const ORDERS = [
  { no: 1, id: '#12345', date: 'Aug 6, 2020', name: 'Loid Forger', amount: 56.4, status: 'new' },
  { no: 2, id: '#12346', date: 'Aug 7, 2020', name: 'Anya Forger', amount: 75.9, status: 'delivery' },
  { no: 3, id: '#12347', date: 'Aug 8, 2020', name: 'Yor Briar', amount: 32.1, status: 'pending' },
  { no: 4, id: '#12348', date: 'Aug 9, 2020', name: 'Franky', amount: 98.4, status: 'new' },
  { no: 5, id: '#12349', date: 'Aug 9, 2020', name: 'Sylvia Sherwood', amount: 210.0, status: 'delivery' },
];

function initOrders(){
  const tbody = document.getElementById('ordersBody');
  const table = document.getElementById('ordersTable');
  const search = document.getElementById('globalSearch');
  if (!tbody || !table) return;

  const state = { sortKey:'no', sortDir:'asc', query:'' };

  function parseDate(s){ return new Date(s); }
  function statusOrder(s){ return {new:1, delivery:2, pending:3}[s] || 9; }

  function render(){
    let rows = ORDERS.filter(o => {
      if (!state.query) return true;
      const q = state.query.toLowerCase();
      return [o.id, o.name, o.status, o.date, String(o.amount)].some(v=>String(v).toLowerCase().includes(q));
    });

    rows.sort((a,b)=>{
      let A,B;
      switch(state.sortKey){
        case 'id': A=a.id; B=b.id; break;
        case 'date': A=parseDate(a.date); B=parseDate(b.date); break;
        case 'name': A=a.name.toLowerCase(); B=b.name.toLowerCase(); break;
        case 'amount': A=a.amount; B=b.amount; break;
        case 'status': A=statusOrder(a.status); B=statusOrder(b.status); break;
        default: A=a.no; B=b.no;
      }
      if (A<B) return state.sortDir==='asc'?-1:1;
      if (A>B) return state.sortDir==='asc'?1:-1;
      return 0;
    });

    if (rows.length===0){
      tbody.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center; padding:16px">No results</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(o => `
      <tr>
        <td>${o.no}.</td>
        <td>${o.id}</td>
        <td>${o.date}</td>
        <td>${o.name}</td>
        <td>$${o.amount.toFixed(2)}</td>
        <td>${renderStatus(o.status)}</td>
        <td><a class="link" href="#">Check</a></td>
      </tr>`).join('');
  }

  function renderStatus(s){
    const map = { new: 'New Order', delivery: 'On Delivery', pending: 'Pending' };
    return `<span class="status ${s}">${map[s]}</span>`;
  }

  // Sorting
  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (state.sortKey === key){ state.sortDir = (state.sortDir==='asc'?'desc':'asc'); }
      else { state.sortKey = key; state.sortDir = 'asc'; }
      table.querySelectorAll('th.sortable').forEach(t=>t.classList.remove('sort-desc'));
      if (state.sortDir==='desc') th.classList.add('sort-desc'); else th.classList.remove('sort-desc');
      render();
    });
  });

  // Search
  if (search){ search.addEventListener('input', ()=>{ state.query = search.value.trim(); render(); }); }

  render();
}

// Debtors data + table (Receivables > Debtors)
const DEBTORS = [
  { name:'ACME Co.', amount: 54300, bucket:'31–60', risk:'High' },
  { name:'Globex LLC', amount: 39950, bucket:'1–30', risk:'Medium' },
  { name:'Soylent', amount: 28100, bucket:'90+', risk:'High' },
  { name:'Initech', amount: 22450, bucket:'Current', risk:'Low' },
  { name:'Umbrella', amount: 19725, bucket:'61–90', risk:'High' },
  { name:'Stark Industries', amount: 18600, bucket:'1–30', risk:'Medium' },
];

(function initDebtors(){
  const tbody = document.getElementById('debtorsBody');
  const table = document.getElementById('debtorsTable');
  if(!tbody || !table) return;

  let sortKey = 'amount', sortDir = 'desc';

  function badge(r){
    const cls = r==='High'?'pending':(r==='Medium'?'delivery':'new');
    return `<span class="status ${cls}">${r}</span>`;
  }

  function render(){
    const rows = [...DEBTORS].sort((a,b)=>{
      const A = a[sortKey], B = b[sortKey];
      if (A<B) return sortDir==='asc'?-1:1;
      if (A>B) return sortDir==='asc'?1:-1;
      return 0;
    }).map(d=>`
      <tr>
        <td>${d.name}</td>
        <td>$${d.amount.toLocaleString()}</td>
        <td>${d.bucket}</td>
        <td>${badge(d.risk)}</td>
        <td><a class="link" href="#">Contact</a></td>
      </tr>`).join('');
    tbody.innerHTML = rows;
  }

  table.querySelectorAll('th.sortable').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      sortDir = (sortKey===key && sortDir==='asc') ? 'desc' : 'asc';
      sortKey = key;
      table.querySelectorAll('th.sortable').forEach(t=>t.classList.remove('sort-desc'));
      if (sortDir==='desc') th.classList.add('sort-desc');
      render();
    });
  });

  render();
})();

// ---------------- Receivables: Collections (CSV-powered) ------------------
function initCollections(){
  const table = document.getElementById('collectionsTable');
  const tbody = document.getElementById('collectionsBody');
  const search = document.getElementById('colSearch');
  const bucketSel = document.getElementById('colFilterBucket');
  const statusSel = document.getElementById('colFilterStatus');
  const ownerSel = document.getElementById('colFilterOwner');
  const importInput = document.getElementById('colImport');
  const importBtn = document.getElementById('colImportBtn');
  const pasteBtn = document.getElementById('colPasteBtn');
  const exportBtn = document.getElementById('colExportBtn');
  const digestBtn = document.getElementById('colDigestBtn');
  const panel = document.querySelector('[data-subtab-panel="recv-collections"]');
  if(!table || !tbody || !panel) return;

  const STATE_KEY = 'collections.state.v1';
  const OWNERS = ['Unassigned','Megan','David','Ray','Khary','Paul','Chris'];
  let dataset = [];
  let state = { assignments:{}, statuses:{}, priorities:{}, escalations:{}, notes:{}, emails:{}, milestones:{} };
  try{ state = Object.assign(state, JSON.parse(localStorage.getItem(STATE_KEY) || '{}')); }catch{}

  function buildOwnerSuggestions(){
    const dl = document.getElementById('ownersList');
    if(!dl) return;
    const set = new Set(OWNERS);
    // Include any assigned owners from state
    Object.values(state.assignments||{}).forEach(v=>{ if(v) set.add(v); });
    dl.innerHTML = Array.from(set).map(o=>`<option value="${o}"></option>`).join('');
  }
  buildOwnerSuggestions();

  // Helpers
  function save(){ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  function parseCSV(text){
    const rows=[]; let cur='', inQ=false; let row=[];
    for(let i=0;i<text.length;i++){
      const c=text[i]; const n=text[i+1];
      if(c==='"'){
        if(inQ && n==='"'){ cur+='"'; i++; }
        else inQ=!inQ;
      } else if(c===',' && !inQ){ row.push(cur); cur=''; }
      else if((c==='\n' || c==='\r') && !inQ){ if(cur.length||row.length){ row.push(cur); rows.push(row); row=[]; cur=''; } }
      else cur+=c;
    }
    if(cur.length||row.length){ row.push(cur); rows.push(row); }
    const header = rows.shift().map(h=>h.trim());
    return rows.map(r=>{ const o={}; header.forEach((h,idx)=> o[h]=r[idx]||''); return o; });
  }
  function parseNum(s){ return parseFloat(String(s||'0').replace(/[^0-9.-]/g,''))||0; }
  function fmtMoney(n){ return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n); }
  function daysDiff(due){ const d=new Date(due); const now=new Date(); return Math.ceil((now-d)/86400000); }
  const FIELD_MAP = {
    inv: ['AR Ref Nbr','AR Ref Number','Ref Nbr','Invoice','Invoice Number','Invoice No'],
    due: ['Due Date','Invoice Due Date','Due'],
    open: ['Open Balance','Open','Amount Due','Balance','Open Balance Amount'],
    bucket: ['Aging Bucket','Bucket'],
    days: ['Days Past Due','Days'],
    cust: ['Customer Name','Customer','Customer ID','CustomerID','Bill To Customer Name']
  };
  function getField(rec, key){
    const list = FIELD_MAP[key] || [key];
    for(const k of list){ if(rec[k] != null && rec[k] !== '') return rec[k]; }
    // case-insensitive fallback
    const lower = Object.keys(rec).reduce((acc,k)=>{ acc[k.toLowerCase()] = rec[k]; return acc; },{});
    for(const k of list){ const v = lower[k.toLowerCase()]; if(v != null && v !== '') return v; }
    return '';
  }

  function showPasteCsvDialog(){
    let overlay = document.getElementById('csvPasteDialog');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'csvPasteDialog';
    Object.assign(overlay.style, { position:'fixed', inset:'0', background:'rgba(18,19,26,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 });
    const box = document.createElement('div');
    Object.assign(box.style, { width:'min(840px, 96vw)', maxHeight:'80vh', overflow:'auto', background:'#fff', border:'1px solid #e7e7f3', borderRadius:'14px', boxShadow:'0 18px 48px rgba(31,35,70,.25)', padding:'12px' });
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px">
        <div>
          <strong>Paste CSV</strong>
          <div class="muted" style="font-size:12px">Paste rows including headers. Common columns: AR Ref Nbr, Due Date, Open Balance, Aging Bucket, Days Past Due, Customer Name.</div>
        </div>
        <button class="mini-btn" data-close>✕</button>
      </div>
      <textarea id="csvPasteText" rows="12" style="width:100%; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; border:1px solid #e7e7f3; border-radius:10px; padding:10px" placeholder="AR Ref Nbr,Due Date,Open Balance,Aging Bucket,Days Past Due,Status,Customer Name\nINV-1001,2025-08-15,1200.00,31–60,45,Open,Acme Inc"></textarea>
      <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:10px">
        <span id="csvPasteErr" class="muted" style="margin-right:auto"></span>
        <button class="mini-btn" data-cancel>Cancel</button>
        <button class="mini-btn" data-load>Load</button>
      </div>`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const close = ()=> overlay.remove();
    box.querySelector('[data-close]').addEventListener('click', close);
    box.querySelector('[data-cancel]').addEventListener('click', close);
    const load = async ()=>{
      const ta = box.querySelector('#csvPasteText');
      const raw = (ta.value || '').trim();
      if(!raw){ const err=box.querySelector('#csvPasteErr'); err.textContent='Nothing to import — paste CSV first.'; return; }
      try{
        const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
        const parsed = parseCSV(cleaned);
        if(!parsed.length){ const err=box.querySelector('#csvPasteErr'); err.textContent='No rows detected. Ensure headers + data.'; return; }
        dataset = parsed.filter(r=>r['AR Doc Type']!=='Credit Memo');
        resetFilters();
        setStatus(`Pasted ${dataset.length} rows`);
        close();
        render();
      }catch(ex){ const err=box.querySelector('#csvPasteErr'); err.textContent='Could not parse CSV.'; }
    };
    box.querySelector('[data-load]').addEventListener('click', load);
    box.querySelector('#csvPasteText').addEventListener('keydown', (e)=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey)){ e.preventDefault(); load(); } });
    box.querySelector('#csvPasteText').focus();
  }
  async function readFileAsText(file){
    if (file && typeof file.text === 'function'){
      try { return await file.text(); } catch {}
    }
    // Fallback for older Safari and browsers
    return await new Promise((resolve, reject)=>{
      try{
        const reader = new FileReader();
        reader.onload = (e)=> resolve(e.target && e.target.result || '');
        reader.onerror = (e)=> reject(e);
        reader.readAsText(file);
      }catch(err){ reject(err); }
    });
  }

  async function load(){
    if (dataset.length) return;
    const demoCsv = `AR Ref Nbr,Due Date,Open Balance,Aging Bucket,Days Past Due,Status,Customer Name,Billing Email\n`
      + `INV-2001,2025-08-10,3250.00,61–90,72,Open,Acme Manufacturing,ap@acme.com\n`
      + `INV-2002,2025-08-28,980.25,31–60,33,Promise,Globex Corp,ap@globex.com\n`
      + `INV-2003,2025-09-12,14500.00,1–30,12,Dispute,Initech,ap@initech.com\n`
      + `INV-2004,2025-07-22,600.00,90+,102,Open,Umbrella LLC,ap@umbrella.com\n`
      + `INV-2005,2025-09-30,2100.50,Current,0,Open,Hooli,ap@hooli.com`;
    try{ dataset = parseCSV(demoCsv); }catch(e){ dataset = []; }
    render();
  }

  function currentOwner(inv){ return state.assignments[inv] || 'Unassigned'; }
  function currentStatus(inv, fallback){ return state.statuses[inv] || fallback || 'Open'; }
  function currentPriority(inv){ return state.priorities[inv] || 'Normal'; }
  function escalated(inv){ return !!state.escalations[inv]; }
  function noteList(inv){ return state.notes[inv] || []; }

  const view = { sortKey:'due', sortDir:'asc', q:'', bucket:'', status:'', owner:'' };
  function setSort(k){ if(view.sortKey===k) view.sortDir = view.sortDir==='asc'?'desc':'asc'; else { view.sortKey=k; view.sortDir='asc'; } render(); }
  function resetFilters(){
    if (search) search.value = '';
    if (bucketSel) bucketSel.value = '';
    if (statusSel) statusSel.value = '';
    if (ownerSel) ownerSel.value = '';
    view.q=''; view.bucket=''; view.status=''; view.owner='';
  }

  function render(){
    if(!dataset.length){ tbody.innerHTML = `<tr><td colspan="10" class="muted" style="text-align:center; padding:16px">Load data via Import or ensure sampledata.csv is served</td></tr>`; return; }
    let rows = dataset.map(r=>{
      const inv = getField(r,'inv');
      const due = getField(r,'due');
      const bal = parseNum(getField(r,'open'));
      const bucket = getField(r,'bucket') || bucketFromDays(getField(r,'days'));
      const daysRaw = getField(r,'days');
      const days = daysRaw ? parseInt(daysRaw,10) : daysDiff(due);
      const cust = getField(r,'cust');
      return { inv, due, days, bucket, cust, bal, status: currentStatus(inv, r['Status']), owner: currentOwner(inv), priority: currentPriority(inv), raw:r };
    });
    const q = (view.q||'').toLowerCase();
    if (q){ rows = rows.filter(o=>[o.inv,o.cust,o.status,o.owner,o.bucket].some(v=>String(v).toLowerCase().includes(q))); }
    if (view.bucket) rows = rows.filter(o=>o.bucket===view.bucket);
    if (view.status) rows = rows.filter(o=>o.status===view.status);
    if (view.owner) rows = rows.filter(o=>o.owner===view.owner);
    rows.sort((a,b)=>{
      let A=a[view.sortKey], B=b[view.sortKey];
      if (view.sortKey==='due'){ A=new Date(a.due); B=new Date(b.due); }
      if (view.sortKey==='balance'){ A=a.bal; B=b.bal; }
      if (A<B) return view.sortDir==='asc'?-1:1;
      if (A>B) return view.sortDir==='asc'?1:-1;
      return 0;
    });
    tbody.innerHTML = rows.map(o=>`
      <tr data-inv="${o.inv}">
        <td>${o.due||''}</td>
        <td>${o.days||''}</td>
        <td>${o.bucket||''}</td>
        <td><a class="link" href="#" data-open>${o.inv}</a></td>
        <td>${escapeHtml(o.cust||'')}</td>
        <td>${fmtMoney(o.bal)}</td>
        <td>${escapeHtml(o.status)}</td>
        <td>${escapeHtml(o.owner)}</td>
        <td>${escapeHtml(o.priority)}</td>
        <td><button class="mini-btn" data-open>Open</button></td>
      </tr>`).join('');
  }

  function bucketFromDays(d){ const n=parseInt(d||'0',10); if(n<=0) return 'Current'; if(n<=30) return '1–30'; if(n<=60) return '31–60'; if(n<=90) return '61–90'; return '90+'; }

  function openDetail(inv){
    const rec = dataset.find(r=> getField(r,'inv')===inv); if(!rec) return;
    const wrap = document.getElementById('colDetailBody');
    document.getElementById('colDetailTitle').textContent = `${getField(rec,'cust')} — ${inv}`;
    document.getElementById('colDetailMeta').textContent = `${getField(rec,'due')||'—'} · ${fmtMoney(parseNum(getField(rec,'open')))} · ${getField(rec,'bucket')||bucketFromDays(getField(rec,'days'))}`;
    const invStatus = currentStatus(inv, rec['Status']);
    const owner = currentOwner(inv);
    const pri = currentPriority(inv);
    const esc = escalated(inv);
    const notes = noteList(inv);
    const milestones = state.milestones[inv] || [];
    wrap.innerHTML = `
      <div class="col-toolbar">
        <select id="colDStatus" class="mini-btn"><option>Open</option><option>Dispute</option><option>Promise</option><option>Partial</option><option>Paid</option><option>Hold</option></select>
        <input id="colDOwner" class="mini-btn" list="ownersList" value="${escapeHtml(owner)}" placeholder="Owner" />
        <select id="colDPriority" class="mini-btn"><option ${pri==='Low'?'selected':''}>Low</option><option ${pri==='Normal'?'selected':''}>Normal</option><option ${pri==='High'?'selected':''}>High</option><option ${pri==='Urgent'?'selected':''}>Urgent</option></select>
        <button id="colDEsc" class="mini-btn" title="Escalate">${esc?'Escalated':'Escalate'}</button>
        <button id="colDEmail" class="mini-btn" title="Email">Email</button>
      </div>
      <div>
        <h3 style="margin:8px 0 6px; font-size:14px">Notes</h3>
        <div class="collections-notes" id="colNotes">
          ${notes.map(n=>`<div class="note-item"><div>${escapeHtml(n.text)}</div><div class="note-meta">${n.by||'Me'} · ${new Date(n.ts).toLocaleString()}</div></div>`).join('')}
        </div>
        <div class="col-inline" style="margin-top:6px"><input id="colNoteInput" placeholder="Add a note and press Enter" style="flex:1; padding:8px 10px; border:1px solid #e7e7f3; border-radius:10px"/></div>
      </div>
      <div>
        <h3 style="margin:8px 0 6px; font-size:14px">Milestones</h3>
        <div id="colMilestones" class="collections-notes">
          ${milestones.map((m,idx)=>`
            <div class="note-item milestone-item ${(!m.done && m.due && new Date(m.due) < new Date()) ? 'overdue' : ''}" data-idx="${idx}">
              <div style="display:flex; align-items:center; gap:8px; justify-content:space-between">
                <label style="display:flex; align-items:center; gap:8px">
                  <input type="checkbox" ${m.done?'checked':''} data-ms-done>
                  <span ${m.done?'style="text-decoration:line-through; color:#9aa0b4"':''}>${escapeHtml(m.text)}</span>
                </label>
                <div class="note-meta">Due: ${m.due ? new Date(m.due).toLocaleDateString() : '—'}</div>
              </div>
      <div class="note-meta">Created ${new Date(m.ts).toLocaleString()}</div>
              <div style="margin-top:6px"><button class="mini-btn" data-ms-del>Delete</button></div>
            </div>`).join('')}
        </div>
        <div class="col-inline" style="margin-top:6px; gap:6px">
          <input id="msText" placeholder="Add milestone" style="flex:1; padding:8px 10px; border:1px solid #e7e7f3; border-radius:10px"/>
          <input id="msDue" type="date" class="mini-btn" style="padding:8px 10px"/>
          <button id="msAdd" class="mini-btn">Add</button>
        </div>
      </div>
      <div>
        <h3 style="margin:8px 0 6px; font-size:14px">Activity</h3>
        <div id="colActivity" class="mini-list"></div>
      </div>`;
    // Set current select values
    const selSt = document.getElementById('colDStatus'); selSt.value = invStatus;
    document.getElementById('colDOwner').value = owner;

    selSt.addEventListener('change', ()=>{ state.statuses[inv]=selSt.value; save(); render(); });
    const ownerInput = document.getElementById('colDOwner');
    const onOwnerChange = ()=>{ const val = ownerInput.value.trim(); state.assignments[inv]= val || 'Unassigned'; save(); buildOwnerSuggestions(); render(); };
    ownerInput.addEventListener('change', onOwnerChange);
    ownerInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); onOwnerChange(); ownerInput.blur(); } });
    document.getElementById('colDPriority').addEventListener('change', (e)=>{ state.priorities[inv]=e.target.value; save(); render(); });
    document.getElementById('colDEsc').addEventListener('click', ()=>{ state.escalations[inv]=!state.escalations[inv]; save(); openDetail(inv); render(); });
    document.getElementById('colNoteInput').addEventListener('keydown', (e)=>{
      if(e.key!=='Enter') return; const t=e.target.value.trim(); if(!t) return; e.target.value='';
      const list = state.notes[inv] = state.notes[inv]||[]; list.unshift({ text:t, ts:Date.now(), by:'Me' }); save(); openDetail(inv);
    });
    document.getElementById('colDEmail').addEventListener('click', ()=> openEmailComposer(inv, rec));

    // Milestone handlers
    const msWrap = document.getElementById('colMilestones');
    const addMs = ()=>{
      const text = document.getElementById('msText').value.trim();
      const due = document.getElementById('msDue').value;
      if(!text) return;
      const list = state.milestones[inv] = state.milestones[inv] || [];
      list.push({ text, due: due||'', done:false, ts: Date.now() });
      save(); openDetail(inv);
    };
    document.getElementById('msAdd').addEventListener('click', addMs);
    document.getElementById('msText').addEventListener('keydown', (e)=>{ if(e.key==='Enter') addMs(); });
    msWrap.addEventListener('click', (e)=>{
      const item = e.target.closest('.milestone-item'); if(!item) return;
      const idx = parseInt(item.dataset.idx,10);
      if (e.target.matches('[data-ms-del]')){
        const list = state.milestones[inv] || []; list.splice(idx,1); save(); openDetail(inv); return;
      }
      if (e.target.matches('[data-ms-done]')){
        const list = state.milestones[inv] || []; if(list[idx]){ list[idx].done = !!e.target.checked; save(); }
      }
    });
  }

  function openEmailComposer(inv, rec){
    let box = document.getElementById('emailCompose');
    if(box) box.remove();
    box = document.createElement('div'); box.id='emailCompose';
    Object.assign(box.style,{position:'fixed', right:'24px', bottom:'24px', width:'420px', background:'#fff', border:'1px solid #e7e7f3', borderRadius:'12px', boxShadow:'0 12px 36px rgba(31,35,70,.16)', padding:'10px', zIndex:9999});
    box.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px"><strong>Email ${escapeHtml(rec['Customer Name']||'')}</strong><button class="mini-btn" id="emailClose">✕</button></div>
      <input id="emTo" placeholder="To" value="${escapeHtml(rec['Billing Email']||'')}" style="width:100%; padding:8px; border:1px solid #e7e7f3; border-radius:10px; margin:4px 0"/>
      <input id="emSub" placeholder="Subject" value="Invoice ${inv} — ${fmtMoney(parseNum(rec['Open Balance']))}" style="width:100%; padding:8px; border:1px solid #e7e7f3; border-radius:10px; margin:4px 0"/>
      <textarea id="emBody" rows="6" style="width:100%; padding:8px; border:1px solid #e7e7f3; border-radius:10px">Hello ${escapeHtml(rec['Customer Name']||'')},\n\nThis is a reminder regarding invoice ${inv}, currently ${rec['Aging Bucket']||bucketFromDays(rec['Days Past Due'])}. The outstanding balance is ${fmtMoney(parseNum(rec['Open Balance']))}.\n\nPlease reply with payment timing or any issues.\n\nThanks,\nCollections Team</textarea>
      <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end"><button class="mini-btn" id="emCancel">Cancel</button><button class="mini-btn" id="emSend">Send</button></div>`;
    document.body.appendChild(box);
    const close=()=>box.remove(); box.querySelector('#emailClose').addEventListener('click', close); box.querySelector('#emCancel').addEventListener('click', close);
    box.querySelector('#emSend').addEventListener('click', ()=>{
      const list = state.emails[inv] = state.emails[inv]||[]; list.push({ to:box.querySelector('#emTo').value, sub:box.querySelector('#emSub').value, body:box.querySelector('#emBody').value, ts:Date.now() }); save(); close(); openDetail(inv);
    });
  }

  function exportCSV(){
    const rows = [['Invoice','Customer','Due','Days','Bucket','Open','Status','Owner','Priority']];
    Array.from(tbody.querySelectorAll('tr')).forEach(tr=>{
      const tds=tr.querySelectorAll('td');
      if(!tds.length) return; rows.push([tds[3].innerText, tds[4].innerText, tds[0].innerText, tds[1].innerText, tds[2].innerText, tds[5].innerText, tds[6].innerText, tds[7].innerText, tds[8].innerText]);
    });
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='collections_export.csv'; a.click(); URL.revokeObjectURL(a.href);
  }

  function digest(){
    if(!dataset.length) return;
    const rows = Array.from(tbody.querySelectorAll('tr')).map(tr=>({
      inv: tr.dataset.inv,
      due: tr.children[0].innerText,
      days: parseInt(tr.children[1].innerText||'0',10),
      bucket: tr.children[2].innerText,
      cust: tr.children[4].innerText,
      open: tr.children[5].innerText
    }));
    const count = rows.length;
    const over90 = rows.filter(r=>r.bucket==='90+').length;
    const top5 = rows.sort((a,b)=> (parseNum(b.open)-parseNum(a.open))).slice(0,5);
    const lines = [
      `Collections Digest — ${new Date().toLocaleString()}`,
      `Cases in view: ${count} · 90+: ${over90}`,
      'Top 5 by balance:',
      ...top5.map(r=>`  • ${r.cust} — ${r.inv} — ${r.open} — due ${r.due}`)
    ];
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text).catch(()=>{});
    alert('Digest copied to clipboard');
  }

  // Wire events
  table.querySelectorAll('th.sortable').forEach(th=> th.addEventListener('click', ()=>{ setSort(th.dataset.sort); table.querySelectorAll('th.sortable').forEach(t=>t.classList.remove('sort-desc')); if(view.sortDir==='desc') th.classList.add('sort-desc'); }));
  search?.addEventListener('input', ()=>{ view.q=search.value.trim(); render(); });
  bucketSel?.addEventListener('change', ()=>{ view.bucket=bucketSel.value; render(); });
  statusSel?.addEventListener('change', ()=>{ view.status=statusSel.value; render(); });
  // Owner filter supports free text via input with suggestions
  ownerSel?.addEventListener('input', ()=>{ view.owner=(ownerSel.value||'').trim(); render(); });
  ownerSel?.addEventListener('change', ()=>{ view.owner=(ownerSel.value||'').trim(); render(); });
  tbody.addEventListener('click', (e)=>{ const open = e.target.closest('[data-open]'); if(!open) return; const tr = e.target.closest('tr'); openDetail(tr.dataset.inv); });
  exportBtn?.addEventListener('click', exportCSV);
  digestBtn?.addEventListener('click', digest);
  // Import/paste/sample disabled in standalone flow

  // Drag-and-drop import disabled in standalone flow

  load();

  function setStatus(msg){
    const el = document.getElementById('colStatus');
    if(el){ el.textContent = msg; setTimeout(()=>{ if(el.textContent===msg) el.textContent=''; }, 6000); }
  }
}

// -------------------------------------------------------------
// Subtabs (secondary tabs) + left-rail sync
function initSubtabs(){
  // Event delegation for clicking on .subtab buttons
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.subtab');
    if(!btn) return;

    const group = btn.closest('.subnav');
    if(!group) return;

    const target = btn.dataset.subtab;
    // Update active state and ARIA
    group.querySelectorAll('.subtab').forEach(b=>{
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
    });

    // Toggle panels: ensure only the target panel is visible
    document.querySelectorAll('[data-subtab-panel]').forEach(p=>{
      p.classList.toggle('is-hidden', p.dataset.subtabPanel !== target);
    });

    // Show only this subnav group; hide the rest
    document.querySelectorAll('.subnav').forEach(nav=>{
      nav.classList.toggle('is-hidden', nav !== group);
    });

    // Reflect in URL for deep-linking
    if(history.pushState){ history.replaceState(null, '', `#${target}`); }

    // Sync left-rail: show only the matching subgroup and update highlights
    const label = group.getAttribute('aria-label');
    let shownSubgroup = null;
    document.querySelectorAll('.nav-subgroup').forEach(sg=>{
      const match = sg.getAttribute('aria-label') === label;
      sg.classList.toggle('is-hidden', !match);
      if (match) shownSubgroup = sg;
      // update current state for items inside the shown group only
      sg.querySelectorAll('.nav-subitem').forEach(a=>{
        a.classList.toggle('is-current', match && a.dataset.subtabJump === target);
      });
    });

    // Highlight the corresponding main nav item for the shown subgroup
    if (shownSubgroup) {
      const mainItems = document.querySelectorAll('.nav-item');
      mainItems.forEach(it=>it.classList.remove('active'));
      const preceding = shownSubgroup.previousElementSibling;
      if (preceding && preceding.classList && preceding.classList.contains('nav-item')) {
        preceding.classList.add('active');
      }
    }

    // UX nicety: focus the search box when entering Dashboard > Search
    if (target === 'dash-search') {
      const ps = document.getElementById('dashSearch');
      if (ps) {
        try { ps.focus({ preventScroll: true }); }
        catch { try { ps.focus(); } catch {} }
      }
    }

    // Close sidebar widget gallery if open to prevent overlay blocking
    const sideGallery = document.getElementById('widgetGallerySide');
    if (sideGallery){
      sideGallery.classList.add('is-hidden');
      sideGallery.setAttribute('aria-hidden','true');
      document.body.classList.remove('widgets-gallery-open');
    }

    // Notify listeners which subtab is now active
    try { document.dispatchEvent(new CustomEvent('subtab:changed', { detail:{ id: target } })); } catch {}
  }, { passive:true });

  // Restore initial tab from URL hash (fallback to first .subtab)
  const initial = (location.hash || '').replace('#','');
  const initBtn = initial ? document.querySelector(`.subtab[data-subtab="${initial}"]`) : document.querySelector('.subtab');
  if(initBtn) initBtn.click();

  // Basic keyboard support for tabs within a subnav group
  document.addEventListener('keydown', (e)=>{
    if(!e.target.classList || !e.target.classList.contains('subtab')) return;
    const current = e.target;
    const group = current.closest('.subnav');
    if(!group) return;
    const tabs = Array.from(group.querySelectorAll('.subtab'));
    const idx = tabs.indexOf(current);
    if(e.key === 'ArrowRight'){ (tabs[idx+1] || tabs[0]).focus(); }
    if(e.key === 'ArrowLeft'){ (tabs[idx-1] || tabs[tabs.length-1]).focus(); }
    if(e.key === 'Enter' || e.key === ' '){ current.click(); }
  });
}

function initNavSubJumps(){
  // Cancel all dummy anchors so the URL never becomes index.html#
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href="#"]');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  });

  // Left-rail mini links that jump to a subtab (data-subtab-jump="service-wip", etc.)
  document.addEventListener('click', (e)=>{
    const link = e.target.closest('[data-subtab-jump]');
    if(!link) return;
    e.preventDefault(); // <-- block # navigation
    e.stopPropagation();

    const subtab = link.dataset.subtabJump;
    const btn = document.querySelector(`.subtab[data-subtab="${subtab}"]`);
    if(btn) btn.click();

    // Update left-rail highlight only within the current subgroup
    const group = link.closest('.nav-subgroup');
    if(group){
      group.querySelectorAll('.nav-subitem').forEach(a=>{
        a.classList.toggle('is-current', a === link);
      });
    }
  });

  // Main nav item click: jump to its Overview (or first subitem) without changing hash
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.nav-item');
    if(!item) return;

    // If it's a real link (not '#'), leave it alone
    const href = item.getAttribute('href');
    if (href && href !== '#') return;

    e.preventDefault(); // <-- block # navigation
    e.stopPropagation();

    const subgroup = item.nextElementSibling;
    if(subgroup && subgroup.classList && subgroup.classList.contains('nav-subgroup')){
      const label = subgroup.getAttribute('aria-label')||'';
      const map = {
        'Home subtabs':'dash',
        'Receivables subtabs':'recv',
        'Payables subtabs':'pay',
        'Cash Flow subtabs':'cf',
        'Collections subtabs':'col',
        'Projects subtabs':'projects',
        'Service subtabs':'service',
        'Compliance subtabs':'compliance',
        'Admin subtabs':'admin'
      };
      const prefix = map[label];
      let targetId = prefix ? `${prefix}-overview` : null;

      // Fallback to first left-rail subitem if no overview exists
      if(!document.querySelector(`.subtab[data-subtab="${targetId}"]`)){
        const first = subgroup.querySelector('.nav-subitem');
        targetId = first ? first.dataset.subtabJump : null;
      }
      if(targetId){
        const btn = document.querySelector(`.subtab[data-subtab="${targetId}"]`);
        btn?.click();
      }
    }
  });
}

// ------------------------------ Security Gates -----------------------------
function applySecurityGates(){
  // Read flags and current role perms
  let flags = {};
  try { (JSON.parse(localStorage.getItem('admin.flags.v1')||'[]')||[]).forEach(f=>{ flags[f.key]=!!f.enabled; }); } catch {}
  let roles = [];
  try { roles = JSON.parse(localStorage.getItem('admin.roles.v1')||'[]')||[]; } catch {}
  const currentRoleId = localStorage.getItem('admin.currentRoleId.v1') || (roles[0]?.id || '');
  const role = roles.find(r=>r.id===currentRoleId) || roles[0] || { perms:{} };
  const perms = role.perms || {};

  // Toggle visibility for elements with data-perm / data-flag
  document.querySelectorAll('[data-perm]').forEach(el=>{
    const need = el.getAttribute('data-perm');
    const allow = !!perms[need];
    el.classList.toggle('is-hidden', !allow);
  });
  document.querySelectorAll('[data-flag]').forEach(el=>{
    const key = el.getAttribute('data-flag');
    const on = !!flags[key];
    el.classList.toggle('is-hidden', !on);
  });

  // Ensure active subtab remains visible; otherwise pick first visible
  document.querySelectorAll('.subnav').forEach(group=>{
    const tabs = Array.from(group.querySelectorAll('.subtab'));
    if(tabs.length===0) return;
    const active = group.querySelector('.subtab.is-active');
    const visibleTabs = tabs.filter(t=>!t.classList.contains('is-hidden'));
    if(visibleTabs.length===0) return;
    if(!active || active.classList.contains('is-hidden')){
      visibleTabs[0].click();
    }
  });
}

// ------------------------ Collections: Timeline (AR) ------------------------
function initCollectionsTimeline(){
  const panel = document.querySelector('[data-subtab-panel="col-overview"]');
  if(!panel) return;
  let booted = false;
  const boot = ()=>{ if(booted) return; booted = true; try{ setupArTimeline(panel); }catch(e){} };
  document.addEventListener('subtab:changed', (e)=>{ if((e.detail?.id||'')==='col-overview') boot(); });
  if (!panel.classList.contains('is-hidden')) boot();
}

// ------------------------ Collections: Configuration ------------------------
function initCollectionsConfig(){
  const panel = document.querySelector('[data-subtab-panel="col-config"]');
  if(!panel) return;
  let booted=false; const boot=()=>{ if(booted) return; booted=true; try{ setupConfig(panel); }catch(e){} };
  document.addEventListener('subtab:changed', (e)=>{ if((e.detail?.id||'')==='col-config') boot(); });
  if(!panel.classList.contains('is-hidden')) boot();
}

function setupConfig(root){
  const $ = s => root.querySelector(s);
  // Draft state: clone Master state
  let draft = {}; try{ draft = JSON.parse(localStorage.getItem('master.state.v1')||'{}'); }catch{ draft={} }
  draft = JSON.parse(JSON.stringify(draft||{}));

  const demoTable = $('#cfgDemoTable');
  const publishBtn = $('#cfgPublish');
  const agedOn = $('#cfgAgedOn');
  const aliasGlobal = $('#cfgAliasGlobal');
  const defView = $('#cfgDefaultView');
  const list = $('#cfgColsList');
  const editor = $('#cfgColsEditor');

  function getDataset(){ try{ return (window.MasterSource?.getDataset?.(draft.view)||window.MasterSource?.getDataset?.()) || { headers:[], rows:[] }; }catch{ return { headers:[], rows:[] } } }

  function renderDemo(){ const ds=getDataset(); const cols = (draft.order||ds.headers).filter(h=> (draft.visible||{})[h]!==false ); const head = `<thead><tr>${cols.map(h=>`<th>${(draft.aliasActive && (draft.aliases||{})[h])?draft.aliases[h]:h}</th>`).join('')}</tr></thead>`; const body = `<tbody>${(ds.rows||[]).slice(0,50).map(r=>`<tr>${cols.map(h=>{ const ix=ds.headers.indexOf(h); return `<td>${r[ix]||''}</td>`; }).join('')}</tr>`).join('')}</tbody>`; demoTable.innerHTML = head+body; }

  function renderTableSettings(){
    try { agedOn.value = draft.agedOn || new Date().toISOString().slice(0,10); } catch {}
    aliasGlobal.checked = !!draft.aliasActive;
    try {
      const views = JSON.parse(localStorage.getItem('master.views.v1')||'[]');
      const cur = draft.view||'';
      defView.innerHTML = ['<option value="">— Default View —</option>']
        .concat(views.map(v=>`<option ${v.name===cur?'selected':''}>${v.name}</option>`)).join('');
    } catch {}
  }

  function buildColsList(sel){ const ds=getDataset(); const order = draft.order && draft.order.length ? draft.order.slice() : ds.headers.slice(); draft.order = order; draft.visible = draft.visible || Object.fromEntries(order.map(h=>[h,true])); list.innerHTML = order.map(h=>`<div class="col-item${h===sel?' is-active':''}" data-col="${h}" draggable="true"><span>${h}</span><span style="margin-left:auto" class="muted">${draft.visible[h]?'Visible':'Hidden'}</span></div>`).join(''); list.querySelectorAll('[data-col]')?.forEach(it=>{ it.addEventListener('click',()=>{ list.querySelector('.is-active')?.classList.remove('is-active'); it.classList.add('is-active'); renderColEditor(it.getAttribute('data-col')); }); it.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain', it.getAttribute('data-col')); }); it.addEventListener('dragover',e=>e.preventDefault()); it.addEventListener('drop',e=>{ e.preventDefault(); const src=e.dataTransfer.getData('text/plain'); const dst=it.getAttribute('data-col'); const a=draft.order.slice(); const from=a.indexOf(src); const to=a.indexOf(dst); if(from<0||to<0||src===dst) return; a.splice(to,0,a.splice(from,1)[0]); draft.order=a; saveDraft(); buildColsList(src); renderDemo(); }); }); if(order.length) renderColEditor(sel||order[0]); }

  function renderColEditor(col){ const v = (draft.visible||{})[col]!==false; const pinned = (draft.pinned||[]).includes(col); editor.innerHTML = `<div class="panel" style="padding:10px; display:grid; gap:8px"><div class="kv"><label>Alias</label><div class="val"><input id="edAlias" value="${(draft.aliases||{})[col]||''}"/></div></div><label><input id="edVisible" type="checkbox" ${v?'checked':''}/> Visible</label><label><input id="edPinned" type="checkbox" ${pinned?'checked':''}/> Pin Left</label></div>`; editor.querySelector('#edAlias')?.addEventListener('input',e=>{ draft.aliases=draft.aliases||{}; draft.aliases[col]=e.target.value; saveDraft(); renderDemo(); }); editor.querySelector('#edVisible')?.addEventListener('change',e=>{ draft.visible=draft.visible||{}; draft.visible[col]=!!e.target.checked; saveDraft(); renderDemo(); buildColsList(col); }); editor.querySelector('#edPinned')?.addEventListener('change',e=>{ draft.pinned=draft.pinned||[]; const i=draft.pinned.indexOf(col); if(e.target.checked && i<0){ if(draft.pinned.length<3) draft.pinned.push(col);} if(!e.target.checked && i>=0){ draft.pinned.splice(i,1);} saveDraft(); renderDemo(); }); }

  function saveDraft(){ try{ localStorage.setItem('master.state.draft', JSON.stringify(draft)); }catch{} }

  // Wire settings controls
  agedOn?.addEventListener('change', ()=>{ draft.agedOn = agedOn.value; saveDraft(); renderDemo(); });
  aliasGlobal?.addEventListener('change', ()=>{ draft.aliasActive = !!aliasGlobal.checked; saveDraft(); renderDemo(); });
  defView?.addEventListener('change', ()=>{ draft.view = defView.value || ''; saveDraft(); renderDemo(); });

  // Config subtabs
  const cfgTabs = root.querySelectorAll('[data-cfgtab]');
  root.addEventListener('click', (e)=>{ const b=e.target.closest('[data-cfgtab]'); if(!b) return; cfgTabs.forEach(t=> t.classList.remove('is-active')); b.classList.add('is-active'); $('#cfgTablePanel').style.display = b.dataset.cfgtab==='cfg-table'?'block':'none'; $('#cfgColumnsPanel').style.display = b.dataset.cfgtab==='cfg-columns'?'block':'none'; });

  publishBtn?.addEventListener('click', ()=>{ try{ localStorage.setItem('master.state.v1', JSON.stringify(draft)); showToast('Published to Master','success'); }catch{ showToast('Failed to publish','error'); } });

  renderTableSettings(); buildColsList(); renderDemo();
}

// ------------------------- Collections: Master (Data Grid) ------------------
function initMasterGrid(){
  const panel = document.querySelector('[data-subtab-panel="col-master"]');
  if(!panel) return;
  let booted = false;
  const boot = ()=>{ if(booted) return; booted = true; try{ setupMaster(panel); }catch(e){} };
  document.addEventListener('subtab:changed', (e)=>{ if((e.detail?.id||'')==='col-master') boot(); });
  if (!panel.classList.contains('is-hidden')) boot();
}

  function setupMaster(root){
  const $ = s => root.querySelector(s);
  const table = $('#masterTable');
  const quick = $('#masterQuickFilters');
  const search = $('#masterSearch');
  const viewsSel = $('#masterView');
  const colsBtn = $('#masterConfigureBtn');
  const colsSide = document.getElementById('colsConfigSide');
  const colsSideList = document.getElementById('colsSideList');
  const colsSideEditor = document.getElementById('colsSideEditor');
  const colsSwapBtn = document.getElementById('colsSwap');
  const colsResetBtn = document.getElementById('colsReset');
  const colsCloseBtn = document.getElementById('colsClose');
  const saveBtn = $('#masterSaveView');
  const saveAsBtn = $('#masterSaveViewAs');
  const detailsToggle = $('#masterDetailsToggle');
  const aliasGlobalToggle = $('#masterAliasGlobalToggle');
  const defaultViewSel = $('#masterDefaultView');
  const layout = $('#masterBody');
  const detail = $('#masterDetail');
  const mdTitle = $('#mdTitle');
  const mdBody = $('#mdBody');

  const STATE_KEY = 'master.state.v1';
  const VIEWS_KEY = 'master.views.v1';
  const EDITS_KEY = 'master.edits.v1';

  let state = loadState();
  let views = loadViews();
  let edits = loadEdits();
  let data = { headers:[], rows:[] };
  let sort = state.sort || null; // {col, dir}

  function loadState(){ try{ return JSON.parse(localStorage.getItem(STATE_KEY)||'{}'); }catch{ return {}; } }
  function saveState(){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }catch{} }
  function loadViews(){ try{ return JSON.parse(localStorage.getItem(VIEWS_KEY)||'[]'); }catch{ return []; } }
  function saveViews(){ try{ localStorage.setItem(VIEWS_KEY, JSON.stringify(views)); }catch{} }
  function loadEdits(){ try{ return JSON.parse(localStorage.getItem(EDITS_KEY)||'{}'); }catch{ return {}; } }
  function saveEdits(){ try{ localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); }catch{} }

  function parseCSV(str){ const out=[]; let row=[]; let i=0; let cur=''; let q=false; while(i<str.length){ const ch=str[i]; if(q){ if(ch==='"' && str[i+1]==='"'){ cur+='"'; i+=2; continue; } if(ch==='"'){ q=false; i++; continue; } cur+=ch; i++; continue; } if(ch==='"'){ q=true; i++; continue; } if(ch===','){ row.push(cur); cur=''; i++; continue; } if(ch==='\r'){ i++; continue; } if(ch==='\n'){ row.push(cur); out.push(row); row=[]; cur=''; i++; continue; } cur+=ch; i++; } if(cur.length||row.length) { row.push(cur); out.push(row); } return out; }

  async function loadCSV(){
    try{
      const res = await fetch('sampledata.csv'); if(!res.ok) throw new Error('csv');
      const text = await res.text();
      const rows = parseCSV(text);
      const headers = (rows.shift()||[]).map(h=>h.trim());
      data.headers = headers;
      data.rows = rows;
      initializeColumns(headers);
      renderAll();
    }catch(e){ table.innerHTML = '<thead><tr><th>Load Error</th></tr></thead><tbody><tr><td class="muted">Could not load sampledata.csv</td></tr></tbody>'; }
  }

  function initializeColumns(headers){
    state.order = Array.isArray(state.order) && state.order.length ? state.order.filter(h=>headers.includes(h)) : headers.slice();
    state.visible = state.visible || Object.fromEntries(headers.map(h=>[h,true]));
    state.aliases = state.aliases || {};
    state.types = state.types || {}; // Auto|Text|Number|Date|Currency
    state.locked = state.locked || {}; // column -> bool
    state.keys = state.keys || {}; // column -> bool
    state.pinned = Array.isArray(state.pinned) ? state.pinned.filter(h=>headers.includes(h)).slice(0,3) : [];
    state.filters = state.filters || {}; // column -> string
    saveState();
    renderViewsDropdown();
  }

  function renderViewsDropdown(){
    const cur = state.view || '';
    viewsSel.innerHTML = ['<option value="">— View —</option>'].concat(views.map(v=>`<option ${v.name===cur?'selected':''}>${v.name}</option>`)).join('');
    // Default view select
    const def = localStorage.getItem('master.defaultView') || '';
    defaultViewSel.innerHTML = ['<option value="">— Default View —</option>'].concat(views.map(v=>`<option ${v.name===def?'selected':''}>${v.name}</option>`)).join('');
  }

  function currentColumns(){ return state.order.filter(h=>state.visible[h]); }

  function headerCell(h){
    const pinned = state.pinned.includes(h);
    const width = (state.widths && state.widths[h]) ? `style=\"width:${state.widths[h]}px; min-width:${state.widths[h]}px\"` : '';
    const label = (state.aliasActive && (state.aliases[h]||'').trim()) ? state.aliases[h].trim() : h;
    return `<th data-col="${h}" draggable="true" class="${pinned?'pinned':''}" ${width}><div class="th-head"><span class="th-title" title="${h}">${label}</span><span class="col-resize" data-resize="${h}"></span></div></th>`;
  }
  function aliasCell(h){ const a=state.aliases[h]||''; return `<th><input data-alias="${h}" placeholder="Alias" value="${a}"/></th>`; }
  function filterCell(h){ const f=state.filters[h]||''; return `<th><input data-filter="${h}" placeholder="Filter" value="${f}"/></th>`; }

  function applyFilters(rows){
    const q = (search?.value||'').toLowerCase();
    const active = Object.entries(state.filters).filter(([,v])=>String(v||'').trim()!=='');
    const quickOn = Object.entries(state.quick||{}).filter(([,cfg])=>cfg && cfg.on);
    if(active.length===0 && !q && quickOn.length===0) return rows;
    return rows.filter(r=>{
      const rowStr = r.join(' ').toLowerCase();
      if(q && !rowStr.includes(q)) return false;
      for(const [col,val] of active){ const idx=data.headers.indexOf(col); if(idx<0) continue; const cell=String(r[idx]||''); if(!cell.toLowerCase().includes(String(val).toLowerCase())) return false; }
      for(const [col,cfg] of quickOn){ const idx=data.headers.indexOf(col); if(idx<0) continue; const v=String(r[idx]||''); const sel = cfg.values||{}; if(Object.keys(sel).length && sel[v]===false) return false; }
      return true;
    });
  }

  function applySort(rows){
    if(!sort) return rows;
    const idx = data.headers.indexOf(sort.col);
    if(idx<0) return rows;
    const dir = sort.dir==='desc'?-1:1;
    return rows.slice().sort((a,b)=>{ const va=a[idx]||''; const vb=b[idx]||''; const ta=state.types[sort.col]||'Auto'; const pa=parseVal(va,ta); const pb=parseVal(vb,ta); if(pa<pb) return -1*dir; if(pa>pb) return 1*dir; return 0; });
  }
  function parseVal(v, t){ if(t==='Number'||t==='Currency'){ const n=Number(String(v).replace(/[^0-9.\-]/g,'')); return isNaN(n)?0:n } if(t==='Date'){ const d=new Date(v); return d.getTime()||0 } if(t==='Boolean'){ return (String(v).toLowerCase()==='true'||String(v).toLowerCase()==='yes'||String(v)==='1')?1:0 } return String(v).toLowerCase(); }

  function renderTable(){
    const cols = currentColumns();
    const headRow = `<tr class="head-row">${cols.map(headerCell).join('')}</tr>`;
    const thead = `<thead>${headRow}</thead>`;
    const filtered = applyFilters(applySort(data.rows));
    const colIdx = cols.map(c=> data.headers.indexOf(c));
    const keyCol = Object.keys(state.keys).find(k=>state.keys[k]) || data.headers[0];
    const body = filtered.map((r,i)=>{
      const rowKey = r[data.headers.indexOf(keyCol)] || String(i);
      return `<tr>${colIdx.map((ix,j)=>{
        const h = cols[j];
        let val = r[ix]||'';
        if(edits[rowKey] && h in edits[rowKey]) val = edits[rowKey][h];
        const pinned = state.pinned.includes(h);
        const width = (state.widths && state.widths[h]) ? `style=\"width:${state.widths[h]}px; min-width:${state.widths[h]}px\"` : '';
        return `<td data-col="${h}" data-rowkey="${rowKey}" class="${pinned?'pinned':''}" ${width}>${formatCell(val, state.types[h], state.formats?.[h])}</td>`;
      }).join('')}</tr>`;
    }).join('');
    table.innerHTML = thead + `<tbody>${body}</tbody>`;
    wireTableInteractions();
    computePinnedOffsets();
  }

  function formatCell(v, t, fmt){
    t = t || 'Auto'; fmt = fmt || {};
    if(t==='Boolean'){
      const style = fmt.style||'truefalse';
      const truthy = (String(v).toLowerCase()==='true'||String(v).toLowerCase()==='yes'||String(v)==='1');
      if(style==='checkbox') return truthy? '☑︎' : '☐';
      if(style==='yesno') return truthy? 'Yes' : 'No';
      return truthy? 'True' : 'False';
    }
    if(t==='Currency'){
      const code = fmt.currency || 'USD';
      const d = typeof fmt.decimals==='number' ? fmt.decimals : 2;
      const n = Number(String(v).replace(/[^0-9.\-]/g,''))||0;
      try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:code, minimumFractionDigits:d, maximumFractionDigits:d}).format(n);}catch{ return n.toFixed(d); }
    }
    if(t==='Number'){
      const d = typeof fmt.decimals==='number' ? fmt.decimals : 0;
      const g = (fmt.grouping!==false);
      const n = Number(String(v).replace(/[^0-9.\-]/g,'')); if(isNaN(n)) return v;
      try{ return new Intl.NumberFormat(undefined,{minimumFractionDigits:d, maximumFractionDigits:d, useGrouping:g}).format(n);}catch{ return n.toFixed(d); }
    }
    if(t==='Date'){
      const d = new Date(v); if(isNaN(d)) return v;
      const pad=(n)=> String(n).padStart(2,'0');
      const y=d.getFullYear(), m=pad(d.getMonth()+1), dd=pad(d.getDate());
      const pattern = fmt.pattern || 'YYYY-MM-DD';
      if(pattern==='MM/DD/YYYY') return `${m}/${dd}/${y}`;
      if(pattern==='DD-MM-YYYY') return `${dd}-${m}-${y}`;
      return `${y}-${m}-${dd}`;
    }
    return v;
  }

  function renderQuickFilters(){
    quick.innerHTML = '';
    const statusCol = data.headers.find(h=>/status/i.test(h));
    if(!statusCol) return;
    const idx = data.headers.indexOf(statusCol);
    const values = Array.from(new Set(data.rows.map(r=>r[idx]).filter(Boolean))).slice(0,6);
    quick.innerHTML = values.map(v=>`<button class="tag" data-qf="${statusCol}" data-qv="${String(v).replace(/"/g,'&quot;')}">${v}</button>`).join('');
  }

  // Columns config sidebar helpers
  function openColsSide(focusCol){ buildColsSide(focusCol); document.body.classList.add('config-open'); colsSide?.classList.remove('is-hidden'); }
  function closeColsSide(){ document.body.classList.remove('config-open'); colsSide?.classList.add('is-hidden'); }
  function buildColsSide(focusCol){
    if(!colsSideList) return;
    const cols = state.order.slice();
    colsSideList.innerHTML = cols.map(h=>{
      const badges = [`${state.visible[h]?'Visible':'Hidden'}`, state.pinned.includes(h)?'Pinned':''].filter(Boolean);
      return `<div class="col-item${(h===focusCol)?' is-active':''}" data-colsel="${h}" draggable="true"><span class="label">${h}</span><div class="badges">${badges.map(b=>`<span class=\"badge\">${b}</span>`).join('')}</div></div>`;
    }).join('');
    let sel = focusCol || cols[0];
    renderColEditor(sel);
    colsSideList.querySelectorAll('[data-colsel]')?.forEach(item=>{
      item.addEventListener('click', ()=>{ colsSideList.querySelector('.is-active')?.classList.remove('is-active'); item.classList.add('is-active'); renderColEditor(item.getAttribute('data-colsel')); });
      item.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', item.getAttribute('data-colsel')); });
      item.addEventListener('dragover', (e)=>{ e.preventDefault(); });
      item.addEventListener('drop', (e)=>{ e.preventDefault(); const src=item.getAttribute('data-colsel'); const dragged = e.dataTransfer.getData('text/plain'); if(!dragged||!src||dragged===src) return; const a=state.order.slice(); const from=a.indexOf(dragged); const to=a.indexOf(src); if(from<0||to<0) return; a.splice(to,0,a.splice(from,1)[0]); state.order=a; saveState(); renderTable(); buildColsSide(dragged); });
    });
  }
  function renderColEditor(col){
    if(!colsSideEditor) return;
    if(!col){ colsSideEditor.innerHTML='<p class="muted">Select a column</p>'; return; }
    const fmt = state.formats?.[col] || {};
    const alias = state.aliases?.[col]||'';
    const filter = state.filters?.[col]||'';
    const type = state.types?.[col]||'Auto';
    const locked = !!state.locked?.[col];
    const isKey = !!state.keys?.[col];
    const pinned = (state.pinned||[]).includes(col);
    const width = Number((state.widths||{})[col]||160);
    const quickCfg = state.quick?.[col] || { on:false, values:{} };
    const sortDir = (state.sort && state.sort.col===col) ? state.sort.dir : 'none';
    const i = data.headers.indexOf(col);
    const vals = i>=0 ? Array.from(new Set(data.rows.map(r=> String(r[i]||'')))).slice(0,200) : [];
    colsSideEditor.setAttribute('data-editing', col);
    colsSideEditor.innerHTML = `
      <div class="panel" style="padding:12px; display:grid; gap:10px">
        <div class="section-title">Basics</div>
        <div class="kv"><label>Alias</label><div class="val"><input id="ceAlias" value="${alias}"/></div></div>
        <div class="kv"><label>Type</label><div class="val"><select id="ceType">
          <optgroup label="Plain">
            <option value="Text" ${type==='Text'?'selected':''}>Text (plain)</option>
            <option value="Auto" ${type==='Auto'?'selected':''}>Auto (no format)</option>
          </optgroup>
          <optgroup label="Numbers">
            <option value='{"t":"Number","decimals":0}'>Number (1,234)</option>
            <option value='{"t":"Number","decimals":1}'>Number (1,234.5)</option>
            <option value='{"t":"Number","decimals":2}'>Number (1,234.56)</option>
            <option value='{"t":"Number","decimals":3}'>Number (1,234.567)</option>
            <option value='{"t":"Currency","currency":"USD","decimals":2}'>Currency USD (1,234.56)</option>
            <option value='{"t":"Currency","currency":"EUR","decimals":2}'>Currency EUR (1.234,56)</option>
          </optgroup>
          <optgroup label="Dates">
            <option value='{"t":"Date","pattern":"YYYY-MM-DD"}'>Date (2025-09-01)</option>
            <option value='{"t":"Date","pattern":"MM/DD/YYYY"}'>Date (09/01/2025)</option>
            <option value='{"t":"Date","pattern":"DD-MM-YYYY"}'>Date (01-09-2025)</option>
          </optgroup>
          <optgroup label="Boolean">
            <option value='{"t":"Boolean","style":"truefalse"}'>Boolean (True/False)</option>
            <option value='{"t":"Boolean","style":"yesno"}'>Boolean (Yes/No)</option>
            <option value='{"t":"Boolean","style":"checkbox"}'>Boolean (Checkbox)</option>
          </optgroup>
          <optgroup label="Dropdown">
            <option value='{"t":"Dropdown"}'>Dropdown (set options…)</option>
          </optgroup>
          <optgroup label="Formula">
            <option value='{"t":"Formula","expr":"DAYS_PAST_DUE(''Due Date'')"}'>Formula: Days Past Due</option>
            <option value='{"t":"Formula","expr":"AGING_BUCKET(''Due Date'')"}'>Formula: Aging Bucket</option>
            <option value='{"t":"Formula","expr":""}'>Formula: Custom…</option>
          </optgroup>
        </select></div></div>
        <div id="ceFmt"></div>
        <div class="section-title">Controls</div>
        <label><input id="ceVisible" type="checkbox" ${state.visible[col]?'checked':''}/> Visible</label>
        <label><input id="cePinned" type="checkbox" ${pinned?'checked':''}/> Pin Left</label>
        <label><input id="ceLocked" type="checkbox" ${locked?'checked':''}/> Lock edits</label>
        <label><input id="ceKey" type="checkbox" ${isKey?'checked':''}/> Key column</label>
        <label><input id="ceImportApproval" type="checkbox" ${state.importApproval?'checked':''}/> Import Approval</label>
        <label><input id="ceAudit" type="checkbox" ${state.audit?.[col]?'checked':''}/> Auditable</label>
        <label><input id="ceQuick" type="checkbox" ${quickCfg.on?'checked':''}/> Quick filter</label>
        ${quickCfg.on ? `<div class=\"panel\" style=\"padding:10px\"><div class=\"panel-header\"><h3>Quick Filter Values</h3></div>
          <div style=\"display:flex; gap:8px; margin-bottom:4px\"><button class=\"mini-btn\" id=\"ceQAll\">All</button><button class=\"mini-btn\" id=\"ceQNone\">None</button><button class=\"mini-btn\" id=\"ceQInv\">Invert</button></div>
          ${vals.map(v=>`<label style=\\"display:flex; gap:6px; align-items:center; padding:2px 4px\\"><input type=\\"checkbox\\" data-qv value=\\"${v.replace(/\\\\/g,'\\\\\\\\').replace(/\"/g,'&quot;')}\\" ${quickCfg.values && quickCfg.values[v]===false?'':'checked'}/> <span title=\\"${v}\\">${v||'—'}</span></label>`).join('')}
        </div>` : ''}
      </div>`;
    const fmtHost = colsSideEditor.querySelector('#ceFmt');
    fmtHost.innerHTML = '';
    // Wire inputs
    colsSideEditor.querySelector('#ceAlias')?.addEventListener('input', e=>{ state.aliases[col]=e.target.value; saveState(); renderTable(); renderDetail(); });
    colsSideEditor.querySelector('#ceType')?.addEventListener('change', e=>{
      const raw = e.target.value;
      try{
        let cfg = {};
        try { cfg = JSON.parse(raw); } catch { cfg = { t: raw }; }
        const t = cfg.t || cfg.type || raw;
        state.types[col] = t;
        state.formats[col] = state.formats[col] || {};
        if(t==='Number') state.formats[col].decimals = typeof cfg.decimals==='number'?cfg.decimals: (state.formats[col].decimals||0);
        if(t==='Currency'){ state.formats[col].currency = cfg.currency || state.formats[col].currency || 'USD'; state.formats[col].decimals = typeof cfg.decimals==='number'?cfg.decimals:2; }
        if(t==='Date') state.formats[col].pattern = cfg.pattern || state.formats[col].pattern || 'YYYY-MM-DD';
        if(t==='Boolean') state.formats[col].style = cfg.style || state.formats[col].style || 'truefalse';
        if(t==='Dropdown') state.formats[col].options = state.formats[col].options || 'Option A,Option B';
        if(t==='Formula') state.formats[col].expr = cfg.expr || state.formats[col].expr || '';
      }catch{}
      saveState(); renderTable(); renderColEditor(col);
    });
    colsSideEditor.querySelector('#ceVisible')?.addEventListener('change', e=>{ state.visible[col]=e.target.checked; saveState(); renderTable(); buildColsSide(col); });
    colsSideEditor.querySelector('#cePinned')?.addEventListener('change', e=>{ const i=state.pinned.indexOf(col); if(e.target.checked && i<0){ if(state.pinned.length<3) state.pinned.push(col);} if(!e.target.checked && i>=0){ state.pinned.splice(i,1);} saveState(); renderTable(); buildColsSide(col); });
    colsSideEditor.querySelector('#ceLocked')?.addEventListener('change', e=>{ state.locked[col]=e.target.checked; saveState(); });
    colsSideEditor.querySelector('#ceKey')?.addEventListener('change', e=>{ Object.keys(state.keys).forEach(k=> state.keys[k]=false); state.keys[col]=e.target.checked; saveState(); renderTable(); });
    colsSideEditor.querySelector('#ceAudit')?.addEventListener('change', e=>{ state.audit[col]=e.target.checked; saveState(); });
    colsSideEditor.querySelector('#ceImportApproval')?.addEventListener('change', e=>{ state.importApproval = !!e.target.checked; saveState(); });
    colsSideEditor.querySelector('#ceQuick')?.addEventListener('change', e=>{ state.quick[col]=state.quick[col]||{on:false, values:{}}; state.quick[col].on = e.target.checked; saveState(); renderColEditor(col); renderTable(); });
    // For Dropdown and Formula, render additional fields
    if(state.types[col]==='Dropdown'){
      fmtHost.innerHTML = `<div class="kv"><label>Options</label><div class="val"><input id="ceOptions" placeholder="Comma-separated" value="${state.formats[col].options||'Option A,Option B'}"/></div></div>`;
      fmtHost.querySelector('#ceOptions')?.addEventListener('input', e=>{ state.formats[col].options = e.target.value; saveState(); });
    } else if(state.types[col]==='Formula'){
      fmtHost.innerHTML = `<div class="kv"><label>Expression</label><div class="val"><input id="ceExpr" placeholder="e.g., DAYS_PAST_DUE('Due Date')" value="${state.formats[col].expr||''}"/></div></div>`;
      fmtHost.querySelector('#ceExpr')?.addEventListener('input', e=>{ state.formats[col].expr = e.target.value; saveState(); renderTable(); });
    }
    colsSideEditor.querySelector('#ceQAll')?.addEventListener('click', ()=>{ state.quick[col]=state.quick[col]||{on:true, values:{}}; state.quick[col].values={}; saveState(); renderTable(); renderColEditor(col); });
    colsSideEditor.querySelector('#ceQNone')?.addEventListener('click', ()=>{ const cfg=state.quick[col]=state.quick[col]||{on:true, values:{}}; cfg.values=Object.fromEntries(vals.map(v=>[v,false])); saveState(); renderTable(); renderColEditor(col); });
    colsSideEditor.querySelector('#ceQInv')?.addEventListener('click', ()=>{ const cfg=state.quick[col]=state.quick[col]||{on:true, values:{}}; const cur=cfg.values||{}; cfg.values=Object.fromEntries(vals.map(v=>[v, cur[v]===false ? true : false])); saveState(); renderTable(); renderColEditor(col); });
    colsSideEditor.querySelectorAll('input[data-qv]')?.forEach(cb=> cb.addEventListener('change', ()=>{ const cfg=state.quick[col]=state.quick[col]||{on:true, values:{}}; cfg.values = cfg.values || {}; cfg.values[cb.value] = cb.checked ? true : false; saveState(); renderTable(); }));
    // Move selected via keyboard shortcuts in sidebar (Alt+Up/Down)
    document.addEventListener('keydown', (ev)=>{
      if(!document.body.classList.contains('config-open')) return;
      if(!(ev.altKey && (ev.key==='ArrowUp' || ev.key==='ArrowDown'))) return;
      const cur = colsSideEditor.getAttribute('data-editing');
      const i = state.order.indexOf(cur); if(i<0) return;
      const delta = ev.key==='ArrowUp' ? -1 : 1;
      const j=i+delta; if(j<0||j>=state.order.length) return;
      const a=state.order; a.splice(j,0,a.splice(i,1)[0]); saveState(); renderTable(); buildColsSide(cur);
    });
  }

  function renderAll(){ renderTable(); renderQuickFilters(); renderViewsDropdown(); exposeMasterSource(); renderDetail(); }
  // Apply default view if set and no specific view is active
  (function maybeApplyDefault(){
    try{
      const def = localStorage.getItem('master.defaultView') || '';
      if(def && !state.view){ const v = views.find(v=>v.name===def); if(v){ state = JSON.parse(JSON.stringify(v.state)); state.view = def; saveState(); }}
    }catch{}
  })();

  // Interactions
  function wireTableInteractions(){
    // Column menu removed; use Columns modal instead
    // Drag reorder
    table.querySelectorAll('thead th[draggable="true"]').forEach(th=>{
      th.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', th.getAttribute('data-col')); });
      th.addEventListener('dragover', (e)=>{ e.preventDefault(); });
      th.addEventListener('drop', (e)=>{ e.preventDefault(); const src = e.dataTransfer.getData('text/plain'); const dst = th.getAttribute('data-col'); if(!src||!dst||src===dst) return; const o=state.order.filter(h=>state.visible[h]); const all=state.order.slice(); const from=all.indexOf(src); const to=all.indexOf(dst); if(from<0||to<0) return; all.splice(to,0, all.splice(from,1)[0]); state.order = all; saveState(); renderTable(); });
    });
    // No inline filter dropdowns in headers
    // Column resizing
    table.querySelectorAll('.col-resize')?.forEach(h=>{
      h.addEventListener('mousedown', (e)=>{
        e.preventDefault(); const col=h.getAttribute('data-resize'); const th=h.closest('th'); if(!col||!th) return;
        const startX = e.clientX; const startW = th.getBoundingClientRect().width;
        const onMove = (ev)=>{ const dx=ev.clientX-startX; const w=Math.max(60, Math.round(startW+dx)); state.widths=state.widths||{}; state.widths[col]=w; th.style.width=w+'px'; th.style.minWidth=w+'px'; table.querySelectorAll(`td[data-col="${CSS.escape(col)}"]`).forEach(td=>{ td.style.width=w+'px'; td.style.minWidth=w+'px'; }); computePinnedOffsets(); };
        const onUp = ()=>{ saveState(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      });
    });
    // Inline edit + selection
    table.querySelectorAll('tbody td').forEach(td=>{
      td.addEventListener('dblclick', ()=> startEdit(td));
      td.addEventListener('click', ()=> selectRow(td.closest('tr')));
    });
  }

  // No openFilterMenu: header filters are removed

  let selectedKey = null;
  function selectRow(tr){ if(!tr) return; const key = tr.querySelector('td')?.getAttribute('data-rowkey'); if(!key) return; selectedKey = key; renderDetail(); }
  function renderDetail(){
    if(!detail || !mdBody) return;
    const show = detailsToggle?.checked;
    layout?.classList.toggle('show-detail', !!show);
    detail?.classList.toggle('is-hidden', !show);
    if(!show){ return; }
    const cols = currentColumns();
    mdBody.innerHTML = '';
    if(!selectedKey){ mdTitle.textContent = 'Select a row'; return; }
    const keyCol = Object.keys(state.keys).find(k=>state.keys[k]) || data.headers[0];
    const idxKey = data.headers.indexOf(keyCol);
    const row = data.rows.find((r,i)=>{ const k = r[idxKey] || String(i); return k===selectedKey; });
    if(!row){ mdTitle.textContent = 'Select a row'; return; }
    mdTitle.textContent = `Row: ${selectedKey}`;
    const aliasActive = !!state.aliasActive; const alias = state.aliases||{}; const fmt = state.formats||{};
    mdBody.innerHTML = cols.map(h=>{ const ix=data.headers.indexOf(h); let v=(edits[selectedKey]&&h in edits[selectedKey])?edits[selectedKey][h]:(row[ix]||''); const label=aliasActive&&(alias[h]||'').trim()?alias[h].trim():h; return `<div class="kv"><label>${label}</label><div class="val">${formatCell(v, state.types[h], fmt[h])}</div></div>`; }).join('');
  }

  function startEdit(td){
    const col = td.getAttribute('data-col'); if(state.locked[col]) return;
    if(td.querySelector('input')) return;
    td.classList.add('cell-editing');
    const old = td.textContent;
    const inp = document.createElement('input'); inp.type='text'; inp.value = old; inp.style.width='100%';
    td.innerHTML=''; td.appendChild(inp); inp.focus(); inp.select();
    const finish = (commit)=>{ const val = commit ? inp.value : old; const rowKey = td.getAttribute('data-rowkey'); edits[rowKey]=edits[rowKey]||{}; edits[rowKey][col] = val; saveEdits(); td.classList.remove('cell-editing'); td.innerHTML = formatCell(val, state.types[col]); };
    inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ finish(true);} if(e.key==='Escape'){ finish(false);} });
    inp.addEventListener('blur', ()=> finish(true));
  }

  // Column menu removed; all configuration is handled in the Columns modal

  // Expose Master as source for other tabs
  function exposeMasterSource(){
    try{
      window.MasterSource = {
        getAliases(){ return { map: state.aliases||{}, active: !!state.aliasActive }; },
        getState(){ return state; },
        getDataset(viewName){
          const s = (viewName && (views.find(v=>v.name===viewName)?.state)) ? views.find(v=>v.name===viewName).state : state;
          const headers = data.headers.slice();
          const keyCol = Object.keys(s.keys||{}).find(k=>s.keys[k]) || headers[0];
          const rows = data.rows.map((r,i)=>{
            const rowKey = r[headers.indexOf(keyCol)] || String(i);
            const e = edits[rowKey]||{}; return headers.map((h,ix)=> (h in e) ? e[h] : r[ix]);
          });
          const aliasMap = s.aliases || {};
          const aliasActive = !!s.aliasActive;
          const outHeaders = aliasActive ? headers.map(h=> (aliasMap[h] && aliasMap[h].trim()) ? aliasMap[h].trim() : h) : headers.slice();
          return { headers: outHeaders, rows, aliasMap, aliasActive };
        }
      };
    }catch{}
  }

  function computePinnedOffsets(){
    // Compute left offsets for pinned columns (up to 3)
    const cols = currentColumns();
    const pinnedCols = state.pinned.filter(h=>state.visible[h]);
    if(pinnedCols.length===0) return;
    const ths = table.querySelectorAll('thead th');
    const leftMap = {};
    let left = 0;
    cols.forEach(h=>{
      const isPinned = pinnedCols.includes(h);
      const th = Array.from(ths).find(t=>t.getAttribute('data-col')===h);
      const width = th ? th.getBoundingClientRect().width : 0;
      if(isPinned){ leftMap[h] = left; left += width; }
    });
    const allCells = table.querySelectorAll('[data-col]');
    allCells.forEach(c=>{ const h=c.getAttribute('data-col'); if(h in leftMap){ c.classList.add('pinned'); c.style.left = leftMap[h]+'px'; } else { c.classList.remove('pinned'); c.style.left=''; } });
  }

  // Toolbar and overlay
  search?.addEventListener('input', ()=> renderTable());
  quick?.addEventListener('click', (e)=>{ const b=e.target.closest('[data-qf]'); if(!b) return; const col=b.getAttribute('data-qf'); const val=b.getAttribute('data-qv'); state.filters[col]=val; saveState(); renderTable(); });
  colsBtn?.addEventListener('click', ()=>{ const btn=document.querySelector('.subtab[data-subtab="col-config"]'); if(btn) btn.click(); });
  colsCloseBtn?.addEventListener('click', ()=> closeColsSide());
  colsSwapBtn?.addEventListener('click', ()=>{ const c=document.getElementById('colsConfigContent'); if(c){ const dir=getComputedStyle(c).flexDirection; c.style.flexDirection = dir==='column' ? 'column-reverse' : 'column'; }});
  colsResetBtn?.addEventListener('click', ()=>{ if(!confirm('Reset columns to defaults?')) return; initializeColumns(data.headers.slice()); renderAll(); });
  defaultViewSel?.addEventListener('change', ()=>{ const v=defaultViewSel.value; localStorage.setItem('master.defaultView', v||''); });
  aliasGlobalToggle?.addEventListener('change', ()=>{ state.aliasActive = !!aliasGlobalToggle.checked; saveState(); renderAll(); });
  detailsToggle?.addEventListener('change', ()=> renderDetail());

  viewsSel?.addEventListener('change', ()=>{ const name = viewsSel.value; const v = views.find(v=>v.name===name); if(!v){ state.view=''; saveState(); renderAll(); return; } state = JSON.parse(JSON.stringify(v.state)); state.view = name; saveState(); renderAll(); });
  saveBtn?.addEventListener('click', ()=> saveView(false));
  saveAsBtn?.addEventListener('click', ()=> saveView(true));

  function saveView(forcePrompt){
    let name = state.view || '';
    if(!name || forcePrompt){ name = prompt('Save view as:', name||'My View') || ''; }
    if(!name) return;
    const sn = JSON.parse(JSON.stringify(state)); delete sn.view;
    const i = views.findIndex(v=>v.name===name);
    if(i>=0){ views[i].state = sn; } else { views.push({name, state: sn}); }
    state.view = name; saveViews(); saveState(); renderViewsDropdown(); showToast('View saved','success');
  }

  window.addEventListener('resize', ()=> computePinnedOffsets());

  loadCSV();
}

function setupArTimeline(root){
  const $  = s => root.querySelector(s);
  const $$ = s => root.querySelectorAll(s);
  const esc = s => String(s||'').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const money = n => Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});
  const nowIso = ()=> new Date().toISOString().slice(0,16).replace('T',' ');
  const stripTime = (d)=>{ const x=new Date(d); x.setHours(0,0,0,0); return x };
  const daysBetween=(a,b)=>{ const ms=86400000; return Math.floor((stripTime(a)-stripTime(b))/ms) };
  const relTime=(iso)=>{ try{ const then=new Date(iso); const diff=(Date.now()-then.getTime())/1000; if(diff<60) return `${Math.floor(diff)}s ago`; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return then.toLocaleString(); }catch{ return iso } };
  const highlight=(txt)=> esc(txt).replace(/(^|\s)([@#][\w-]{2,})/g, (m,sp,tok)=> `${sp}<span class="tok">${tok}</span>`);

  const COLLECTORS = ["Sam Diaz","Priya Kumar","Lee Brown","Mina Park","Jordan Patel","Alex Morgan"];
  const STATUSES = ['Pending Contact','Contacted','Promised Payment','Overdue','Escalated','Paid'];
  const SLA_HOURS = 4;
  let currentId=null, tlFilter='All';

  let invoices = [];
  // Data loader: prefer MasterSource dataset; fallback to CSV
  (async function loadCsv(){
    try{
      let rows = [];
      let head = [];
      if(window.MasterSource && typeof window.MasterSource.getDataset==='function'){
        const ds = window.MasterSource.getDataset();
        head = (ds.headers||[]).map(h=> String(h).trim());
        rows = ds.rows || [];
      } else {
        const res = await fetch('sampledata.csv'); if(!res.ok) throw new Error('csv');
        const text = await res.text();
        const all = parseCSV(text);
        head = (all.shift()||[]).map(h=> String(h).trim());
        rows = all;
      }
      const col = Object.fromEntries(head.map((h,i)=>[h, i]));
      // Helper: resolve index by original name or alias
      const idxOf = (orig)=>{
        if(orig in col) return col[orig];
        try{
          const a = window.MasterSource?.getAliases?.().map?.[orig];
          const active = !!window.MasterSource?.getAliases?.().active;
          if(active && a){ const j=head.indexOf(a); if(j>=0) return j; }
        }catch{}
        return -1;
      };
      invoices = rows.slice(0,200).map(r=>({
        id: r[idxOf('AR Ref Nbr')] || r[0] || 'INV',
        account: r[idxOf('Customer Name')] || 'Customer',
        amount: Number(String(r[idxOf('Open Balance')]||r[idxOf('Amount')]||'0').replace(/[,\s]/g,''))||0,
        due: r[idxOf('Due Date')] || '',
        status: r[idxOf('Status')] || 'Pending Contact',
        assigned: r[idxOf('Sales Rep')] || COLLECTORS[Math.floor(Math.random()*COLLECTORS.length)],
        expected: r[idxOf('Date Payment Received')] || '',
        notes: [ {t:'System', k:`Imported from CSV (${r[idxOf('AR Doc Type')]||'Invoice'})`, ts: nowIso()} ]
      })).filter(inv=>inv.id && inv.account);
    }catch{
      // fallback demo data
      invoices = [
        {id:"INV-1001", account:"Ardent Robotics", amount:9200, due:"2025-08-20", status:"Pending Contact", assigned:"Sam Diaz", expected:"2025-09-09", notes:[{t:"System",k:"Invoice synced from ERP", ts:"2025-07-22 08:31"}]},
      ];
    }
    renderRows(); renderRollups(); renderFollowups(); if(invoices[0]) openDrawer(invoices[0].id);
  })();

  function parseCSV(str){
    const out=[]; let row=[]; let i=0; let cur=''; let q=false; while(i<str.length){ const ch=str[i]; if(q){ if(ch==='"' && str[i+1]==='"'){ cur+='"'; i+=2; continue; } if(ch==='"'){ q=false; i++; continue; } cur+=ch; i++; continue; } if(ch==='"'){ q=true; i++; continue; } if(ch===','){ row.push(cur); cur=''; i++; continue; } if(ch==='\r'){ i++; continue; } if(ch==='\n'){ row.push(cur); out.push(row); row=[]; cur=''; i++; continue; } cur+=ch; i++; } if(cur.length||row.length) { row.push(cur); out.push(row); } return out; }

  const rowsEl = $('#arRows');
  const pill = (status)=>{
    const cls = status==="Pending Contact"?"ar-s-pending":status==="Contacted"?"ar-s-contacted":status==="Promised Payment"?"ar-s-promised":status==="Overdue"?"ar-s-overdue":status==="Escalated"?"ar-s-escalated":"ar-s-paid";
    return `<span class="ar-pill ${cls}">${status}</span>`;
  };
  const slaRemaining=(inv)=>{ if(inv.status!=='Escalated') return null; const start=inv.escalatedAt?new Date(inv.escalatedAt):new Date(); const deadline = new Date(start.getTime()+SLA_HOURS*3600*1000); return deadline - new Date(); };
  const fmtDur=(ms)=>{ if(ms<=0) return 'BREACHED'; const s=Math.floor(ms/1000); const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); return `${h}h ${m}m`; };

  function renderRows(){
    const q = ($('#arSearch')?.value||'').toLowerCase();
    const f = $('#arFilter')?.value||'All Statuses';
    const list = invoices.filter(inv=>{
      const okF = (f==='All Statuses' || inv.status===f);
      const okQ = [inv.id,inv.account,inv.assigned,inv.status].join(' ').toLowerCase().includes(q);
      return okF && okQ;
    });
    rowsEl.innerHTML = list.map(inv=>{
      const sla = slaRemaining(inv);
      const initials = (inv.assigned||'').split(' ').map(p=>p[0]).join('').slice(0,2);
      return `<tr data-id="${inv.id}">
        <td>${inv.id}</td>
        <td>${esc(inv.account)}</td>
        <td>${money(inv.amount)}</td>
        <td>${inv.due||''}</td>
        <td>${pill(inv.status)}</td>
        <td>${inv.expected || '<span class="ar-evt-meta">—</span>'}</td>
        <td><span class="ar-ava" title="${esc(inv.assigned)}">${initials}</span> ${esc(inv.assigned)}</td>
        <td>${inv.status==='Escalated' ? `<span class="ar-sla">${fmtDur(sla)}</span>` : ''}</td>
      </tr>`;
    }).join('');
  }
  rowsEl?.addEventListener('click', e=>{ const tr=e.target.closest('tr'); if(tr){ openDrawer(tr.dataset.id); }});

  function computeRollups(){
    const buckets = {"Current":0,"1-30":0,"31-60":0,"61-90":0,">90":0};
    invoices.forEach(inv=>{
      if(inv.status!=="Paid"){
        const diff = daysBetween(new Date(), new Date(inv.due||new Date()));
        let b="Current"; if(diff>0) b="Current"; else if(diff>=-30) b="1-30"; else if(diff>=-60) b="31-60"; else if(diff>=-90) b="61-90"; else b=">90";
        buckets[b]+=Number(inv.amount)||0;
      }
    });
    return buckets;
  }
  function renderRollups(){ const b=computeRollups(); const host=$('#arRollups'); if(!host) return; host.innerHTML = `
    <div class="ar-tile"><h4>Current</h4><strong>${money(b["Current"])}</strong></div>
    <div class="ar-tile"><h4>1–30</h4><strong>${money(b["1-30"])}</strong></div>
    <div class="ar-tile"><h4>31–60</h4><strong>${money(b["31-60"])}</strong></div>
    <div class="ar-tile"><h4>61–90</h4><strong>${money(b["61-90"])}</strong></div>
    <div class="ar-tile"><h4>>90</h4><strong>${money(b[">90"])}</strong></div>`; }

  const simFollowBox = $('#arFollow');
  function renderFollowups(){
    if(!simFollowBox) return;
    const list = invoices.filter(inv => inv.expected && inv.status!=='Paid' && stripTime(new Date(inv.expected)) < stripTime(new Date()));
    if(!list.length){ simFollowBox.innerHTML = `<div class="ar-fitem"><span class="ar-evt-meta">No follow-ups needed right now</span></div>`; return; }
    simFollowBox.innerHTML = list.map(inv => {
      const initials = (inv.assigned||'').split(' ').map(p=>p[0]).join('').slice(0,2);
      return `<div class="ar-fitem">
        <div><strong>${esc(inv.account)}</strong> <span class="ar-tag" style="margin-left:6px">${inv.id}</span><div class="ar-evt-meta">Expected ${inv.expected}</div></div>
        <div>
          <button class="ar-btn" data-fu="call" data-id="${inv.id}">Call</button>
          <button class="ar-btn" data-fu="email" data-id="${inv.id}">Email</button>
          <button class="ar-btn primary" data-fu="log" data-id="${inv.id}">Log Follow-up</button>
        </div>
      </div>`; }).join('');
  }
  simFollowBox?.addEventListener('click', (e)=>{
    const id=e.target.dataset.id; const inv=invoices.find(i=>i.id===id); if(!inv) return;
    if(e.target.dataset.fu==='log'){ inv.notes=inv.notes||[]; inv.notes.push({t:'Follow-up', k:`Follow-up performed on expected ${inv.expected}`, ts:nowIso(), author: inv.assigned}); renderFollowups(); if(currentId===id) renderTimeline(inv); }
  });

  function openDrawer(id){
    const inv = invoices.find(i=>i.id===id); if(!inv) return; currentId=id;
    $('#dTitle').textContent = inv.account; $('#dId').textContent = inv.id; $('#dAmt').textContent = money(inv.amount); $('#dDue').textContent = inv.due||'';
    $('#dAssigned').innerHTML = COLLECTORS.map(n=>`<option ${n===inv.assigned?'selected':''}>${n}</option>`).join('');
    $('#dStatus').innerHTML   = STATUSES.map(s=>`<option ${s===inv.status?'selected':''}>${s}</option>`).join('');
    $('#dExpected').value     = inv.expected || '';
    $('#dEsc').checked        = inv.status==='Escalated';
    const badge = $('#dBadge'); badge.textContent = `Status: ${inv.status}`;
    const slaEl = $('#dSla'); const sla = slaRemaining(inv); if(inv.status==='Escalated'){ slaEl.style.display='inline-flex'; slaEl.textContent = fmtDur(sla); } else { slaEl.style.display='none'; slaEl.textContent=''; }
    renderTimeline(inv);
  }
  $('#dAssigned')?.addEventListener('change', e=>{ const inv=invoices.find(i=>i.id===currentId); if(inv){ inv.assigned=e.target.value; renderRows(); } });
  $('#dStatus')?.addEventListener('change', e=>{ const inv=invoices.find(i=>i.id===currentId); if(inv){ const prev=inv.status; inv.status=e.target.value; if(inv.status==='Escalated' && !inv.escalatedAt) inv.escalatedAt = nowIso(); if(inv.status==='Paid' && prev!=='Paid'){ inv.expected=''; inv.notes=inv.notes||[]; inv.notes.push({t:'System', k:'Marked as Paid', ts: nowIso(), author: inv.assigned}); } renderRows(); renderFollowups(); openDrawer(inv.id); } });
  $('#dExpected')?.addEventListener('change', e=>{ const inv=invoices.find(i=>i.id===currentId); if(inv){ inv.expected=e.target.value; renderRows(); renderFollowups(); } });
  $('#dEsc')?.addEventListener('change', e=>{ const inv=invoices.find(i=>i.id===currentId); if(inv){ inv.status = e.target.checked? 'Escalated':'Contacted'; if(e.target.checked) inv.escalatedAt = nowIso(); renderRows(); openDrawer(inv.id); } });

  document.addEventListener('keydown', (e)=>{
    const chip = e.target.closest('#ar-block .tag.add');
    if(!chip) return; if(e.key==='Enter'){ e.preventDefault(); const t=chip.textContent.trim(); if(!t) return; const span=document.createElement('span'); span.className='tag'; span.textContent=t; chip.before(span); chip.textContent=''; }
  });

  const seg = root.querySelector('.ar-seg');
  seg?.addEventListener('click', (e)=>{ const btn=e.target.closest('button[data-filter]'); if(!btn) return; seg.querySelector('.active')?.classList.remove('active'); btn.classList.add('active'); tlFilter=btn.dataset.filter; if(currentId){ const inv=invoices.find(i=>i.id===currentId); if(inv) renderTimeline(inv); } });
  function renderTimeline(inv){
    const wrap = $('#dTimeline'); const types = (tlFilter!=='All')?[tlFilter]:null; const byDay={};
    (inv.notes||[]).forEach(n=>{ if(types && !types.includes(n.t)) return; const day=(n.ts||'').slice(0,10); (byDay[day]=byDay[day]||[]).push(n); });
    const days = Object.keys(byDay).sort((a,b)=> a<b?1:-1);
    if(!days.length){ wrap.innerHTML = `<div class="ar-tag">No activity for this filter</div>`; return; }
    wrap.innerHTML = days.map(d=>{
      const pretty = new Date(d+"T00:00").toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'});
      const rows = byDay[d].map(n=>{
        const icon = n.t==='Call'?'📞': n.t==='Email'?'✉️': n.t==='Escalation'?'⚠️': n.t==='Follow-up'?'🔁':'📝';
        const who = n.author || (invoices.find(i=>i.id===currentId)?.assigned) || 'Collector';
        const initials = (who||'C').split(' ').map(p=>p[0]).join('').slice(0,2);
        const body = highlight(n.k||'');
        return `<div class="ar-evt">
          <div class="ar-glyph" aria-hidden="true">${icon}</div>
          <div class="ar-evtcard">
            <div class="ar-evt-top">
              <div class="ar-evt-meta"><span><span class="ar-ava" title="${esc(who)}">${initials}</span> ${esc(who)}</span><span>${relTime(n.ts||nowIso())}</span>${n.outcome?`<span class=\"ar-tag\">${esc(n.outcome)}</span>`:''}</div>
              ${n.flag?`<span class="ar-tag">${esc(n.flag)}</span>`:''}
            </div>
            <div class="ar-evt-body">${body.length>220 ? body.slice(0,220)+`<span class=\"more\" data-more>… More</span>` : body}</div>
          </div>
        </div>`; }).join('');
      return `<div class="ar-day">${pretty}</div>` + rows;
    }).join('');
    // Expand/Collapse
    wrap.querySelectorAll('[data-more]')?.forEach(m=> m.addEventListener('click', (e)=>{ const p=e.target.closest('.ar-evtcard').querySelector('.ar-evt-body'); const full=(inv.notes||[]).find(n=>highlight(n.k||'').startsWith(p.textContent.replace('… More','')))?.k || ''; p.innerHTML = highlight(full) + ' <span class="more" data-less>Show less</span>'; }));
    wrap.querySelectorAll('[data-less]')?.forEach(m=> m.addEventListener('click', ()=> renderTimeline(inv)));
  }

  const MAX=500; const ta=$('#noteText'); const ctr=$('#noteCount'); const addBtn = root.querySelector('#noteAdd');
  ta?.addEventListener('input', ()=>{ const v=ta.value; if(ctr) ctr.textContent = `${v.length} / ${MAX}`; if(v.length>MAX){ ta.value=v.slice(0,MAX); if(ctr) ctr.textContent = `${MAX} / ${MAX}`; } if(addBtn) addBtn.disabled = v.trim().length===0; });
  addBtn?.addEventListener('click', ()=> addNote());
  root.querySelectorAll('[data-type]')?.forEach(b=> b.addEventListener('click', ()=> addNote(b.dataset.type)) );
  ta?.addEventListener('keydown', e=>{ if((e.key==='Enter') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); addNote(); } });
  function addNote(kind){ const inv=invoices.find(i=>i.id===currentId); if(!inv) return; const txt=ta.value.trim(); if(!txt && !kind) return; inv.notes=inv.notes||[]; inv.notes.push({t: kind||'Note', k: txt || (kind+' logged'), ts: nowIso(), author: inv.assigned}); ta.value=''; ta.dispatchEvent(new Event('input')); renderTimeline(inv); renderFollowups(); showToast('Note added','success'); }

  root.querySelector('.ar-quick')?.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-set-exp]'); if(!b) return;
    const inv=invoices.find(i=>i.id===currentId); if(!inv) return; const k=b.getAttribute('data-set-exp'); const d=new Date(); if(k==='1d') d.setDate(d.getDate()+1); else if(k==='3d') d.setDate(d.getDate()+3); else if(k==='1w') d.setDate(d.getDate()+7); const iso=d.toISOString().slice(0,10); const inp=root.querySelector('#dExpected'); if(inp){ inp.value=iso; inv.expected=iso; renderFollowups(); renderRows(); showToast(`Expected set to ${iso}`,'success'); }
  });
}

// Mirror the dashboard search input with the topbar global search
function initSearchMirror(){
  const topSearch = document.getElementById('globalSearch');
  const panelSearch = document.getElementById('dashSearch');
  if(!topSearch || !panelSearch) return;
  let syncing = false;
  function mirror(from, to){
    if (syncing) return; syncing = true;
    if (to.value !== from.value) to.value = from.value;
    // Trigger top-level filtering on orders table when topSearch changes
    if (to === topSearch) { to.dispatchEvent(new Event('input')); }
    syncing = false;
  }
  topSearch.addEventListener('input', ()=> mirror(topSearch, panelSearch));
  panelSearch.addEventListener('input', ()=> mirror(panelSearch, topSearch));
}

// ----------------------------- Dashboard: Tasks -----------------------------
function initTasks(){
  const list = document.getElementById('tasksList');
  const input = document.getElementById('taskInput');
  if(!list || !input) return;

  const LS_KEY = 'dash.tasks.v1';
  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { tasks = []; }
  if (!tasks.length){
    tasks = [
      { text:'Review weekly KPIs dashboard', done:false },
      { text:'Approve invoices for ACME Co.', done:false },
      { text:'Prep Q3 forecast assumptions', done:false },
    ];
  }

  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(tasks)); }
  function render(){
    list.innerHTML = tasks.map((t, i)=>`
      <li class="panel" style="padding:10px; display:flex; align-items:center; justify-content:space-between; gap:8px">
        <label style="flex:1; display:flex; gap:8px; align-items:center">
          <input type="checkbox" data-idx="${i}" ${t.done?'checked':''}/>
          <span style="${t.done?'text-decoration:line-through; color:#8b8fab':''}">${t.text}</span>
        </label>
        <button class="icon-btn" title="Delete" data-del="${i}">🗑️</button>
      </li>`).join('');
  }
  render();

  list.addEventListener('change', (e)=>{
    const cb = e.target.closest('input[type="checkbox"][data-idx]');
    if(!cb) return;
    const idx = Number(cb.dataset.idx);
    if (tasks[idx]) { tasks[idx].done = cb.checked; save(); render(); }
  });

  list.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-del]');
    if(!del) return;
    const idx = Number(del.dataset.del);
    tasks.splice(idx,1); save(); render();
  });

  input.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter') return;
    const txt = input.value.trim();
    if(!txt) return;
    tasks.unshift({ text:txt, done:false });
    input.value = '';
    save(); render();
  });
}

// --------------------------- Dashboard: Messages ----------------------------
function initMessages(){
  const container = document.querySelector('[data-subtab-panel="dash-messages"]');
  if(!container) return;

  const samples = {
    gmail: [
      { from:'billing@vendor.com', subject:'Invoice #883 payment received', time:'9:12a' },
      { from:'ceo@startup.xyz', subject:'Q3 planning deck', time:'8:04a' },
    ],
    gchat: [
      { from:'Ops Team', subject:'ETL job retry succeeded', time:'Tue' },
      { from:'Fin-Chat', subject:'AR aging review at 3pm', time:'Mon' },
    ],
    slack: [
      { from:'#alerts', subject:'Risk monitor: 4 high accounts', time:'10:03a' },
      { from:'@megs', subject:'Draft on receivables dashboard', time:'Yesterday' },
    ],
  };

  function lsKey(svc){ return `conn.${svc}.v1`; }
  function isConnected(svc){ return localStorage.getItem(lsKey(svc)) === 'true'; }
  function connect(svc){ localStorage.setItem(lsKey(svc), 'true'); }

  function renderService(svc){
    const panel = container.querySelector(`[data-service="${svc}"] .service-content`);
    if(!panel) return;
    if(!isConnected(svc)){
      panel.innerHTML = `
        <p class="muted">Connect your ${svc==='gchat'?'Google Chat':(svc==='gcal'?'Google Calendar':svc)} to view data.</p>
        <button class="icon-btn" data-connect="${svc}">Connect</button>`;
      return;
    }
    const data = samples[svc] || [];
    if (!data.length){ panel.innerHTML = '<p class="muted">No data.</p>'; return; }
    panel.innerHTML = `
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:8px">
        ${data.map(d=>`<li class="panel" style="padding:10px"><strong>${d.from}</strong><br/><span class="muted">${d.subject}</span> <span style="float:right" class="muted">${d.time}</span></li>`).join('')}
      </ul>`;
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-connect]');
    if(!btn) return;
    const svc = btn.dataset.connect;
    if(['gmail','gchat','slack'].includes(svc)){
      connect(svc);
      renderService(svc);
    }
  });

  ['gmail','gchat','slack'].forEach(renderService);
}

// --------------------------- Dashboard: Calendar ----------------------------
function initCalendar(){
  const list = document.getElementById('calendarList');
  const connectBox = document.getElementById('calendarConnect');
  if(!list || !connectBox) return;

  const KEY = 'conn.gcal.v1';
  const connected = localStorage.getItem(KEY) === 'true';
  if(connected){ connectBox.style.display = 'none'; render(); }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-connect="gcal"]');
    if(!btn) return;
    localStorage.setItem(KEY, 'true');
    connectBox.style.display = 'none';
    render();
  });

  function render(){
    const events = [
      { when:'Today 10:00', title:'AR standup' },
      { when:'Today 15:00', title:'Aging review' },
      { when:'Tomorrow 09:00', title:'Vendor sync' },
    ];
    list.innerHTML = events.map(e=>`<li class="panel" style="padding:10px"><strong>${e.when}</strong> – ${e.title}</li>`).join('');
  }
}

// --------------------------- Dashboard: Reports -----------------------------
function initReports(){
  const list = document.getElementById('reportsList');
  const input = document.getElementById('reportName');
  const create = document.getElementById('createReportBtn');
  if(!list || !input || !create) return;

  const KEY = 'dash.reports.v1';
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { reports = []; }
  if(!reports.length){ reports = [ { name:'Monthly AR Summary' }, { name:'Top Debtors' } ]; }

  function save(){ localStorage.setItem(KEY, JSON.stringify(reports)); }
  function render(){
    list.innerHTML = reports.map((r,i)=>`
      <li class="panel" style="padding:10px; display:flex; align-items:center; justify-content:space-between">
        <span>${r.name}</span>
        <button class="icon-btn" data-rep-del="${i}">🗑️</button>
      </li>`).join('');
  }
  render();

  create.addEventListener('click', ()=>{
    const name = input.value.trim();
    if(!name) return;
    reports.unshift({ name }); input.value=''; save(); render();
  });
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ create.click(); }});
  list.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-rep-del]');
    if(!del) return;
    const idx = Number(del.dataset.repDel);
    reports.splice(idx,1); save(); render();
  });
}

// --------------------- Dashboard: Aggregated Global Search ------------------
function initAggregatedSearch(){
  const results = document.getElementById('dashSearchResults');
  const topSearch = document.getElementById('globalSearch');
  const panelSearch = document.getElementById('dashSearch');
  if(!results || !topSearch || !panelSearch) return;

  function render(){
    const q = (topSearch.value || '').trim().toLowerCase();
    if(!q){ results.innerHTML = '<p class="muted">Start typing to search orders and debtors.</p>'; return; }

    const orderMatches = ORDERS.filter(o => [o.id,o.name,o.status,o.date,String(o.amount)].some(v=>String(v).toLowerCase().includes(q)));
    const debtorMatches = DEBTORS.filter(d => [d.name,d.bucket,d.risk,String(d.amount)].some(v=>String(v).toLowerCase().includes(q)));

    const orderHtml = orderMatches.length ? `
      <div class="panel" style="padding:10px"><strong>Orders</strong>
        <ul style="list-style:none; padding:0; margin:8px 0 0; display:grid; gap:6px">
          ${orderMatches.slice(0,5).map(o=>`<li>#${o.id} — ${o.name} — $${o.amount.toFixed(2)} <span class="muted">(${o.date})</span></li>`).join('')}
        </ul>
      </div>` : '';
    const debtorHtml = debtorMatches.length ? `
      <div class="panel" style="padding:10px"><strong>Debtors</strong>
        <ul style="list-style:none; padding:0; margin:8px 0 0; display:grid; gap:6px">
          ${debtorMatches.slice(0,5).map(d=>`<li>${d.name} — $${d.amount.toLocaleString()} <span class="muted">(${d.bucket}, ${d.risk})</span></li>`).join('')}
        </ul>
      </div>` : '';

    results.innerHTML = (orderHtml + debtorHtml) || '<p class="muted">No results found.</p>';
  }

  topSearch.addEventListener('input', render);
  panelSearch.addEventListener('input', render);
}

// Generic renderer used by other section search panels
function renderAggregatedInto(resultsEl, query, scope){
  const q = (query || '').trim().toLowerCase();
  if(!q){ resultsEl.innerHTML = '<p class="muted">Start typing to search.</p>'; return; }
  const showOrders = scope==='all';
  const showDebtors = scope==='all' || scope==='receivables';
  let html = '';
  if (showOrders){
    const orderMatches = ORDERS.filter(o => [o.id,o.name,o.status,o.date,String(o.amount)].some(v=>String(v).toLowerCase().includes(q)));
    if(orderMatches.length){
      html += `<div class="panel" style="padding:10px"><strong>Orders</strong>
        <ul style="list-style:none; padding:0; margin:8px 0 0; display:grid; gap:6px">
          ${orderMatches.slice(0,5).map(o=>`<li>${o.id} — ${o.name} — $${o.amount.toFixed(2)} <span class=\"muted\">(${o.date})</span></li>`).join('')}
        </ul></div>`;
    }
  }
  if (showDebtors){
    const debtorMatches = DEBTORS.filter(d => [d.name,d.bucket,d.risk,String(d.amount)].some(v=>String(v).toLowerCase().includes(q)));
    if(debtorMatches.length){
      html += `<div class="panel" style="padding:10px"><strong>Debtors</strong>
        <ul style="list-style:none; padding:0; margin:8px 0 0; display:grid; gap:6px">
          ${debtorMatches.slice(0,5).map(d=>`<li>${d.name} — $${d.amount.toLocaleString()} <span class=\"muted\">(${d.bucket}, ${d.risk})</span></li>`).join('')}
        </ul></div>`;
    }
  }
  resultsEl.innerHTML = html || '<p class="muted">No results found.</p>';
}

function initReceivablesSearch(){
  const input = document.getElementById('recvSearch');
  const results = document.getElementById('recvSearchResults');
  const topSearch = document.getElementById('globalSearch');
  if(!input || !results || !topSearch) return;
  const sync = ()=> renderAggregatedInto(results, input.value || topSearch.value, 'receivables');
  input.addEventListener('input', sync);
  topSearch.addEventListener('input', sync);
}

function initPayablesSearch(){
  const input = document.getElementById('paySearch');
  const results = document.getElementById('paySearchResults');
  const topSearch = document.getElementById('globalSearch');
  if(!input || !results || !topSearch) return;
  const sync = ()=> renderAggregatedInto(results, input.value || topSearch.value, 'payables');
  input.addEventListener('input', sync);
  topSearch.addEventListener('input', sync);
}

function initCashflowSearch(){
  const input = document.getElementById('cfSearch');
  const results = document.getElementById('cfSearchResults');
  const topSearch = document.getElementById('globalSearch');
  if(!input || !results || !topSearch) return;
  const sync = ()=> renderAggregatedInto(results, input.value || topSearch.value, 'cashflow');
  input.addEventListener('input', sync);
  topSearch.addEventListener('input', sync);
}

// ------------------------------- Admin Pages -------------------------------
function initAdmin(){
  // Elements across Admin pages
  const exists = document.querySelector('[aria-label="Admin subtabs"]');
  if(!exists) return;

  // Storage keys
  const K = {
    general: 'admin.general.v1',
    roles: 'admin.roles.v1',
    users: 'admin.users.v1',
    flags: 'admin.flags.v1',
    audit: 'admin.audit.v1',
    notify: 'admin.notify.v1',
    templates: 'admin.templates.v1',
    validation: 'admin.validation.v1',
    currentRole: 'admin.currentRoleId.v1'
  };

  // Local HTML escaper for safe UI injection
  const adminEscape = (str) => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));

  // Defaults
  let general = { appName: 'Startup XYZ', logoUrl: '', theme: 'glass', timezone: 'UTC' };
  let roles = [
    { name:'Admin', desc:'Full access', perms:{ manageUsers:true, manageBilling:true, viewReports:true, manageConfigs:true }, users: 2 },
    { name:'Manager', desc:'Team operations', perms:{ manageUsers:false, manageBilling:true, viewReports:true, manageConfigs:false }, users: 6 },
    { name:'Viewer', desc:'Read only', perms:{ manageUsers:false, manageBilling:false, viewReports:true, manageConfigs:false }, users: 14 },
  ];
  let users = [];
  let flags = [
    { key:'betaDashboard', label:'Beta dashboard', enabled:true },
    { key:'advancedReporting', label:'Advanced reporting', enabled:false },
    { key:'collectionsTimeline', label:'Collections Timeline', enabled:true }
  ];
  let audit = [];
  let notify = [
    { id:'n_'+Math.random().toString(36).slice(2,9), event:'invoice.past_due', channel:'email', recipients:'finance@company.com', condition:'amount>1000', throttle:'1/day', active:true },
  ];
  let templates = [
    { id:'t_invoice_due', key:'invoice_due', subject:'Invoice {{invoice}} due', body:'Hello {{name}},\nInvoice {{invoice}} for {{amount}} is due on {{due_date}}.' },
  ];
  let validation = [
    { field:'email', required:true, type:'email', pattern:'', def:'' },
    { field:'amount', required:true, type:'number', pattern:'', def:'0' },
    { field:'due_date', required:true, type:'date', pattern:'', def:'' },
  ];

  // Load persisted
  try { general = Object.assign(general, JSON.parse(localStorage.getItem(K.general)||'{}')||{}); } catch {}
  try { const rs = JSON.parse(localStorage.getItem(K.roles)||'null'); if(Array.isArray(rs)) roles = rs; } catch {}
  try { const us = JSON.parse(localStorage.getItem(K.users)||'null'); if(Array.isArray(us)) users = us; } catch {}
  try { const fs = JSON.parse(localStorage.getItem(K.flags)||'null'); if(Array.isArray(fs)) flags = fs; } catch {}
  try { const au = JSON.parse(localStorage.getItem(K.audit)||'null'); if(Array.isArray(au)) audit = au; } catch {}
  try { const no = JSON.parse(localStorage.getItem(K.notify)||'null'); if(Array.isArray(no)) notify = no; } catch {}
  try { const tp = JSON.parse(localStorage.getItem(K.templates)||'null'); if(Array.isArray(tp)) templates = tp; } catch {}
  try { const vd = JSON.parse(localStorage.getItem(K.validation)||'null'); if(Array.isArray(vd)) validation = vd; } catch {}

  // Ensure role ids exist (migration for older data)
  let changedIds = false;
  roles.forEach(r=>{ if(!r.id){ r.id = 'role_' + Math.random().toString(36).slice(2,10); changedIds = true; } });
  if (changedIds) { try{ localStorage.setItem(K.roles, JSON.stringify(roles)); }catch{} }
  // Seed users if empty
  if (!users.length){
    const findByName = (n)=> roles.find(r=>r.name===n)?.id || roles[0]?.id;
    users = [
      { id: 'u_'+Math.random().toString(36).slice(2,9), name:'Leslie Knope', email:'leslie@example.com', roleId: findByName('Admin'), active:true },
      { id: 'u_'+Math.random().toString(36).slice(2,9), name:'Alex Doe', email:'alex@example.com', roleId: findByName('Manager'), active:true },
      { id: 'u_'+Math.random().toString(36).slice(2,9), name:'Taylor Ray', email:'taylor@example.com', roleId: findByName('Viewer'), active:true }
    ];
  }

  function save(){
    try{ localStorage.setItem(K.general, JSON.stringify(general)); }catch{}
    try{ localStorage.setItem(K.roles, JSON.stringify(roles)); }catch{}
    try{ localStorage.setItem(K.users, JSON.stringify(users)); }catch{}
    try{ localStorage.setItem(K.flags, JSON.stringify(flags)); }catch{}
    try{ localStorage.setItem(K.audit, JSON.stringify(audit)); }catch{}
    try{ localStorage.setItem(K.notify, JSON.stringify(notify)); }catch{}
    try{ localStorage.setItem(K.templates, JSON.stringify(templates)); }catch{}
    try{ localStorage.setItem(K.validation, JSON.stringify(validation)); }catch{}
  }

  // Overview wiring
  (function wireOverview(){
    const appName = document.getElementById('adminAppNameOv');
    const tz = document.getElementById('adminTzOv');
    const flagsWrap = document.getElementById('adminFlagsOv');
    const roleSel = document.getElementById('adminCurrentRole');
    if(appName) appName.value = general.appName || '';
    if(tz) tz.value = general.timezone || 'UTC';
    if (roleSel){
      roleSel.innerHTML = roles.map(r=>`<option value="${r.id}">${adminEscape(r.name)}</option>`).join('');
      const savedRole = localStorage.getItem(K.currentRole) || roles[0]?.id || '';
      roleSel.value = savedRole;
      roleSel.addEventListener('change', ()=>{ localStorage.setItem(K.currentRole, roleSel.value); try{ applySecurityGates(); }catch{} });
    }
    if(flagsWrap){
      flagsWrap.innerHTML = flags.map((f,i)=>`
        <label style="display:flex; align-items:center; gap:8px">
          <input type="checkbox" data-flag-idx="${i}" ${f.enabled?'checked':''}/>
          <span>${adminEscape(f.label||f.key)}</span>
        </label>`).join('');
      flagsWrap.addEventListener('change', (e)=>{
        const cb = e.target.closest('[data-flag-idx]');
        if(!cb) return;
        const i = Number(cb.getAttribute('data-flag-idx'));
        if(flags[i]){ flags[i].enabled = cb.checked; save(); try{ applySecurityGates(); }catch{} }
      });
    }
  })();

  // Notifications manager
  (function wireNotify(){
    const table = document.getElementById('adminNotifyTable');
    const addBtn = document.getElementById('adminNotifyAdd');
    const expBtn = document.getElementById('adminNotifyExport');
    const impBtn = document.getElementById('adminNotifyImport');
    if(!table || !addBtn) return;
    function validateRecipient(token, channel){
      const s = token.trim(); if(!s) return true;
      if(channel==='email') return /.+@.+\..+/.test(s);
      if(channel==='sms') return /^[+]?[\d\s().-]{7,}$/.test(s);
      if(channel==='slack' || channel==='gchat') return s.startsWith('@') || s.startsWith('#');
      return true;
    }
    function validateRow(i){
      const rec = table.querySelector(`input[data-n-rec="${i}"]`);
      const ch = table.querySelector(`select[data-n-ch="${i}"]`);
      if(!rec || !ch) return;
      const list = (rec.value||'').split(',').map(s=>s.trim()).filter(Boolean);
      const invalid = list.filter(t=>!validateRecipient(t, ch.value));
      if(invalid.length){ rec.style.borderColor = '#cc3a3a'; rec.title = `Invalid: ${invalid.join(', ')}`; }
      else { rec.style.borderColor = ''; rec.title = ''; }
    }
    function render(){
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = notify.map((r,i)=>`<tr>
        <td><input data-n-ev="${i}" placeholder="invoice.past_due" value="${adminEscape(r.event)}"/></td>
        <td>
          <select data-n-ch="${i}">
            ${['email','slack','gchat','sms'].map(c=>`<option value="${c}" ${r.channel===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </td>
        <td><input data-n-rec="${i}" placeholder="a@b.com, #ops" value="${adminEscape(r.recipients||'')}"/></td>
        <td><input data-n-cond="${i}" placeholder="amount>1000" value="${adminEscape(r.condition||'')}"/></td>
        <td><input data-n-th="${i}" placeholder="1/day" value="${adminEscape(r.throttle||'')}"/></td>
        <td style="text-align:center"><input type="checkbox" data-n-act="${i}" ${r.active?'checked':''}></td>
        <td><button class="mini-btn" data-n-del="${i}">Delete</button></td>
      </tr>`).join('');
      notify.forEach((_,i)=> validateRow(i));
    }
    render();
    addBtn.addEventListener('click', ()=>{ notify.push({ id:'n_'+Math.random().toString(36).slice(2,9), event:'custom.event', channel:'email', recipients:'', condition:'', throttle:'', active:true }); save(); render(); addAudit('system','create','notify'); });
    table.addEventListener('input', (e)=>{
      const ev=e.target.getAttribute('data-n-ev'); if(ev!=null){ notify[+ev].event=e.target.value; save(); return; }
      const rc=e.target.getAttribute('data-n-rec'); if(rc!=null){ notify[+rc].recipients=e.target.value; save(); validateRow(+rc); return; }
      const cd=e.target.getAttribute('data-n-cond'); if(cd!=null){ notify[+cd].condition=e.target.value; save(); return; }
      const th=e.target.getAttribute('data-n-th'); if(th!=null){ notify[+th].throttle=e.target.value; save(); return; }
    });
    table.addEventListener('change', (e)=>{
      const ch=e.target.getAttribute('data-n-ch'); if(ch!=null){ notify[+ch].channel=e.target.value; save(); validateRow(+ch); return; }
      const ac=e.target.getAttribute('data-n-act'); if(ac!=null){ notify[+ac].active=e.target.checked; save(); return; }
    });
    table.addEventListener('click', (e)=>{
      const del=e.target.closest('[data-n-del]'); if(!del) return; const i=+del.getAttribute('data-n-del'); notify.splice(i,1); save(); render(); addAudit('system','delete','notify');
    });
    expBtn?.addEventListener('click', ()=>{ const data=JSON.stringify(notify,null,2); navigator.clipboard?.writeText(data).catch(()=>{}); const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); downloadJSON(data, `notifications-${ts}.json`); showToast('Notification rules exported', 'success'); });
    impBtn?.addEventListener('click', async ()=>{ const json = prompt('Paste JSON notification rules'); if(!json) return; try{ const arr=JSON.parse(json); if(Array.isArray(arr)){ notify=arr; save(); render(); showToast('Notification rules imported','success'); } else { showToast('Invalid JSON','error'); } }catch(e){ showToast('Invalid JSON','error'); } });

    // Simulation wiring
    const simEvent = document.getElementById('adminNotifySimEvent');
    const simPayload = document.getElementById('adminNotifySimPayload');
    const simRun = document.getElementById('adminNotifySimRun');
    const simOut = document.getElementById('adminNotifySimResult');
    function get(obj, path){ return path.split('.').reduce((v,k)=> (v && k in v) ? v[k] : undefined, obj); }
    function parseValue(raw){ const s=String(raw).trim(); if((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'"))) return s.slice(1,-1); const n=Number(s); return isNaN(n)? s : n; }
    function evalCond(cond, data){
      if(!cond || !String(cond).trim()) return true;
      const m = String(cond).match(/^\s*([a-zA-Z_][\w\.\[\]]*)\s*(==|!=|>=|<=|>|<|contains)\s*(.+)\s*$/);
      if(!m) return false;
      const field=m[1], op=m[2], rhsRaw=m[3];
      const lhs = get(data, field);
      const rhs = parseValue(rhsRaw);
      switch(op){
        case '==': return lhs == rhs; // eslint-disable-line eqeqeq
        case '!=': return lhs != rhs; // eslint-disable-line eqeqeq
        case '>': return Number(lhs) > Number(rhs);
        case '<': return Number(lhs) < Number(rhs);
        case '>=': return Number(lhs) >= Number(rhs);
        case '<=': return Number(lhs) <= Number(rhs);
        case 'contains': return String(lhs||'').includes(String(rhs));
        default: return false;
      }
    }
    function runSim(){
      if(!simEvent || !simPayload || !simOut) return;
      let data={};
      try{ data = JSON.parse(simPayload.value || '{}'); }catch{ simOut.textContent = 'Invalid JSON'; return; }
      const evk = (simEvent.value||'').trim();
      const rows = notify.map((r,i)=>{
        if(!r.active) return { i, status:'skip', reason:'inactive' };
        if((r.event||'').trim() !== evk) return { i, status:'skip', reason:'event mismatch' };
        const ok = evalCond(r.condition||'', data);
        return ok ? { i, status:'trigger' } : { i, status:'skip', reason:'condition false' };
      });
      const html = `<ul class="mini-list">${rows.map(o=>`<li>${o.status==='trigger'?'✅':'⏭️'} Rule ${o.i+1} — ${o.status}${o.reason?` (${o.reason})`:''}</li>`).join('')}</ul>`;
      simOut.innerHTML = html;
    }
    simRun?.addEventListener('click', runSim);

    // Expose render for bundle import
    window._renderAdminNotify = render;
  })();

  // Templates manager
  (function wireTemplates(){
    const sel = document.getElementById('adminTplSelect');
    const k = document.getElementById('adminTplKey');
    const s = document.getElementById('adminTplSubject');
    const b = document.getElementById('adminTplBody');
    const prev = document.getElementById('adminTplPreview');
    const ch = document.getElementById('adminTplChannel');
    const addBtn = document.getElementById('adminTplAdd');
    const saveBtn = document.getElementById('adminTplSave');
    const expBtn = document.getElementById('adminTplExport');
    const impBtn = document.getElementById('adminTplImport');
    if(!sel || !k || !s || !b || !prev || !ch) return;
    // Migrate legacy records
    templates.forEach(t=>{ if(!t.variants){ t.variants = { email: { subject: t.subject||'Subject', body: t.body||'' } }; delete t.subject; delete t.body; } });
    function refreshSel(){ sel.innerHTML = templates.map(t=>`<option value="${t.id}">${adminEscape(t.key)}</option>`).join(''); }
    function current(){ return templates.find(t=>t.id===sel.value); }
    function ensureVariant(t, channel){ t.variants = t.variants||{}; t.variants[channel] = t.variants[channel] || (channel==='email'?{subject:'Subject', body:''}:{body:''}); }
    function render(){ const t=current(); if(!t) return; const channel = ch.value; ensureVariant(t, channel); k.value=t.key; const v=t.variants[channel]; s.value = (channel==='email'?(v.subject||''):''); b.value=v.body||''; s.parentElement.style.display = (channel==='email'?'grid':'none'); renderPreview(); }
    function renderPreview(){ const demo={ name:'Megs', invoice:'#123', amount:'$1,200', due_date:'2025-09-01' }; const channel = ch.value; const subj = channel==='email'? replaceTpl(s.value,demo) : ''; const body = replaceTpl(b.value,demo).replace(/\n/g,'<br/>'); prev.innerHTML = channel==='email' ? `<strong>${subj}</strong><br/>${body}` : `<div style="font-family:ui-monospace,Menlo,Consolas">${body}</div>`; }
    function replaceTpl(str, data){ return String(str).replace(/\{\{(.*?)\}\}/g, (_,k)=> adminEscape(data[k.trim()]||'')); }
    refreshSel(); if(!sel.value && templates[0]) sel.value = templates[0].id; ch.value = 'email'; render();
    sel.addEventListener('change', render);
    [k,s,b,ch].forEach(el=> el.addEventListener('input', renderPreview));
    ch.addEventListener('change', render);
    addBtn?.addEventListener('click', ()=>{ const id='t_'+Math.random().toString(36).slice(2,9); templates.push({ id, key:'new_template', variants:{ email:{ subject:'Subject', body:'Body' } } }); save(); refreshSel(); sel.value=id; ch.value='email'; render(); addAudit('system','create','template'); });
    saveBtn?.addEventListener('click', ()=>{ const t=current(); if(!t) return; const channel=ch.value; ensureVariant(t, channel); t.key=k.value.trim()||'template'; if(channel==='email'){ t.variants.email.subject = s.value; t.variants.email.body = b.value; } else { t.variants[channel].body = b.value; } save(); alert('Template saved'); addAudit('system','update','template'); });
    expBtn?.addEventListener('click', ()=>{ const data=JSON.stringify(templates,null,2); navigator.clipboard?.writeText(data).catch(()=>{}); const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); downloadJSON(data, `templates-${ts}.json`); showToast('Templates exported','success'); });
    impBtn?.addEventListener('click', ()=>{ const json=prompt('Paste JSON templates'); if(!json) return; try{ let arr=JSON.parse(json); if(Array.isArray(arr)){ arr = arr.map(t=>{ if(!t.variants){ t.variants={ email:{ subject:t.subject||'Subject', body:t.body||'' } }; delete t.subject; delete t.body; } return t; }); templates=arr; save(); refreshSel(); if(templates[0]){ sel.value=templates[0].id; ch.value='email'; render(); } showToast('Templates imported','success'); } else { showToast('Invalid JSON','error'); } }catch{ showToast('Invalid JSON','error'); } });
    window._renderAdminTemplates = ()=>{ refreshSel(); render(); };
  })();

  // Validation & defaults
  (function wireValidation(){
    const table = document.getElementById('adminValTable');
    const reset = document.getElementById('adminValReset');
    if(!table) return;
    function render(){
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = validation.map((v,i)=>`<tr>
        <td><input data-v-f="${i}" value="${adminEscape(v.field)}"/></td>
        <td style="text-align:center"><input type="checkbox" data-v-req="${i}" ${v.required?'checked':''}></td>
        <td>
          <select data-v-type="${i}">
            ${['string','number','email','date'].map(t=>`<option value="${t}" ${v.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </td>
        <td><input data-v-pat="${i}" placeholder="^\\d+$" value="${adminEscape(v.pattern||'')}"/></td>
        <td><input data-v-def="${i}" value="${adminEscape(v.def||'')}"/></td>
        <td><input data-v-sample="${i}" placeholder="Try a value"/></td>
        <td><span data-v-result="${i}" class="muted">—</span></td>
        <td><button class="mini-btn" data-v-del="${i}">Delete</button></td>
      </tr>`).join('');
      validation.forEach((_,i)=> evalRow(i));
    }
    function evalRow(i){
      const v = validation[i]; if(!v) return;
      const sampleEl = table.querySelector(`[data-v-sample="${i}"]`);
      const resEl = table.querySelector(`[data-v-result="${i}"]`);
      if(!sampleEl || !resEl) return;
      const val = sampleEl.value || '';
      let ok = true; let msg = 'OK';
      if(v.required && !val){ ok=false; msg='Required'; }
      if(ok){
        switch(v.type){
          case 'number': ok = !isNaN(Number(val)); msg = ok?msg:'Not a number'; break;
          case 'email': ok = /.+@.+\..+/.test(val); msg = ok?msg:'Invalid email'; break;
          case 'date': ok = !isNaN(Date.parse(val)); msg = ok?msg:'Invalid date'; break;
          default: ok = true;
        }
      }
      if(ok && v.pattern){
        try{ const re = new RegExp(v.pattern); ok = re.test(val); msg = ok?msg:'Pattern mismatch'; }
        catch(e){ ok=false; msg='Invalid pattern'; }
      }
      resEl.textContent = ok ? '✓ Pass' : `✕ ${msg}`;
      resEl.style.color = ok ? '#16a34a' : '#b42323';
    }
    render();
    window._renderAdminValidation = render;
    table.addEventListener('input', (e)=>{
      const f=e.target.getAttribute('data-v-f'); if(f!=null){ validation[+f].field=e.target.value; save(); return; }
      const p=e.target.getAttribute('data-v-pat'); if(p!=null){ validation[+p].pattern=e.target.value; save(); evalRow(+p); return; }
      const d=e.target.getAttribute('data-v-def'); if(d!=null){ validation[+d].def=e.target.value; save(); return; }
      const s=e.target.getAttribute('data-v-sample'); if(s!=null){ evalRow(+s); return; }
    });
    table.addEventListener('change', (e)=>{
      const t=e.target.getAttribute('data-v-type'); if(t!=null){ validation[+t].type=e.target.value; save(); evalRow(+t); return; }
      const r=e.target.getAttribute('data-v-req'); if(r!=null){ validation[+r].required=e.target.checked; save(); evalRow(+r); return; }
    });
    table.addEventListener('click', (e)=>{ const del=e.target.closest('[data-v-del]'); if(!del) return; const i=+del.getAttribute('data-v-del'); validation.splice(i,1); save(); render(); });
    reset?.addEventListener('click', ()=>{ if(confirm('Reset validation rules to defaults?')){ validation = [ { field:'email', required:true, type:'email', pattern:'', def:'' }, { field:'amount', required:true, type:'number', pattern:'', def:'0' }, { field:'due_date', required:true, type:'date', pattern:'', def:'' } ]; save(); render(); showToast('Validation rules reset','success'); }});
  })();

  // Bundle import/export (Admin Overview)
  (function wireBundles(){
    const exp = document.getElementById('adminBundleExport');
    const imp = document.getElementById('adminBundleImport');
    function exportBundle(){
      const bundle = { general, roles, users, flags, notify, templates, validation, currentRole: localStorage.getItem(K.currentRole)||'' };
      const json = JSON.stringify(bundle, null, 2);
      navigator.clipboard?.writeText(json).catch(()=>{});
      const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); downloadJSON(json, `bundle-${ts}.json`);
      showToast('Bundle exported','success');
    }
    function importBundle(){
      const json = prompt('Paste bundle JSON'); if(!json) return;
      try{
        const b = JSON.parse(json);
        if(b.general) general = b.general;
        if(Array.isArray(b.roles)) roles = b.roles;
        if(Array.isArray(b.users)) users = b.users;
        if(Array.isArray(b.flags)) flags = b.flags;
        if(Array.isArray(b.notify)) notify = b.notify;
        if(Array.isArray(b.templates)) templates = b.templates;
        if(Array.isArray(b.validation)) validation = b.validation;
        if(b.currentRole) localStorage.setItem(K.currentRole, b.currentRole);
        save();
        try{ window._renderAdminRoles?.(); window._renderAdminUsers?.(); window._renderAdminNotify?.(); window._renderAdminTemplates?.(); window._renderAdminValidation?.(); applySecurityGates(); }catch{}
        showToast('Bundle imported','success');
      }catch{ showToast('Invalid JSON','error'); }
    }
    exp?.addEventListener('click', exportBundle);
    imp?.addEventListener('click', importBundle);
  })();
  // General form
  (function wireGeneral(){
    const appName = document.getElementById('adminAppName');
    const logo = document.getElementById('adminLogoUrl');
    const theme = document.getElementById('adminTheme');
    const tz = document.getElementById('adminTimezone');
    const scale = document.getElementById('adminUiScale');
    const scaleVal = document.getElementById('adminUiScaleVal');
    const saveBtn = document.getElementById('adminGeneralSave');
    if(!appName || !theme || !tz || !saveBtn) return;
    appName.value = general.appName || '';
    logo && (logo.value = general.logoUrl || '');
    theme.value = general.theme || 'glass';
    tz.value = general.timezone || 'UTC';
    // UI scale slider removed: lock to 100% and disable control if present
    if(scale){ scale.value = 1.0; scale.disabled = true; }
    if(scaleVal){ scaleVal.textContent = '100%'; }
    saveBtn.addEventListener('click', ()=>{
      general.appName = appName.value.trim() || 'App';
      general.logoUrl = logo ? (logo.value||'') : '';
      general.theme = theme.value || 'glass';
      general.timezone = tz.value || 'UTC';
      save();
      // Apply look immediately
      try{ document.body.setAttribute('data-look', general.theme); }catch{}
      // Manual UI scale removed; keep base at 100%
      try{ document.documentElement.style.setProperty('--ui-scale', '1'); }catch{}
      // Sidebar brand text
      const brand = document.querySelector('.sidebar .brand span');
      if(brand) brand.textContent = general.appName || 'App';
      addAudit('system','update','general');
    });
  })();

  // Roles table
  (function wireRoles(){
    const table = document.getElementById('adminRolesTable');
    const addBtn = document.getElementById('adminRoleAdd');
    if(!table || !addBtn) return;
    function render(){
      const tbody = table.querySelector('tbody');
      // compute user counts by roleId
      const counts = (function(){ const m={}; try{ (JSON.parse(localStorage.getItem('admin.users.v1')||'[]')||[]).forEach(u=>{ m[u.roleId]=(m[u.roleId]||0)+1; }); }catch{} return m; })();
      tbody.innerHTML = roles.map((r,i)=>`
        <tr>
          <td><input data-r-n="${i}" value="${adminEscape(r.name)}"/></td>
          <td><input data-r-d="${i}" value="${adminEscape(r.desc||'')}"/></td>
          <td>${counts[r.id]||0}</td>
          <td><button class="mini-btn" data-r-del="${i}">Delete</button></td>
        </tr>`).join('');
    }
    render();
    // Expose for other admin modules to request refresh
    window._renderAdminRoles = render;
    addBtn.addEventListener('click', ()=>{
      roles.push({ id:'role_'+Math.random().toString(36).slice(2,10), name:'New Role', desc:'', perms:{ manageUsers:false, manageBilling:false, viewReports:false, manageConfigs:false } });
      save(); render(); addAudit('system','create','role');
    });
    table.addEventListener('input', (e)=>{
      const n = e.target.getAttribute('data-r-n');
      const d = e.target.getAttribute('data-r-d');
      if(n != null){ roles[Number(n)].name = e.target.value; save(); window._renderAdminUsers?.(); }
      if(d != null){ roles[Number(d)].desc = e.target.value; save(); }
    });
    table.addEventListener('click', (e)=>{
      const del = e.target.closest('[data-r-del]');
      if(!del) return;
      const i = Number(del.getAttribute('data-r-del'));
      const removed = roles.splice(i,1)[0];
      // Reassign users of removed role to first available role
      if (removed && removed.id && roles[0]){
        const fallback = roles[0].id;
        users.forEach(u=>{ if(u.roleId===removed.id) u.roleId = fallback; });
      }
      save(); render(); addAudit('system','delete','role');
      // Re-render dependent UIs
      try{ applySecurityGates(); }catch{}
    });
  })();

  // Permissions matrix
  (function wirePerms(){
    const host = document.getElementById('adminPermsMatrix');
    if(!host) return;
    const permList = [
      { key:'manageUsers', label:'Manage Users' },
      { key:'manageBilling', label:'Manage Billing' },
      { key:'viewReports', label:'View Reports' },
      { key:'manageConfigs', label:'Manage Configs' },
    ];
    function render(){
      const header = `<thead><tr><th>Role</th>${permList.map(p=>`<th>${p.label}</th>`).join('')}</tr></thead>`;
      const body = `<tbody>${roles.map((r,ri)=>`<tr><td>${adminEscape(r.name)}</td>${permList.map(p=>`<td style="text-align:center"><input type="checkbox" data-p-ri="${ri}" data-p-k="${p.key}" ${r.perms&&r.perms[p.key]?'checked':''}></td>`).join('')}</tr>`).join('')}</tbody>`;
      host.innerHTML = `<table class="cfg-table">${header}${body}</table>`;
    }
    render();
    host.addEventListener('change', (e)=>{
      const ri = e.target.getAttribute('data-p-ri');
      const key = e.target.getAttribute('data-p-k');
      if(ri==null || !key) return;
      const i = Number(ri);
      roles[i].perms = roles[i].perms || {};
      roles[i].perms[key] = e.target.checked;
      save(); addAudit('system','update','permissions'); try{ applySecurityGates(); }catch{}
    });
  })();

  // Feature Flags
  (function wireFlags(){
    const table = document.getElementById('adminFlagsTable');
    const addBtn = document.getElementById('adminFlagAdd');
    if(!table || !addBtn) return;
    function render(){
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = flags.map((f,i)=>`<tr>
        <td><input data-f-k="${i}" value="${adminEscape(f.key)}"/></td>
        <td><input data-f-l="${i}" value="${adminEscape(f.label||'')}"/></td>
        <td><input type="checkbox" data-f-e="${i}" ${f.enabled?'checked':''}></td>
        <td><button class="mini-btn" data-f-del="${i}">Delete</button></td>
      </tr>`).join('');
    }
    render();
    addBtn.addEventListener('click', ()=>{
      flags.push({ key:`flag_${Date.now()}`, label:'New Flag', enabled:false });
      save(); render(); addAudit('system','create','flag');
    });
    table.addEventListener('input', (e)=>{
      const k = e.target.getAttribute('data-f-k');
      const l = e.target.getAttribute('data-f-l');
      if(k != null){ flags[Number(k)].key = e.target.value; save(); }
      if(l != null){ flags[Number(l)].label = e.target.value; save(); }
    });
    table.addEventListener('change', (e)=>{
      const en = e.target.getAttribute('data-f-e');
      if(en != null){ flags[Number(en)].enabled = e.target.checked; save(); addAudit('system','update','flag'); try{ applySecurityGates(); }catch{} }
    });
    table.addEventListener('click', (e)=>{
      const del = e.target.closest('[data-f-del]');
      if(!del) return;
      const i = Number(del.getAttribute('data-f-del'));
      flags.splice(i,1); save(); render(); addAudit('system','delete','flag');
    });
  })();

  // Users management
  (function wireUsers(){
    const table = document.getElementById('adminUsersTable');
    const addBtn = document.getElementById('adminUserAdd');
    if(!table || !addBtn) return;
    function roleOptions(selId){ return roles.map(r=>`<option value="${r.id}" ${selId===r.id?'selected':''}>${adminEscape(r.name)}</option>`).join(''); }
    function render(){
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = users.map((u,i)=>`<tr>
        <td><input data-u-n="${i}" value="${adminEscape(u.name)}"/></td>
        <td><input data-u-e="${i}" value="${adminEscape(u.email)}"/></td>
        <td><select data-u-r="${i}">${roleOptions(u.roleId)}</select></td>
        <td style="text-align:center"><input type="checkbox" data-u-a="${i}" ${u.active?'checked':''}></td>
        <td><button class="mini-btn" data-u-del="${i}">Delete</button></td>
      </tr>`).join('');
    }
    render();
    window._renderAdminUsers = render;
    addBtn.addEventListener('click', ()=>{
      const rid = roles[0]?.id || '';
      users.push({ id:'u_'+Math.random().toString(36).slice(2,9), name:'New User', email:'', roleId: rid, active:true });
      save(); render(); addAudit('system','create','user'); window._renderAdminRoles?.();
    });
    table.addEventListener('input', (e)=>{
      const n = e.target.getAttribute('data-u-n');
      const em = e.target.getAttribute('data-u-e');
      if(n != null){ users[Number(n)].name = e.target.value; save(); }
      if(em != null){ users[Number(em)].email = e.target.value; save(); }
    });
    table.addEventListener('change', (e)=>{
      const r = e.target.getAttribute('data-u-r');
      const a = e.target.getAttribute('data-u-a');
      if(r != null){ users[Number(r)].roleId = e.target.value; save(); window._renderAdminRoles?.(); try{ applySecurityGates(); }catch{} }
      if(a != null){ users[Number(a)].active = e.target.checked; save(); }
    });
    table.addEventListener('click', (e)=>{
      const del = e.target.closest('[data-u-del]');
      if(!del) return;
      const i = Number(del.getAttribute('data-u-del'));
      users.splice(i,1); save(); render(); addAudit('system','delete','user'); window._renderAdminRoles?.();
    });
  })();

  // (removed) delegated click fallback; direct listeners are bound in each panel

  // Audit
  (function wireAudit(){
    const table = document.getElementById('adminAuditTable');
    const seed = document.getElementById('adminAuditSeed');
    if(!table || !seed) return;
    function render(){
      const tbody = table.querySelector('tbody');
      if(!audit.length){
        tbody.innerHTML = `<tr><td colspan="4" class="muted" style="text-align:center; padding:12px">No audit events</td></tr>`;
        return;
      }
      tbody.innerHTML = audit.slice().reverse().map(a=>`<tr><td>${new Date(a.time).toLocaleString()}</td><td>${adminEscape(a.actor)}</td><td>${adminEscape(a.action)}</td><td>${adminEscape(a.target)}</td></tr>`).join('');
    }
    render();
    seed.addEventListener('click', ()=>{
      const now = Date.now();
      audit.push({ time: now-60000, actor:'system', action:'create', target:'role Manager' });
      audit.push({ time: now-30000, actor:'megs', action:'update', target:'flag betaDashboard' });
      audit.push({ time: now-10000, actor:'system', action:'update', target:'general' });
      save(); render();
    });
    // Re-render when subtab changes to audit
    document.addEventListener('subtab:changed', (e)=>{ if((e.detail?.id||'')==='admin-audit') render(); });
  })();

  function addAudit(actor, action, target){
    try{
      audit.push({ time: Date.now(), actor, action, target });
      localStorage.setItem(K.audit, JSON.stringify(audit));
    }catch{}
  }
}


// Override Collections with a no-op to restore placeholder
function initCollections(){
  const ta = document.getElementById('colSpecNotes');
  if(!ta) return;
  try{ ta.value = localStorage.getItem('collections.specnotes') || ''; }catch{}
  ta.addEventListener('input', ()=>{
    try{ localStorage.setItem('collections.specnotes', ta.value || ''); }catch{}
  });
}

// Optional stub for environments that reference basic collections init
function initCollectionsBasic(){}


// Developer helper: reset Home layout state
window.DASH_RESET = function(){};

// Toggle Edit Mode (enables handles and drag/resizing)
function initEditMode(){}

// Widget type customization for Home cards
function initWidgetTypeCustomization(){
  const KEY = 'home.cards.types';
  const cards = document.getElementById('homeCards');
  const grid = document.getElementById('homeGrid');
  if(!cards || !grid) return;
  let types = {}, panelTypes = {};
  try { types = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { types = {}; }
  try { panelTypes = JSON.parse(localStorage.getItem('home.grid.types') || '{}'); } catch { panelTypes = {}; }

  // Apply saved types for cards
  cards.querySelectorAll('.stat-card[data-widget-id]').forEach(card=>{
    const id = card.dataset.widgetId;
    const t = types[id];
    if(t) setCardType(card, t);
  });
  // Apply saved types for panels
  grid.querySelectorAll('.panel[data-widget-id]').forEach(panel=>{
    const id = panel.dataset.widgetId;
    const t = panelTypes[id];
    if(t) setPanelType(panel, t);
  });

  // Open picker on customize
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-customize]');
    if(!btn) return;
    if(!document.body.classList.contains('is-editing')) return;
    const card = btn.closest('.stat-card[data-widget-id]');
    const panel = btn.closest('.panel[data-widget-id]');
    if(!card && !panel) return;
    showTypePicker(btn, (type)=>{
      if(card){
        setCardType(card, type);
        types[card.dataset.widgetId] = type;
        localStorage.setItem(KEY, JSON.stringify(types));
      } else if(panel){
        setPanelType(panel, type);
        panelTypes[panel.dataset.widgetId] = type;
        localStorage.setItem('home.grid.types', JSON.stringify(panelTypes));
      }
    });
  });
}

function showTypePicker(anchorEl, onPick){
  const types = [
    { id:'revenue', label:'Revenue', icon:'#i-money' },
    { id:'sales', label:'Sales', icon:'#i-tag' },
    { id:'customers', label:'Customers', icon:'#i-users' },
    { id:'orders', label:'Orders', icon:'#i-cart' },
    { id:'weather', label:'Weather', icon:'#i-life' },
    { id:'calculator', label:'Calculator', icon:'#i-settings' },
    { id:'quicklinks', label:'Quick Links', icon:'#i-report' },
    { id:'email', label:'Email', icon:'#i-mail' },
  ];
  let menu = document.getElementById('widgetTypeMenu');
  if(menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'widgetTypeMenu';
  Object.assign(menu.style, {
    position: 'absolute', zIndex: '9999', background: '#fff', border: '1px solid #e7e7f3',
    borderRadius: '12px', boxShadow: '0 10px 30px rgba(18,19,26,.12)', padding: '6px'
  });
  menu.innerHTML = types.map(t=>`<button data-type="${t.id}" style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border:none; cursor:pointer; width:100%">
      <svg viewBox="0 0 24 24" style="width:16px; height:16px"><use href="${t.icon}"/></svg>
      <span>${t.label}</span>
    </button>`).join('');
  document.body.appendChild(menu);
  const rect = anchorEl.getBoundingClientRect();
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;
  const onClick = (e)=>{
    const b = e.target.closest('[data-type]');
    if(b){ onPick(b.dataset.type); cleanup(); }
    else if(!menu.contains(e.target)){ cleanup(); }
  };
  function cleanup(){
    document.removeEventListener('click', onClick, true);
    if(menu) menu.remove();
  }
  setTimeout(()=> document.addEventListener('click', onClick, true), 0);
}

function setCardType(card, type){
  card.dataset.type = type;
  const iconUse = card.querySelector('.stat-icon use');
  const valueEl = card.querySelector('.stat-value');
  const labelEl = card.querySelector('.stat-label');
  const map = {
    revenue: { icon:'#i-money', label:'Revenue this month', value:'$132,000' },
    sales: { icon:'#i-tag', label:'Sales this month', value:'320k' },
    customers: { icon:'#i-users', label:'Customers gained', value:'6,458' },
    orders: { icon:'#i-cart', label:'Orders this month', value:'900' },
    weather: { icon:'#i-life', label:'Weather', value:'72°F Sunny' },
    calculator: { icon:'#i-settings', label:'Calculator', value:'Open' },
    quicklinks: { icon:'#i-report', label:'Quick Links', value:'3' },
    email: { icon:'#i-mail', label:'Email', value:'2 unread' },
    kpi: { icon:'#i-stats', label:'KPI', value:'95%' },
    chart: { icon:'#i-growth', label:'Chart', value:'—' },
    table: { icon:'#i-report', label:'Table', value:'—' },
    tasks: { icon:'#i-settings', label:'Tasks', value:'2 due' },
    calendar: { icon:'#i-life', label:'Calendar', value:'Today' },
    messages: { icon:'#i-mail', label:'Messages', value:'2 unread' },
    notes: { icon:'#i-report', label:'Quick Note', value:'Tap to edit' },
  };
  const cfg = map[type] || map.revenue;
  if(iconUse) iconUse.setAttribute('href', cfg.icon);
  if(valueEl) valueEl.textContent = cfg.value;
  if(labelEl) labelEl.textContent = cfg.label;
}

function setPanelType(panel, type){
  const title = panel.querySelector('.panel-header h2');
  const body = panel.querySelector('.panel-body') || (()=>{ const d=document.createElement('div'); d.className='panel-body'; panel.appendChild(d); return d; })();
  const labels = {
    chart:'Custom Chart', table:'Table', tasks:'Tasks', quicklinks:'Quick Links', calendar:'Calendar', messages:'Messages', kpi:'KPI', revenue:'Revenue', sales:'Sales', customers:'Customers', orders:'Orders', calculator:'Calculator', notes:'Notes', weather:'Weather'
  };
  if(title) title.textContent = labels[type] || 'Widget';
  // Simple placeholder bodies per type
  switch(type){
    case 'tasks':
      body.innerHTML = '<ul style="list-style:none; padding:0; margin:0; display:grid; gap:8px"><li class="muted">• Task A</li><li class="muted">• Task B</li></ul>';
      break;
    case 'quicklinks':
      body.innerHTML = '<div style="display:flex; gap:8px; flex-wrap:wrap"><a class="link" href="#">Open AR</a><a class="link" href="#">New Invoice</a><a class="link" href="#">Upload CSV</a></div>';
      break;
    case 'calendar':
      body.innerHTML = '<div class="muted">Today: AR standup 10:00 • Aging review 15:00</div>';
      break;
    case 'messages':
      body.innerHTML = '<div class="muted">2 unread • Latest: “AR aging review at 3pm”</div>';
      break;
    case 'table':
      body.innerHTML = '<div class="muted">Table placeholder</div>';
      break;
    case 'chart':
      body.innerHTML = '<div class="muted">Chart placeholder</div>';
      break;
    case 'kpi':
      body.innerHTML = '<div style="display:flex; gap:12px"><div class="stat-card" style="padding:10px"><div class="stat-meta"><div class="stat-value">95%</div><div class="stat-label">Goal</div></div></div><div class="stat-card" style="padding:10px"><div class="stat-meta"><div class="stat-value">+12%</div><div class="stat-label">MoM</div></div></div></div>';
      break;
    case 'calculator':
      body.innerHTML = '<div style="display:flex; gap:8px; align-items:center"><input type="number" class="calc-a" style="width:100px; padding:6px; border:1px solid #e7e7f3; border-radius:8px" placeholder="A"/><select class="calc-op" style="padding:6px; border-radius:8px"><option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option></select><input type="number" class="calc-b" style="width:100px; padding:6px; border:1px solid #e7e7f3; border-radius:8px" placeholder="B"/><button class="mini-btn calc-go">=</button><span class="calc-out" style="margin-left:8px; font-weight:700">0</span></div>';
      {
        const a = panel.querySelector('.calc-a'); const b = panel.querySelector('.calc-b'); const op = panel.querySelector('.calc-op'); const go = panel.querySelector('.calc-go'); const out = panel.querySelector('.calc-out');
        if(go) go.addEventListener('click', ()=>{ const av=parseFloat(a.value||'0'); const bv=parseFloat(b.value||'0'); const o=op.value; let r=0; try{ r = o==='+'?av+bv : o==='-'?av-bv : o==='*'?av*bv : bv!==0?av/bv:0; }catch(e){ r=0 } out.textContent = String(r); });
      }
      break;
    case 'notes':
      {
        const storageKey = 'widget.notes.'+ (panel.dataset.widgetId||'');
        const saved = (()=>{ try{ return localStorage.getItem(storageKey)||'' }catch{ return '' } })();
        body.innerHTML = `<textarea class="notes-area" style="width:100%; min-height:120px; padding:10px; border:1px solid #e7e7f3; border-radius:10px" placeholder="Quick note...">${saved}</textarea>`;
        const ta = panel.querySelector('.notes-area');
        if(ta) ta.addEventListener('input', ()=>{ try{ localStorage.setItem(storageKey, ta.value||''); }catch{} });
      }
      break;
    case 'weather':
      body.innerHTML = '<div class="muted">72°F · Sunny · Local</div>';
      break;
    default:
      body.innerHTML = '<div class="muted">Widget placeholder</div>';
  }
}

// ======================== AR Collections Follow-up Modal ========================
function initCollectionsFollowupModal(){
  // Inject modal HTML + floating action button
  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
    <symbol id="cf-i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></symbol>
    <symbol id="cf-i-sliders" viewBox="0 0 24 24"><path d="M4 6h10M20 6h-2M4 12h6M20 12h-10M4 18h14M20 18h-1"/><circle cx="14" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></symbol>
    <symbol id="cf-i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></symbol>
    <symbol id="cf-i-note" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" ry="2"/><path d="M8 9h8M8 13h6"/></symbol>
    <symbol id="cf-i-tag" viewBox="0 0 24 24"><path d="M20 10l-8 8-8-8 6-6h6z"/><circle cx="15" cy="9" r="1.5"/></symbol>
    <symbol id="cf-i-bolt" viewBox="0 0 24 24"><path d="M13 2L6 14h6l-1 8 7-12h-6z"/></symbol>
    <symbol id="cf-i-call" viewBox="0 0 24 24"><path d="M5 5c2 4 6 8 10 10l3-3 3 3-2 2c-1.5 1.5-4.5 1.5-10-4S3.5 6.5 5 5l2-2 3 3-3 3"/></symbol>
    <symbol id="cf-i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></symbol>
    <symbol id="cf-i-sms" viewBox="0 0 24 24"><path d="M21 15a3 3 0 0 1-3 3H9l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z"/></symbol>
    <symbol id="cf-i-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></symbol>
    <symbol id="cf-i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></symbol>
    <symbol id="cf-i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></symbol>
    <symbol id="cf-i-chevron" viewBox="0 0 24 24"><path d="M7 9l5 5 5-5"/></symbol>
  </svg>
  <div class="cf-backdrop" id="cfBackdrop" role="dialog" aria-modal="true" aria-labelledby="cfTitle" aria-describedby="cfDesc">
    <div class="cf-modal" id="cfModal" tabindex="-1">
      <header class="cf-head">
        <div class="cf-row-center cf-gap-10">
          <div class="avatar">AR</div>
          <div>
            <div class="cf-title" id="cfTitle">Collections — Notes / Follow-up</div>
            <div class="cf-sub" id="cfDesc">Select a row in Master to load context</div>
            <div class="cf-meta">
              <span class="cf-chip muted">Cust ID: <strong id="cfMetaCustomerId">—</strong></span>
              <span class="cf-chip">Project #: <strong id="cfMetaProject">—</strong></span>
              <span class="cf-chip muted">Terms: <strong id="cfMetaTerms">—</strong></span>
              <span class="cf-chip" id="cfMetaEmailWrap"><span class="cf-icon"><svg><use href="#cf-i-mail"/></svg></span><span id="cfMetaEmail">—</span></span>
              <span class="cf-chip">Invoice: <strong id="cfMetaInvoice">—</strong></span>
              <span class="cf-chip">Open: <strong id="cfMetaOpen">—</strong></span>
              <span class="cf-chip muted">DPD: <strong id="cfMetaDPD">—</strong></span>
              <span class="cf-chip" id="cfMetaRisk">Risk: <strong id="cfMetaRiskVal">—</strong></span>
            </div>
          </div>
        </div>
        <div class="cf-row-center cf-ml-auto">
          <span class="cf-pill">Owner: <strong>&nbsp;Megs</strong></span>
          <button class="cf-btn" id="cfClose">Close ✕</button>
        </div>
      </header>

      <div class="cf-split">
        <!-- Left: Timeline -->
        <section class="cf-panel cf-panel--sky" aria-label="Timeline">
          <div class="cf-panel-head">
            <div class="cf-row-center">
              <strong>Timeline</strong><span class="muted">• <span id="cfCount">0</span> entries</span>
            </div>
            <div class="cf-row">
              <div class="cf-input-wrap cf-w-200"><span class="cf-icon"><svg><use href="#cf-i-search"/></svg></span>
                <input id="cfSearch" class="cf-input" placeholder="Search notes, tags, mentions ( / )" />
              </div>
              <div class="cf-input-wrap"><span class="cf-icon"><svg><use href="#cf-i-sliders"/></svg></span>
                <select id="cfFilter" class="cf-select" title="Status filter">
                  <option value="">Status</option>
                  <option>Pending</option><option>Contacted</option><option>Promised</option>
                  <option>Overdue</option><option>Escalated</option><option>Paid</option>
                </select>
              </div>
            </div>
          </div>
          <div class="cf-panel-body">
            <div class="cf-timeline" id="cfTimeline">
              <div class="cf-day"><span class="cf-k">Today</span></div>
            </div>
          </div>
        </section>

        <!-- Right: Composer -->
        <section class="cf-panel cf-panel--pink" aria-label="Follow-up">
          <div class="cf-panel-head">
            <strong>New Note / Follow-up</strong>
            <div class="cf-row">
              <button class="cf-btn" data-tpl="call">+ Log Call</button>
              <button class="cf-btn" data-tpl="email">+ Log Email</button>
              <button class="cf-btn" data-tpl="sms">+ Log SMS</button>
            </div>
          </div>
          <div class="cf-panel-body">
            <div class="cf-form cf-composer-grid">
              <!-- Row 1 -->
              <div class="cf-form-section compact">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-sliders"/></svg></span><span class="cf-k">Status</span></div>
                <div>
                  <div class="cf-chips cf-chips--status" role="group" aria-label="Status">
                    <button type="button" class="cf-chip-btn status-pending" data-group="status" data-value="Pending"><span class="cf-dot pending"></span> Pending</button>
                    <button type="button" class="cf-chip-btn status-contacted" data-group="status" data-value="Contacted"><span class="cf-dot contacted"></span> Contacted</button>
                    <button type="button" class="cf-chip-btn status-promised" data-group="status" data-value="Promised"><span class="cf-dot promised"></span> Promised</button>
                    <button type="button" class="cf-chip-btn status-overdue" data-group="status" data-value="Overdue"><span class="cf-dot overdue"></span> Overdue</button>
                    <button type="button" class="cf-chip-btn status-escalated" data-group="status" data-value="Escalated"><span class="cf-dot escalated"></span> Escalated</button>
                    <button type="button" class="cf-chip-btn status-paid" data-group="status" data-value="Paid"><span class="cf-dot paid"></span> Paid</button>
                  </div>
                  <select id="cfStatus" class="cf-select sr-only" tabindex="-1" aria-hidden="true">
                    <option>Pending</option><option>Contacted</option><option>Promised</option>
                    <option>Overdue</option><option>Escalated</option><option>Paid</option>
                  </select>
                </div>
              </div>
              <!-- Row 1, Column 2: Tags (large screens) -->
              <div class="cf-form-section compact cf-show-lg">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-tag"/></svg></span><span class="cf-k">Tags</span></div>
                <div>
                  <label class="cf-k sr-only">Tags</label>
                  <div class="cf-input-wrap compact"><span class="cf-icon"><svg><use href="#cf-i-tag"/></svg></span>
                    <input id="cfTags" class="cf-input" placeholder="#voicemail, #dispute, @ap_trent" />
                  </div>
                </div>
              </div>
              <div class="cf-form-section compact cf-col-3">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-user"/></svg></span><span class="cf-k">Assign & Next</span></div>
                <div class="cf-stack">
                  <div>
                    <label class="cf-k sr-only">Assign</label>
                    <div class="cf-input-wrap compact"><span class="cf-icon"><svg><use href="#cf-i-user"/></svg></span>
                      <select id="cfAssign" class="cf-select">
                        <option selected>Megs</option><option>Alex</option><option>Team Queue</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="cf-k sr-only">Next Follow-up</label>
                    <div class="cf-input-wrap compact"><span class="cf-icon"><svg><use href="#cf-i-clock"/></svg></span>
                      <input id="cfNext" type="datetime-local" class="cf-input" />
                    </div>
                    <div class="cf-chips" style="margin-top:6px">
                      <button type="button" class="cf-chip-btn cf-next-chip" data-next-days="1">+1d</button>
                      <button type="button" class="cf-chip-btn cf-next-chip" data-next-days="3">+3d</button>
                      <button type="button" class="cf-chip-btn cf-next-chip" data-next-days="7">+1w</button>
                    </div>
                  </div>
                  <div>
                    <label class="cf-k sr-only">Promise to Pay (optional)</label>
                    <div class="cf-input-wrap compact"><span class="cf-icon"><svg><use href="#cf-i-calendar"/></svg></span>
                      <input id="cfPTP" type="date" class="cf-input" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Row 2 -->
              <div class="cf-form-section cf-span-2 cf-row-2">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-note"/></svg></span><span class="cf-k">Note</span></div>
                <div class="cf-input-wrap"><span class="cf-icon"><svg><use href="#cf-i-note"/></svg></span>
                  <textarea id="cfNote" class="cf-text cf-textarea" rows="6" placeholder="What happened? Remittance, contacts, commitments, disputes… (N to focus)"></textarea>
                </div>
                <div class="cf-att-row">
                  <div class="cf-attach-input">
                    <span class="cf-icon"><svg><use href="#cf-i-link"/></svg></span>
                    <input id="cfAttUrl" class="cf-input" placeholder="Paste link and Add" />
                    <button class="cf-btn" id="cfAttAdd">Add</button>
                    <button class="cf-btn" id="cfDictate">Dictate</button>
                  </div>
                  <div id="cfAttList" class="cf-att-row"></div>
                </div>
              </div>
              <div class="cf-form-section compact cf-col-3 cf-row-2">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-sliders"/></svg></span><span class="cf-k">Method & Templates</span></div>
                <div>
                  <div class="cf-chips" role="group" aria-label="Method">
                    <button type="button" class="cf-chip-btn" data-group="method" data-value="Call">Call</button>
                    <button type="button" class="cf-chip-btn" data-group="method" data-value="Email">Email</button>
                    <button type="button" class="cf-chip-btn" data-group="method" data-value="SMS">SMS</button>
                    <button type="button" class="cf-chip-btn" data-group="method" data-value="Portal">Portal</button>
                    <button type="button" class="cf-chip-btn" data-group="method" data-value="Other">Other</button>
                  </div>
                  <select id="cfMethod" class="cf-select sr-only" tabindex="-1" aria-hidden="true">
                    <option>Call</option><option>Email</option><option>SMS</option><option>Portal</option><option>Other</option>
                  </select>
                </div>
                <div style="margin-top:8px">
                  <div class="cf-k cf-mb-6">Quick Templates</div>
                  <div class="cf-row" id="cfTplWrap"></div>
                </div>
              </div>

              <!-- Tags row (optional) -->
              <div class="cf-form-section compact cf-hide-lg">
                <div class="cf-form-title"><span class="cf-icon"><svg><use href="#cf-i-tag"/></svg></span><span class="cf-k">Tags</span></div>
                <div>
                  <label class="cf-k sr-only">Tags</label>
                  <div class="cf-input-wrap compact"><span class="cf-icon"><svg><use href="#cf-i-tag"/></svg></span>
                    <input id="cfTagsAlt" class="cf-input" placeholder="#voicemail, #dispute, @ap_trent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="cf-foot">
            <span class="muted cf-text-12">Auto-save draft • Tips: / search · N note · Esc close • <span id="cfSavedAt">—</span></span>
            <div class="cf-row cf-ml-auto">
              <button class="cf-btn" id="cfDiscard">Discard</button>
              <button class="cf-btn primary" id="cfSave">Save Note</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>`;
  if (!document.getElementById('cfBackdrop')) document.body.insertAdjacentHTML('beforeend', markup);

  let fab = document.getElementById('cfOpenFab');
  if (!fab){
    fab = document.createElement('button');
    fab.id = 'cfOpenFab';
    fab.type = 'button';
    fab.textContent = 'Follow-up';
    document.body.appendChild(fab);
  }

  const $ = (s, el=document)=> el.querySelector(s);
  const $$ = (s, el=document)=> Array.from(el.querySelectorAll(s));
  const backdrop = $('#cfBackdrop');
  const timeline  = $('#cfTimeline');
  const savedAt   = $('#cfSavedAt');
  const countEl   = $('#cfCount');

  // Show FAB only when Collections subtabs are visible
  function isCollectionsActive(){
    const n = Array.from(document.querySelectorAll('nav.subnav[aria-label="Collections subtabs"]'));
    return !!n.find(x=>!x.classList.contains('is-hidden'));
  }
  function syncFab(){ fab.style.display = isCollectionsActive() ? 'inline-flex' : 'none'; }
  syncFab();
  new MutationObserver(syncFab).observe(document.body, {attributes:true, childList:true, subtree:true});

  // Modal helpers
  function openModal(){
    try{ $('#cfNext').value = new Date(Date.now()+60*60*1000).toISOString().slice(0,16); }catch{}
    backdrop.classList.add('is-open');
    $('#cfNote').focus();
    document.addEventListener('keydown', onKey, true);
    try{ if(typeof syncChips==='function') syncChips(); if(typeof renderTemplates==='function') renderTemplates(); }catch{}
    updateReminderBanner?.();
  }
  function closeModal(){
    backdrop.classList.remove('is-open');
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e){
    if (e.key === 'Escape') closeModal();
    if (e.key === '/') { e.preventDefault(); $('#cfSearch').focus(); }
    if (e.key.toLowerCase() === 'n') { e.preventDefault(); $('#cfNote').focus(); }
  }

  fab.addEventListener('click', openModal);
  $('#cfClose').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) closeModal(); });

  // Draft state + autosave
  const state = { draft: { status:'Pending', method:'Call', next:'', ptp:'', note:'', tags:'', assign:'Megs' }, items: [] };
  const fields = ['cfStatus','cfMethod','cfNext','cfPTP','cfNote','cfTags','cfAssign'].map(id=>$('#'+id));
  fields.forEach(el => el.addEventListener('input', saveDraft));
  state.attachments = [];
  const attUrl = document.getElementById('cfAttUrl');
  const attAdd = document.getElementById('cfAttAdd');
  const attList= document.getElementById('cfAttList');
  function drawAtt(){ if(attList) attList.innerHTML = state.attachments.map((u,i)=>`<span class=\"cf-attach-chip\" data-i=\"${i}\">Link<span class=\"x\" data-del=\"${i}\">×</span></span>`).join(''); }
  if(attAdd) attAdd.addEventListener('click', ()=>{ const u=(attUrl?.value||'').trim(); if(!u) return; state.attachments.push(u); attUrl.value=''; drawAtt(); });
  document.addEventListener('click', (e)=>{ const x=e.target.closest('.cf-attach-chip .x'); if(!x) return; const i=parseInt(x.dataset.del||'-1',10); if(i>=0){ state.attachments.splice(i,1); drawAtt(); } });

  // Voice dictation
  let rec=null, recActive=false;
  const dictateBtn = document.getElementById('cfDictate');
  if(dictateBtn){
    dictateBtn.addEventListener('click', ()=>{
      try{
        const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition; if(!Ctor){ showToast?.('Speech API not supported','error'); return; }
        if(!rec){ rec = new Ctor(); rec.lang='en-US'; rec.interimResults=true; rec.continuous=true; rec.onresult = (ev)=>{
          let str=''; for(let i=ev.resultIndex;i<ev.results.length;i++){ str += ev.results[i][0].transcript; }
          insertSnippet(' '+str.trim());
        }; rec.onend = ()=>{ recActive=false; dictateBtn.textContent='Dictate'; } }
        if(!recActive){ rec.start(); recActive=true; dictateBtn.textContent='Stop'; }
        else { rec.stop(); }
      }catch(err){ console.error(err); showToast?.('Mic error','error'); }
    });
  }
  // Keep small-screen tags in sync with main #cfTags
  const tagsAlt = document.getElementById('cfTagsAlt');
  const tagsMain = document.getElementById('cfTags');
  if(tagsAlt){ tagsAlt.addEventListener('input', ()=>{ if(tagsMain){ tagsMain.value = tagsAlt.value; tagsMain.dispatchEvent(new Event('input',{bubbles:true})); } }); }
  // Method-specific templates
  const METHOD_TPLS = {
    Call: [
      {label:'Voicemail', text:'Left voicemail. Requested remittance advice.'},
      {label:'Spoke w/ AP', text:'Spoke with A/P; discussed payment timing and any blockers.'},
      {label:'PTP', text:'Customer committed to payment on [date].'}
    ],
    Email: [
      {label:'Reminder', text:'Sent follow-up email with statement attached.'},
      {label:'Dispute Docs', text:'Requested supporting documentation for dispute review.'},
      {label:'W-9', text:'Sent updated W-9 as requested.'}
    ],
    SMS: [
      {label:'Reminder SMS', text:'Sent payment reminder SMS with portal link.'},
      {label:'Short Link', text:'Shared secure portal link for payment.'}
    ],
    Portal: [
      {label:'Invite', text:'Sent portal invite to primary contact.'},
      {label:'Upload Request', text:'Requested document upload via portal.'}
    ],
    Other: [
      {label:'General', text:'Captured relevant follow-up details.'}
    ]
  };
  function renderTemplates(){
    const method = $('#cfMethod')?.value || 'Call';
    const wrap = document.getElementById('cfTplWrap'); if(!wrap) return;
    const tpls = METHOD_TPLS[method] || [];
    wrap.innerHTML = tpls.map(t=>`<button class=\"cf-btn\" data-snippet=\"${esc(t.text)}\">${esc(t.label)}</button>`).join('');
  }
  // Chip groups for Status / Method
  function syncChips(){
    const s = $('#cfStatus')?.value; const m=$('#cfMethod')?.value;
    $$('.cf-chip-btn[data-group="status"]').forEach(b=> b.classList.toggle('is-active', b.dataset.value===s));
    $$('.cf-chip-btn[data-group="method"]').forEach(b=> b.classList.toggle('is-active', b.dataset.value===m));
  }
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('.cf-chip-btn');
    if(!b) return;
    const group = b.dataset.group; const val = b.dataset.value;
    if(group==='status'){ const sel=$('#cfStatus'); if(sel){ sel.value=val; sel.dispatchEvent(new Event('input',{bubbles:true})); } }
    if(group==='method'){ const sel=$('#cfMethod'); if(sel){ sel.value=val; sel.dispatchEvent(new Event('input',{bubbles:true})); renderTemplates(); } }
    syncChips();
  });
  function saveDraft(){
    state.draft = {
      status: $('#cfStatus').value,
      method: $('#cfMethod').value,
      next:   $('#cfNext').value,
      ptp:    $('#cfPTP').value,
      note:   $('#cfNote').value,
      tags:   $('#cfTags').value,
      assign: $('#cfAssign').value
    };
    savedAt.textContent = new Date().toLocaleTimeString();
    updateReminderBanner?.();
  }
  // Quick-pick for Next Follow-up (+1d, +3d, +1w)
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('.cf-next-chip'); if(!b) return;
    const days = parseInt(b.dataset.nextDays||'0',10) || 0;
    const inEl = document.getElementById('cfNext'); if(!inEl) return;
    const base = (inEl.value && !isNaN(Date.parse(inEl.value))) ? new Date(inEl.value) : new Date();
    base.setDate(base.getDate()+days);
    // Normalize to local yyyy-mm-ddThh:mm
    const pad = (n)=> String(n).padStart(2,'0');
    const v = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
    inEl.value = v;
    inEl.dispatchEvent(new Event('input',{bubbles:true}));
  });

  // Snippets + templates
  // Delegate for snippet buttons (supports dynamic templates)
  document.addEventListener('click', (e)=>{ const b=e.target.closest('[data-snippet]'); if(b) insertSnippet(b.dataset.snippet||''); });
  $$('[data-tpl]').forEach(b => b.addEventListener('click', ()=>{
    const map = {
      call:  { method:'Call',  status:'Contacted', text:'Called A/P; discussed payment status.' },
      email: { method:'Email', status:'Pending',   text:'Sent follow-up email with statement attached.' },
      sms:   { method:'SMS',   status:'Pending',   text:'Sent payment reminder SMS with portal link.' }
    };
    const t = map[b.dataset.tpl]; if(!t) return;
    $('#cfMethod').value = t.method; $('#cfStatus').value = t.status; syncChips(); renderTemplates(); insertSnippet(t.text); $('#cfNote').focus();
  }));
  function insertSnippet(text){
    text = resolveVars(text);
    const ta = $('#cfNote');
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(end);
    const needsNL = before && !before.endsWith('\n') ? '\n' : '';
    ta.value = before + needsNL + text + after;
    const pos = (before + needsNL + text).length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.dispatchEvent(new Event('input', {bubbles:true}));
  }
  function resolveVars(t){
    const map = {
      '{{invoiceId}}': currentContext?.invoiceId || '',
      '{{customerName}}': currentContext?.customerName || '',
      '{{openBalance}}': currentContext?.openBalance || '',
      '{{dpd}}': currentContext?.dpd || '',
      '{{risk}}': currentContext?.risk || ''
    };
    return String(t).replace(/\{\{(invoiceId|customerName|openBalance|dpd|risk)\}\}/g, m=>map[m]||'');
  }

  // Save -> append to timeline (front-end only)
  $('#cfSave').addEventListener('click', ()=>{
    const d = { ...state.draft };
    if (!d.note.trim()) { showToast?.('Add a brief note before saving.','error'); return; }
    // Escalation rule based on context
    try{
      const dpdNum = parseInt(currentContext?.dpd || '0', 10);
      if ((dpdNum>=60) || (/high/i.test(currentContext?.risk||''))){
        const t = (d.tags||'');
        if(!/\b#Escalated\b/i.test(t)) d.tags = (t? t+ ', ':'') + '#Escalated';
      }
    }catch{}
    const el = renderItem(d);
    timeline.insertBefore(el, timeline.children[1] || null);
    state.items.unshift(d);
    countEl.textContent = String(state.items.length);
    $('#cfNote').value = ''; $('#cfTags').value = ''; saveDraft();
    el.style.outline = '2px solid rgba(111,92,255,.4)'; setTimeout(()=> el.style.outline='none', 600);
  });
  $('#cfDiscard').addEventListener('click', ()=>{
    if (confirm('Discard current draft?')){ $('#cfNote').value=''; $('#cfTags').value=''; saveDraft(); }
  });

  function renderItem(d){
    const wrap = document.createElement('article');
    wrap.className = 'cf-item';
    wrap.dataset.status = d.status;
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const sc = ({Pending:'pending',Contacted:'contacted',Promised:'promised',Overdue:'overdue',Escalated:'escalated',Paid:'paid'})[d.status] || 'pending';
    const nextPill = d.next ? `<span class="cf-pill">Next: ${fmtDT(d.next)}</span>` : '';
    const ptpPill  = d.ptp  ? `<span class="cf-pill">PTP: ${fmtD(d.ptp)}</span>` : '';
    const method = d.method || 'Other';
    const sym = ({Call:'#cf-i-call', Email:'#cf-i-mail', SMS:'#cf-i-sms', Portal:'#cf-i-link', Other:'#cf-i-note'})[method] || '#cf-i-note';
    const methodClass = 'method-' + String(method).toLowerCase();
    wrap.innerHTML = `
      <div class="cf-bullet"><svg><use href='${sym}'/></svg></div>
      <div>
        <div class="cf-item-head">
          <span><strong>Note</strong> • You</span>
          <span class="cf-status ${sc}">${esc(d.status)}</span>
          ${ptpPill}${nextPill}
          <span class="cf-pill ${methodClass}">${esc(d.method)}</span>
        </div>
        <div class="cf-item-body">${esc(d.note)}</div>
        <div class="cf-item-meta">
          <span>${time}</span>${renderTags(d.tags)}
        </div>
      </div>`;
    return wrap;
  }
  function renderTags(s){
    const tags = (s||'').split(',').map(t=>t.trim()).filter(Boolean);
    return tags.map(t=>`<span class="cf-tag">${esc(t)}</span>`).join('');
  }
  function fmtDT(v){ try{ const d=new Date(v); return d.toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'}); }catch{ return v; } }
  function fmtD(v){ try{ const d=new Date(v); return d.toLocaleDateString([], {month:'short', day:'2-digit'}); }catch{ return v; } }
  function esc(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  // Filters / search
  $('#cfFilter').addEventListener('change', applyFilters);
  $('#cfSearch').addEventListener('input', applyFilters);
  function applyFilters(){
    const f = $('#cfFilter').value;
    const q = $('#cfSearch').value.toLowerCase().trim();
    $$('.cf-item', timeline).forEach(el=>{
      const okStatus = !f || el.dataset.status === f;
      const okQuery  = !q || el.textContent.toLowerCase().includes(q);
      el.style.display = (okStatus && okQuery) ? '' : 'none';
    });
  }

  // ================== Open modal from Master subtab table ==================
  const masterPanel = document.querySelector('[data-subtab-panel="col-master"]');
  if (masterPanel) {
    masterPanel.addEventListener('click', (e)=>{
      if (e.target.closest('button, a, input, select, textarea')) return;
      const row = e.target.closest('.ar-table tbody tr') || e.target.closest('tr');
      if (!row) return;

      const debtorName = row.dataset.debtor || row.querySelector('td')?.textContent.trim() || 'Account';
      const invoiceId  = row.dataset.invoice || row.querySelector('td:nth-child(2)')?.textContent.trim() || '';
      const customerId = row.dataset.customerId || '';
      const projectNum = row.dataset.projectId || '';
      const terms      = row.dataset.terms || '';
      const email      = row.dataset.email || '';
      const openBal    = row.dataset.open || row.dataset.openBalance || '';
      const dpd        = row.dataset.dpd || row.dataset.daysPastDue || '';
      const risk       = row.dataset.risk || '';

      document.getElementById('cfTitle').textContent = debtorName;
      document.getElementById('cfDesc').textContent  = invoiceId ? `Invoice ${invoiceId}` : 'Collections follow-up';
      document.getElementById('cfMetaCustomerId').textContent = customerId || '—';
      document.getElementById('cfMetaProject').textContent    = projectNum || '—';
      document.getElementById('cfMetaTerms').textContent      = terms || '—';
      const invEl = document.getElementById('cfMetaInvoice'); if(invEl) invEl.textContent = invoiceId || '—';
      const openEl = document.getElementById('cfMetaOpen'); if(openEl) openEl.textContent = openBal || '—';
      const dpdEl = document.getElementById('cfMetaDPD'); if(dpdEl) dpdEl.textContent = dpd || '—';
      const riskWrap = document.getElementById('cfMetaRisk'); const riskVal = document.getElementById('cfMetaRiskVal');
      if(riskVal) riskVal.textContent = risk || '—';
      if(riskWrap){ riskWrap.style.background = /high/i.test(risk||'')? '#ffeaea' : /med/i.test(risk||'')? '#fff7d6' : '#ecfdf5'; }

      const emailEl = document.getElementById('cfMetaEmail');
      const wrapEl  = document.getElementById('cfMetaEmailWrap');
      if (email) {
        emailEl.textContent = email;
        wrapEl.title = 'Click to copy';
        wrapEl.style.cursor = 'copy';
        wrapEl.onclick = ()=> { navigator.clipboard?.writeText(email).then(()=> showToast?.('Email copied')); };
      } else {
        emailEl.textContent = '—';
        wrapEl.removeAttribute('title');
        wrapEl.style.cursor = 'default';
        wrapEl.onclick = null;
      }

      currentContext = { invoiceId, customerName: debtorName, openBalance: openBal, dpd, risk };
      openModal();
      ensureReminderBadge(row, dpd);
    });
  }

  function ensureReminderBadge(row, dpd){
    try{
      const n = parseInt(dpd||'0',10); if(!(n>0)) return;
      const first = row.querySelector('td'); if(!first) return;
      if(first.querySelector('.ar-rem-badge')) return;
      const b = document.createElement('span'); b.className='ar-rem-badge'; b.textContent='Reminder'; first.appendChild(b);
    }catch{}
  }

  function updateReminderBanner(){
    try{
      const nextStr = $('#cfNext')?.value || '';
      let late = false;
      if(nextStr){ const dt=new Date(nextStr); if(!isNaN(+dt) && dt < new Date()) late = true; }
      if(!late){
        for(const it of state.items){ if(it.next){ const dt=new Date(it.next); if(!isNaN(+dt) && dt < new Date()) { late=true; break; } } }
      }
      const el = document.getElementById('cfReminderBanner'); if(el) el.style.display = late ? 'block' : 'none';
    }catch{}
  }
}


// ---------------------- Add widgets via placeholders ------------------------
function initWidgetAdd(){
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-add]');
    if(!btn) return;
    if(!document.body.classList.contains('is-editing')) return;
    const where = btn.dataset.add; // 'cards' | 'grid'
    showAddPicker(btn, where);
  });
}

function showAddPicker(anchor, where){
  const TYPES = [
    { id:'revenue', label:'Revenue', icon:'#i-money', kind:'metric' },
    { id:'sales', label:'Sales', icon:'#i-tag', kind:'metric' },
    { id:'customers', label:'Customers', icon:'#i-users', kind:'metric' },
    { id:'orders', label:'Orders', icon:'#i-cart', kind:'metric' },
    { id:'kpi', label:'KPI', icon:'#i-stats', kind:'metric' },
    { id:'chart', label:'Chart', icon:'#i-growth', kind:'panel' },
    { id:'table', label:'Table', icon:'#i-report', kind:'panel' },
    { id:'tasks', label:'Tasks', icon:'#i-settings', kind:'app' },
    { id:'quicklinks', label:'Quick Links', icon:'#i-report', kind:'app' },
    { id:'calendar', label:'Calendar', icon:'#i-life', kind:'app' },
    { id:'messages', label:'Messages', icon:'#i-mail', kind:'app' },
    { id:'calculator', label:'Calculator', icon:'#i-settings', kind:'app' },
    { id:'weather', label:'Weather', icon:'#i-life', kind:'app' },
    { id:'notes', label:'Notes', icon:'#i-report', kind:'app' },
  ];

  let menu = document.getElementById('widgetAddMenu');
  if(menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'widgetAddMenu';
  Object.assign(menu.style, {
    position:'absolute', zIndex:'9999', background:'#fff', border:'1px solid #e7e7f3',
    borderRadius:'12px', boxShadow:'0 10px 30px rgba(18,19,26,.12)', padding:'10px', width:'320px'
  });
  let sizeRow = `<div class="size-picker" id="sizePicker">
      <div class="size-chip is-active" data-size="s">Small</div>
      <div class="size-chip" data-size="m">Medium</div>
      <div class="size-chip" data-size="l">Large</div>
    </div>`;
  const typeList = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; max-height:260px; overflow:auto">
      ${TYPES.map(t=>`
        <button data-add-type="${t.id}" style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border:1px solid #e7e7f3; border-radius:10px; cursor:pointer">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px"><use href="${t.icon}"/></svg>
          <span>${t.label}</span>
        </button>`).join('')}
    </div>`;
  menu.innerHTML = sizeRow + typeList;
  document.body.appendChild(menu);
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;

  let size = 's';
  let sizeChanged = false;
  const onClick = (ev)=>{
    const chip = ev.target.closest('.size-chip');
    if(chip){ sizeChanged = true; size = chip.dataset.size; menu.querySelectorAll('.size-chip').forEach(c=>c.classList.toggle('is-active', c===chip)); return; }
    const pick = ev.target.closest('[data-add-type]');
    if(pick){
      const type = pick.dataset.addType;
      const useSize = sizeChanged ? size : recommendedSize(type, where);
      addWidget(where, type, useSize);
      cleanup();
    } else if(!menu.contains(ev.target)){
      cleanup();
    }
  };
  function cleanup(){ document.removeEventListener('click', onClick, true); menu.remove(); }
  setTimeout(()=> document.addEventListener('click', onClick, true), 0);
}

function addWidget(where, type, size){
  const id = `w_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  if(where==='cards'){
    const cont = document.getElementById('homeCards');
    if(!cont) return;
    const el = document.createElement('div');
    el.className = 'stat-card';
    el.setAttribute('data-widget-id', id);
    el.setAttribute('draggable', 'true');
    if(size==='m') el.classList.add('size-2');
    if(size==='l') el.classList.add('size-3');
    el.innerHTML = `
      <span class="drag-handle" title="Drag">⋮⋮</span>
      <div class="widget-controls"><button class="mini-btn delete-btn" data-delete title="Delete">✕</button></div>
      <div class="stat-icon"><svg viewBox="0 0 24 24"><use href="#i-report"/></svg></div>
      <div class="stat-meta"><div class="stat-value">—</div><div class="stat-label">New Widget</div></div>
      <button class="dots">⋯</button>`;
    cont.appendChild(el);
    // Persist type
    try { const KEY='home.cards.types'; const m=JSON.parse(localStorage.getItem(KEY)||'{}'); m[id]=type; localStorage.setItem(KEY, JSON.stringify(m)); } catch{}
    setCardType(el, type);
    persistOrder(cont, '.stat-card', 'home.cards.order');
    saveSizePreset('home.cards.preset', id, size);
  } else {
    const cont = document.getElementById('homeGrid');
    if(!cont) return;
    const el = document.createElement('div');
    el.className = 'panel';
    el.setAttribute('data-widget-id', id);
    el.setAttribute('draggable', 'true');
    if(size==='m') el.classList.add('span-2');
    if(size==='l') el.classList.add('span-3');
    el.innerHTML = `
      <div class="panel-header">
        <h2>New Widget</h2>
        <span class="drag-handle" title="Drag">⋮⋮</span>
        <div class="widget-controls"><button class="mini-btn delete-btn" data-delete title="Delete">✕</button></div>
      </div>
      <div class="panel-body"></div>`;
    cont.appendChild(el);
    // Persist order and size
    persistOrder(cont, '.panel', 'home.grid.order');
    saveSizePreset('home.grid.preset', id, size);
    // Persist and render type
    try { const KEY='home.grid.types'; const m=JSON.parse(localStorage.getItem(KEY)||'{}'); m[id]=type; localStorage.setItem(KEY, JSON.stringify(m)); } catch{}
    setPanelType(el, type);
  }
}

// Choose sensible default size per type and container
function recommendedSize(type, where){
  const cardSmall = ['revenue','sales','customers','orders','kpi','email','calculator'];
  const cardMedium = ['quicklinks','weather'];
  const panelLarge = ['chart','table','calendar'];
  const panelMedium = ['tasks','messages','quicklinks'];
  if(where==='cards'){
    if(cardMedium.includes(type)) return 'm';
    return 's';
  } else {
    if(panelLarge.includes(type)) return 'l';
    if(panelMedium.includes(type)) return 'm';
    return 'm';
  }
}

// Click-to-open widget config (size/type) and Reset button
function initWidgetClickMenus(){
  document.addEventListener('click', (e)=>{
    if(!document.body.classList.contains('is-editing')) return;
    const widget = e.target.closest('.stat-card[data-widget-id], .panel[data-widget-id]');
    if(!widget) return;
    if(e.target.closest('.drag-handle') || e.target.closest('[data-delete]') || e.target.closest('.widget-placeholder')) return;
    const isCard = widget.classList.contains('stat-card');
    showWidgetMenu(widget, isCard ? 'cards' : 'grid');
  });
}

function showWidgetMenu(widget, where){
  let menu = document.getElementById('widgetCfgMenu');
  if(menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'widgetCfgMenu';
  Object.assign(menu.style, { position:'absolute', zIndex:'9999', background:'#fff', border:'1px solid #e7e7f3', borderRadius:'12px', boxShadow:'0 10px 30px rgba(18,19,26,.12)', padding:'10px', width:'340px' });

  const sizeKey = where==='cards' ? 'home.cards.preset' : 'home.grid.preset';
  const typeKey = where==='cards' ? 'home.cards.types' : 'home.grid.types';
  let sizes={}; try{ sizes=JSON.parse(localStorage.getItem(sizeKey)||'{}'); }catch{}
  let types={}; try{ types=JSON.parse(localStorage.getItem(typeKey)||'{}'); }catch{}
  const id = widget.dataset.widgetId;
  const currSize = sizes[id] || 's';
  const currType = types[id] || (where==='cards' ? 'revenue' : 'chart');

  const sizeRow = `<div class="size-picker" id="cfgSize">
      <div class="size-chip ${currSize==='s'?'is-active':''}" data-size="s">Small</div>
      <div class="size-chip ${currSize==='m'?'is-active':''}" data-size="m">Medium</div>
      <div class="size-chip ${currSize==='l'?'is-active':''}" data-size="l">Large</div>
    </div>`;
  const TYPES = [
    { id:'revenue', label:'Revenue', icon:'#i-money' },
    { id:'sales', label:'Sales', icon:'#i-tag' },
    { id:'customers', label:'Customers', icon:'#i-users' },
    { id:'orders', label:'Orders', icon:'#i-cart' },
    { id:'kpi', label:'KPI', icon:'#i-stats' },
    { id:'chart', label:'Chart', icon:'#i-growth' },
    { id:'table', label:'Table', icon:'#i-report' },
    { id:'tasks', label:'Tasks', icon:'#i-settings' },
    { id:'quicklinks', label:'Quick Links', icon:'#i-report' },
    { id:'calendar', label:'Calendar', icon:'#i-life' },
    { id:'messages', label:'Messages', icon:'#i-mail' },
    { id:'calculator', label:'Calculator', icon:'#i-settings' },
    { id:'weather', label:'Weather', icon:'#i-life' },
    { id:'notes', label:'Notes', icon:'#i-report' },
  ];
  const typeGrid = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; max-height:260px; overflow:auto">
    ${TYPES.map(t=>`<button data-type="${t.id}" class="${currType===t.id?'is-active':''}" style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border:1px solid #e7e7f3; border-radius:10px; cursor:pointer">
      <svg viewBox=\"0 0 24 24\" style=\"width:16px; height:16px\"><use href=\"${t.icon}\"/></svg>
      <span>${t.label}</span>
    </button>`).join('')}
  </div>`;
  menu.innerHTML = sizeRow + typeGrid;
  document.body.appendChild(menu);
  const rect = widget.getBoundingClientRect();
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + 8 + window.scrollY}px`;

  const onClick = (ev)=>{
    const chip = ev.target.closest('.size-chip');
    if(chip){
      const s = chip.dataset.size; applySizePreset(widget, s, where==='cards'?'card':'panel'); saveSizePreset(sizeKey, id, s);
      menu.querySelectorAll('.size-chip').forEach(c=>c.classList.toggle('is-active', c===chip));
      return;
    }
    const pick = ev.target.closest('[data-type]');
    if(pick){
      const t = pick.dataset.type;
      const pickedSize = (currSize==='s') ? recommendedSize(t, where) : (menu.querySelector('.size-chip.is-active')?.dataset.size || currSize);
      applySizePreset(widget, pickedSize, where==='cards'?'card':'panel');
      saveSizePreset(sizeKey, id, pickedSize);
      if(where==='cards') setCardType(widget, t); else setPanelType(widget, t);
      types[id]=t; localStorage.setItem(typeKey, JSON.stringify(types));
      cleanup(); return;
    }
    if(!menu.contains(ev.target)) cleanup();
  };
  function cleanup(){ document.removeEventListener('click', onClick, true); menu.remove(); }
  setTimeout(()=> document.addEventListener('click', onClick, true), 0);
}

function initResetButton(){
  const btn = document.getElementById('layoutReset');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    if(!confirm('Reset Home layout to defaults?')) return;
    ['home.cards.order','home.grid.order','home.cards.preset','home.grid.preset','home.cards.types','home.grid.types']
      .forEach(k=>localStorage.removeItem(k));
    location.reload();
  });
}

// Lightweight scoped widget system for tab Overviews
function initWidgetScope(scope){
  const grid = document.getElementById(`widgetGrid--${scope}`);
  const addBtn = document.getElementById(`widgetsAddBtn--${scope}`);
  const editBtn = document.getElementById(`widgetsEditBtn--${scope}`);
  const badge = document.getElementById(`widgetsEditBadge--${scope}`);
  const sideGallery = document.getElementById('widgetGallerySide');
  if(!grid || !addBtn || !editBtn) return;

  const CFG_KEY = `widgets.config.v1.${scope}`;
  const LS_KEY = `widgets.layout.v1.${scope}`;
  function readAllCfg(){ try { return JSON.parse(localStorage.getItem(CFG_KEY)||'{}'); } catch { return {}; } }
  function getCfg(id){ const all = readAllCfg(); return all[id] || {}; }
  function setCfg(id, cfg){ const all = readAllCfg(); all[id] = cfg; localStorage.setItem(CFG_KEY, JSON.stringify(all)); }

  function uid(){ return scope + '-' + Math.random().toString(36).slice(2,10); }
  function spanFor(size, orient){
    const s=(size||'xs').toLowerCase(), o=(orient||'').toLowerCase(); const p=o==='portrait';
    return s==='xxl'?{cols:3,rows:3}: s==='xl'?(p?{cols:2,rows:4}:{cols:4,rows:2}): s==='l'?(p?{cols:2,rows:3}:{cols:3,rows:2}): s==='m'?{cols:2,rows:2}: s==='s'?(p?{cols:1,rows:2}:{cols:2,rows:1}) : {cols:1,rows:1};
  }
  function defaultOrientFor(size){ switch((size||'').toLowerCase()){ case 's': return 'landscape'; case 'l': case 'xl': return 'portrait'; default: return ''; } }
  function applySpans(el){ const sz=el.dataset.size||'xs', ori=el.dataset.orient||defaultOrientFor(sz)||''; const {cols,rows}=spanFor(sz,ori); el.style.gridColumn=`span ${cols}`; el.style.gridRow=`span ${rows}`; }

  function titleFor(t){ return ({kpi:'KPI', metrics:'Metrics', email:'Email', messages:'Messages', calendar:'Calendar', announcements:'Announcements', reminders:'Reminders', tasks:'Tasks', notes:'Quick Notes', quicklinks:'Quick Links', calculator:'Calculator', weather:'Weather'})[t]||'Widget'; }
  function iconFor(t){ return ({kpi:'#i-stats', metrics:'#i-growth', email:'#i-mail', messages:'#i-mail', calendar:'#i-life', announcements:'#i-report', reminders:'#i-settings', tasks:'#i-settings', notes:'#i-report', quicklinks:'#i-report', calculator:'#i-settings', weather:'#i-life'})[t]||'#i-report'; }
  function renderBody(t,id){
    if(t==='metrics') return `<div class="chart-box" data-type="metrics"><canvas id="c_${id}" height="120"></canvas></div>`;
    if(t==='kpi') return `<div class="kpi-wrap" data-type="kpi"><div class="kpi-value">$132,000</div><div class="kpi-label muted">Revenue</div></div>`;
    if(t==='email') return `<ul class="mini-list"><li>Invoice #883 payment received</li><li>Q3 planning deck</li></ul>`;
    if(t==='messages') return `<ul class="mini-list"><li>#alerts: Risk monitor</li><li>Fin-Chat: aging review</li></ul>`;
    if(t==='calendar') return `<ul class="mini-list"><li>Today 10:00 — AR standup</li><li>15:00 — Aging review</li></ul>`;
    if(t==='notes') return `<textarea class="notes-area" data-notes-key="widget.notes.${scope}.${id}" placeholder="Quick note..." rows="5"></textarea>`;
    if(t==='quicklinks') return `<div class="links-wrap"><a class="link" href="#">Open ${scope.toUpperCase()}</a><a class="link" href="#">New Item</a></div>`;
    if(t==='calculator') return `<div class="calc" data-calc-id="${id}"><div class="calc-display">0</div><div class="calc-pad"><button class="calc-btn op" data-k="ac">AC</button><button class="calc-btn" data-k="7">7</button><button class="calc-btn" data-k="8">8</button><button class="calc-btn" data-k="9">9</button><button class="calc-btn op" data-k="/">÷</button><button class="calc-btn" data-k="4">4</button><button class="calc-btn" data-k="5">5</button><button class="calc-btn" data-k="6">6</button><button class="calc-btn op" data-k="*">×</button><button class="calc-btn" data-k="1">1</button><button class="calc-btn" data-k="2">2</button><button class="calc-btn" data-k="3">3</button><button class="calc-btn op" data-k="-">−</button><button class="calc-btn" data-k="0" style="grid-column: span 2">0</button><button class="calc-btn" data-k=".">.</button><button class="calc-btn op" data-k="+">+</button><button class="calc-btn eq" data-k="=">=</button></div></div>`;
    if(t==='weather') return `<div class="weather"><div class="temp">72°</div><div class="muted">Sunny · Local</div></div>`;
    return `<div class="muted">Empty</div>`;
}

// Install a one-time boot so scoped dashboards initialize only when shown
function setupScopedWidgetBoot(){
  const booted = {};
  function tryBoot(scope){ if (booted[scope]) return; if (document.getElementById(`widgetGrid--${scope}`)) { initWidgetScope(scope); booted[scope] = true; } }
  // If the page opens directly on a scoped overview, boot it
  tryBoot('recv'); tryBoot('pay'); tryBoot('cf');
  document.addEventListener('subtab:changed', (e)=>{
    const id = e.detail?.id || '';
    if (id === 'recv-overview') tryBoot('recv');
    if (id === 'pay-overview') tryBoot('pay');
    if (id === 'cf-overview') tryBoot('cf');
  });
}

// Lazy-include HTML partials when a subtab is activated
(function initHtmlIncludes(){
  async function loadInclude(el){
    if (!el || el.getAttribute('data-included')==='true') return;
    const url = el.getAttribute('data-include'); if(!url) return;
    try{
      let res = await fetch(url, { cache:'no-cache' });
      let html = await res.text();
      // Some dev servers may 304 with empty body; try a cache-bust retry
      if (!html || !html.trim()){
        res = await fetch(url + (url.includes('?')?'&':'?') + 't=' + Date.now());
        html = await res.text();
      }
      el.innerHTML = html || `<div class=\"muted\">Failed to load ${url}</div>`;
      el.setAttribute('data-included','true');
      // After injection, ensure current subtab visibility is applied
      const group = el.previousElementSibling && el.previousElementSibling.matches('.subnav') ? el.previousElementSibling : null;
      const activeId = group ? (group.querySelector('.subtab.is-active')?.dataset.subtab || '') : '';
      if (activeId){
        document.querySelectorAll(`[data-subtab-panel^="${activeId.split('-')[0]}-"]`).forEach(p=>{
          p.classList.toggle('is-hidden', p.dataset.subtabPanel !== activeId);
        });
      }
    }catch(e){ el.innerHTML = `<div class=\"muted\">Failed to load ${url}</div>`; }
  }
  // Eagerly load all include hosts so panels exist before first click
  document.querySelectorAll('[data-include]').forEach(loadInclude);
  // Load on subtab change
  document.addEventListener('subtab:changed', (e)=>{
    const id = e.detail?.id || '';
    const prefix = id.split('-')[0];
    const hostId = ({ recv:'recvPanels', cf:'cfPanels', pay:'payPanels', projects:'projectsPanels', service:'servicePanels', compliance:'compliancePanels' })[prefix];
    if (hostId){ const host = document.getElementById(hostId); if (host) loadInclude(host); }
  });
})();

// ---------------- Receivables: Configuration UI ------------------
(function initRecvConfig(){
  const panel = () => document.querySelector('[data-subtab-panel="recv-config"]');
  const body = () => document.getElementById('recvCfgBody');
  const saveBanner = () => document.getElementById('recvCfgUnsaved');
  const KEY = 'ar.collections.config.v1';
  const DEFAULTS = {
    version:1, updatedAt:new Date().toISOString(),
    app:{ density:'comfortable', table:{ visibleColumns:['id','account','amount','due','status','expected','assigned','sla'], defaultSort:{field:'due', dir:'asc'} } },
    statuses:[
      { name:'Pending Contact', key:'pending', type:'active', colorToken:'--primary-200', visible:true },
      { name:'Contacted', key:'contacted', type:'active', colorToken:'--accent-sky', visible:true },
      { name:'Promised Payment', key:'promised', type:'active', colorToken:'--accent-yellow', visible:true },
      { name:'Overdue', key:'overdue', type:'active', colorToken:'--accent-coral', visible:true },
      { name:'Escalated', key:'escalated', type:'escalation', colorToken:'--accent-pink', visible:true },
      { name:'Paid', key:'paid', type:'terminal', colorToken:'--accent-green', visible:true }
    ],
    tags:[ {label:'High Value', key:'highValue', colorToken:'--accent-pink'}, {label:'First Contact', key:'firstContact'} ],
    templates:[ {name:'Call Attempt', key:'call', category:'Call', body:'Called {{account}} regarding {{invoice}}; no answer, voicemail left with callback number.', hotkey:'Ctrl+1'}, {name:'Promise to Pay', key:'promise', category:'Note', body:'{{account}} promised to pay {{amount}} for {{invoice}} by {{expected}}.', hotkey:'Ctrl+2'}],
    sla:{ defaultHours:4, rules:[ { if:{ amountGte:10000 }, hours:2, label:'High amount' }, { if:{ tagIncludes:'highValue' }, hours:2, label:'High value' } ] }
  };
  function getCfg(){ try{ return JSON.parse(localStorage.getItem(KEY)||'')||DEFAULTS; }catch{return DEFAULTS;} }
  function setCfg(cfg){ const out = { ...cfg, version:1, updatedAt:new Date().toISOString() }; localStorage.setItem(KEY, JSON.stringify(out)); return out; }
  let cfg = getCfg(); let dirty=false; const markDirty=()=>{ dirty=true; saveBanner()?.style && (saveBanner().style.display='block'); };

  function renderNav(){ const nav = document.getElementById('recvCfgNav'); if(!nav) return; nav.querySelectorAll('[data-cfg-page]').forEach(btn=>{ btn.addEventListener('click', ()=>{ nav.querySelectorAll('[data-cfg-page]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderPage(btn.dataset.cfgPage); }); }); nav.querySelector('[data-cfg-page]')?.click(); }

  function colorTokenChip(token){ const el = document.createElement('span'); el.className='cfg-chip'; const sw = document.createElement('span'); sw.className='cfg-token'; sw.style.background = getComputedStyle(document.body).getPropertyValue(token)||'#eee'; el.appendChild(sw); el.appendChild(document.createTextNode(' '+token)); return el.outerHTML; }

  function renderStatuses(){
    const b = body(); if(!b) return;
    const rows = cfg.statuses.map((s,i)=>`
      <tr>
        <td><div class="cfg-row-actions"><button class="mini-btn" data-up=${i}>↑</button><button class="mini-btn" data-down=${i}>↓</button></div></td>
        <td><input data-edit="name" data-idx=${i} value="${s.name}" style="width:140px"></td>
        <td><input data-edit="key" data-idx=${i} value="${s.key}" style="width:120px"></td>
        <td>
          <select data-edit="type" data-idx=${i}>
            <option ${s.type==='active'?'selected':''}>active</option>
            <option ${s.type==='terminal'?'selected':''}>terminal</option>
            <option ${s.type==='escalation'?'selected':''}>escalation</option>
          </select>
        </td>
        <td>
          <select data-edit="colorToken" data-idx=${i}>
            ${['--primary-200','--accent-sky','--accent-yellow','--accent-coral','--accent-pink','--accent-green'].map(t=>`<option value="${t}" ${s.colorToken===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </td>
        <td><input type="checkbox" data-edit="visible" data-idx=${i} ${s.visible?'checked':''}></td>
        <td>${colorTokenChip(s.colorToken)}</td>
        <td><button class="mini-btn" data-del=${i}>Delete</button></td>
      </tr>`).join('');
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>Statuses</h3><div><button class="mini-btn" id="stAdd">+ New</button><button class="mini-btn" id="stReset">Reset Defaults</button></div></div>
      <table class="cfg-table"><thead><tr><th></th><th>Name</th><th>Key</th><th>Type</th><th>Color</th><th>Visible</th><th>Preview</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    b.querySelector('#stAdd')?.addEventListener('click', ()=>{ cfg.statuses.push({name:'New', key:'new', type:'active', colorToken:'--primary-200', visible:true}); markDirty(); renderStatuses(); });
    b.querySelector('#stReset')?.addEventListener('click', ()=>{ if(confirm('Reset statuses to defaults?')){ cfg.statuses = DEFAULTS.statuses.map(x=>({...x})); markDirty(); renderStatuses(); } });
    b.querySelectorAll('[data-edit]').forEach(inp=> inp.addEventListener('input', (e)=>{ const i=+inp.dataset.idx; const k=inp.dataset.edit; let v=inp.type==='checkbox'?inp.checked:inp.value; cfg.statuses[i][k]=v; markDirty(); if(k==='colorToken') renderStatuses(); }));
    b.querySelectorAll('[data-del]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.del; cfg.statuses.splice(i,1); markDirty(); renderStatuses(); }));
    b.querySelectorAll('[data-up]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.up; if(i>0){ const t=cfg.statuses[i]; cfg.statuses[i]=cfg.statuses[i-1]; cfg.statuses[i-1]=t; markDirty(); renderStatuses(); } }));
    b.querySelectorAll('[data-down]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.down; if(i<cfg.statuses.length-1){ const t=cfg.statuses[i]; cfg.statuses[i]=cfg.statuses[i+1]; cfg.statuses[i+1]=t; markDirty(); renderStatuses(); } }));
  }

  function renderTemplates(){
    const b = body(); if(!b) return; const list = cfg.templates;
    const rows = list.map((t,i)=>`
      <tr>
        <td><input data-tf="name" data-idx=${i} value="${t.name}" style="width:160px"></td>
        <td><input data-tf="key" data-idx=${i} value="${t.key}" style="width:120px"></td>
        <td><select data-tf="category" data-idx=${i}><option ${t.category==='Call'?'selected':''}>Call</option><option ${t.category==='Email'?'selected':''}>Email</option><option ${t.category==='Note'?'selected':''}>Note</option><option ${t.category==='Follow-up'?'selected':''}>Follow-up</option></select></td>
        <td><input data-tf="hotkey" data-idx=${i} value="${t.hotkey||''}" style="width:110px" placeholder="Ctrl+1"></td>
        <td><textarea data-tf="body" data-idx=${i} rows="2" style="width:100%">${t.body||''}</textarea></td>
        <td><button class="mini-btn" data-t-del=${i}>Delete</button></td>
      </tr>`).join('');
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>Note Templates</h3><div><button class="mini-btn" id="tplAdd">+ New</button><button class="mini-btn" id="tplReset">Reset Defaults</button></div></div>
      <div class="cfg-grid"><div>Tokens: {{account}}, {{invoice}}, {{amount}}, {{expected}}, {{due}}</div>
      <table class="cfg-table"><thead><tr><th>Name</th><th>Key</th><th>Category</th><th>Hotkey</th><th>Body</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    b.querySelector('#tplAdd')?.addEventListener('click', ()=>{ list.push({name:'New Template', key:'new', category:'Note', body:'', hotkey:''}); markDirty(); renderTemplates(); });
    b.querySelector('#tplReset')?.addEventListener('click', ()=>{ if(confirm('Reset templates to defaults?')){ cfg.templates = DEFAULTS.templates.map(x=>({...x})); markDirty(); renderTemplates(); } });
    b.querySelectorAll('[data-tf]').forEach(el=> el.addEventListener('input', ()=>{ const i=+el.dataset.idx; const k=el.dataset.tf; list[i][k] = el.type==='checkbox'?el.checked:el.value; markDirty(); }));
    b.querySelectorAll('[data-t-del]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.tDel; list.splice(i,1); markDirty(); renderTemplates(); }));
  }

  function renderTags(){
    const b = body(); if(!b) return; const list = cfg.tags;
    const rows = list.map((t,i)=>`
      <tr>
        <td><input data-tag="label" data-idx=${i} value="${t.label}" style="width:160px"></td>
        <td><input data-tag="key" data-idx=${i} value="${t.key}" style="width:140px"></td>
        <td><select data-tag="colorToken" data-idx=${i}><option value="">(none)</option>${['--accent-pink','--accent-sky','--accent-green','--accent-yellow','--accent-coral'].map(c=>`<option value="${c}" ${t.colorToken===c?'selected':''}>${c}</option>`).join('')}</select></td>
        <td>${t.colorToken?colorTokenChip(t.colorToken):''}</td>
        <td><button class="mini-btn" data-tag-del=${i}>Delete</button></td>
      </tr>`).join('');
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>Tags</h3><div><button class="mini-btn" id="tagAdd">+ New</button><button class="mini-btn" id="tagReset">Reset Defaults</button></div></div>
      <table class="cfg-table"><thead><tr><th>Label</th><th>Key</th><th>Color</th><th>Preview</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    b.querySelector('#tagAdd')?.addEventListener('click', ()=>{ list.push({label:'New Tag', key:'newTag'}); markDirty(); renderTags(); });
    b.querySelector('#tagReset')?.addEventListener('click', ()=>{ if(confirm('Reset tags to defaults?')){ cfg.tags = DEFAULTS.tags.map(x=>({...x})); markDirty(); renderTags(); } });
    b.querySelectorAll('[data-tag]').forEach(el=> el.addEventListener('input', ()=>{ const i=+el.dataset.idx; const k=el.dataset.tag; list[i][k] = el.value; markDirty(); renderTags(); }));
    b.querySelectorAll('[data-tag-del]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.tagDel; list.splice(i,1); markDirty(); renderTags(); }));
  }

  function renderSla(){
    const b = body(); if(!b) return; const s = cfg.sla;
    const rules = s.rules.map((r,i)=>`
      <tr>
        <td><select data-sla-cond data-idx=${i}><option ${r.if.amountGte!=null?'selected':''} value="amountGte">amount >=</option><option ${r.if.tagIncludes!=null?'selected':''} value="tagIncludes">tag includes</option></select></td>
        <td><input data-sla-val data-idx=${i} value="${r.if.amountGte ?? r.if.tagIncludes ?? ''}" style="width:140px"></td>
        <td><input type="number" min="0" data-sla-hours data-idx=${i} value="${r.hours}" style="width:100px"></td>
        <td><input data-sla-label data-idx=${i} value="${r.label||''}" style="width:160px"></td>
        <td><button class="mini-btn" data-sla-del=${i}>Delete</button></td>
      </tr>`).join('');
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>SLA Rules</h3></div>
      <div class="cfg-row"><label>Default Hours</label><input type="number" min="0" id="slaDefault" value="${s.defaultHours}" style="width:120px"></div>
      <table class="cfg-table" style="margin-top:8px"><thead><tr><th>Condition</th><th>Value</th><th>Hours</th><th>Label</th><th></th></tr></thead><tbody>${rules}</tbody></table>
      <div style="margin-top:6px"><button class="mini-btn" id="slaAdd">+ Rule</button></div>
    </div>`;
    b.querySelector('#slaDefault')?.addEventListener('input', (e)=>{ cfg.sla.defaultHours = parseInt(e.target.value||'0',10); markDirty(); });
    b.querySelector('#slaAdd')?.addEventListener('click', ()=>{ cfg.sla.rules.push({ if:{ amountGte:0 }, hours:1, label:'' }); markDirty(); renderSla(); });
    b.querySelectorAll('[data-sla-del]').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.slaDel; cfg.sla.rules.splice(i,1); markDirty(); renderSla(); }));
    b.querySelectorAll('[data-sla-cond]').forEach(sel=> sel.addEventListener('change', ()=>{ const i=+sel.dataset.idx; const v=sel.value; const cur = cfg.sla.rules[i]; cur.if = v==='amountGte'?{amountGte:0}:{tagIncludes:''}; markDirty(); renderSla(); }));
    b.querySelectorAll('[data-sla-val]').forEach(inp=> inp.addEventListener('input', ()=>{ const i=+inp.dataset.idx; const cur = cfg.sla.rules[i]; if(cur.if.amountGte!=null) cur.if.amountGte = parseFloat(inp.value||'0'); else cur.if.tagIncludes = inp.value; markDirty(); }));
    b.querySelectorAll('[data-sla-hours]').forEach(inp=> inp.addEventListener('input', ()=>{ const i=+inp.dataset.idx; cfg.sla.rules[i].hours = parseInt(inp.value||'0',10); markDirty(); }));
    b.querySelectorAll('[data-sla-label]').forEach(inp=> inp.addEventListener('input', ()=>{ const i=+inp.dataset.idx; cfg.sla.rules[i].label = inp.value; markDirty(); }));
  }

  function renderDisplay(){
    const b = body(); if(!b) return; const app = cfg.app;
    const cols = ['id','account','amount','due','status','expected','assigned','sla'];
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>Display & Density</h3></div>
      <div class="cfg-row"><label>Density</label><div><label><input type="radio" name="dens" value="comfortable" ${app.density!=='compact'?'checked':''}> Comfortable</label> &nbsp; <label><input type="radio" name="dens" value="compact" ${app.density==='compact'?'checked':''}> Compact</label></div></div>
      <div class="cfg-row"><label>Visible Columns</label><div>${cols.map(c=>`<label style=\"margin-right:10px\"><input type=\"checkbox\" data-col value=\"${c}\" ${app.table.visibleColumns.includes(c)?'checked':''}> ${c}</label>`).join('')}</div></div>
      <div class="cfg-row"><label>Default Sort</label><div><select id="sortField">${cols.map(c=>`<option ${app.table.defaultSort.field===c?'selected':''}>${c}</option>`).join('')}</select> <select id="sortDir"><option ${app.table.defaultSort.dir==='asc'?'selected':''}>asc</option><option ${app.table.defaultSort.dir==='desc'?'selected':''}>desc</option></select></div></div>
    </div>`;
    b.querySelectorAll('input[name="dens"]').forEach(r=> r.addEventListener('change', ()=>{ app.density = b.querySelector('input[name="dens"]:checked').value; markDirty(); }));
    b.querySelectorAll('[data-col]').forEach(cb=> cb.addEventListener('change', ()=>{
      const set = new Set(app.table.visibleColumns); if(cb.checked) set.add(cb.value); else set.delete(cb.value); app.table.visibleColumns = Array.from(set); markDirty();
    }));
    b.querySelector('#sortField')?.addEventListener('change', ()=>{ app.table.defaultSort.field = b.querySelector('#sortField').value; markDirty(); });
    b.querySelector('#sortDir')?.addEventListener('change', ()=>{ app.table.defaultSort.dir = b.querySelector('#sortDir').value; markDirty(); });
  }

  function renderIO(){
    const b = body(); if(!b) return; const json = JSON.stringify(cfg, null, 2);
    b.innerHTML = `<div class="panel"><div class="panel-header"><h3>Import / Export</h3></div>
      <div class="cfg-grid">
        <div><button class="mini-btn" id="cfgExport">Export JSON</button></div>
        <textarea id="cfgPaste" rows="10" style="width:100%" placeholder="Paste config JSON here to import"></textarea>
        <div><button class="mini-btn" id="cfgImport">Import</button></div>
      </div>
    </div>`;
    b.querySelector('#cfgExport')?.addEventListener('click', ()=>{ const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='collections_config.json'; a.click(); URL.revokeObjectURL(a.href); });
    b.querySelector('#cfgImport')?.addEventListener('click', ()=>{ try{ const obj=JSON.parse(b.querySelector('#cfgPaste').value||'{}'); cfg = setCfg(obj); dirty=false; saveBanner()?.style && (saveBanner().style.display='none'); alert('Imported configuration'); }catch(e){ alert('Invalid JSON'); } });
  }

  function renderPage(page){ if(!panel()) return; if(page==='statuses') renderStatuses(); if(page==='templates') renderTemplates(); if(page==='tags') renderTags(); if(page==='sla') renderSla(); if(page==='display') renderDisplay(); if(page==='io') renderIO(); }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('#recvCfgSave'); if(btn){ cfg = setCfg(cfg); dirty=false; saveBanner()?.style && (saveBanner().style.display='none'); }
    const disc = e.target.closest('#recvCfgDiscard'); if(disc){ cfg = getCfg(); dirty=false; saveBanner()?.style && (saveBanner().style.display='none'); renderNav(); }
  });

  // boot when panel exists (after partial injection)
  const boot = ()=>{ if(panel()) renderNav(); };
  if(panel()) boot();
  document.addEventListener('subtab:changed', (e)=>{ if((e.detail?.id||'')==='recv-config') boot(); });
})();
  function createWidgetEl(w){
    const id = w.id; const el = document.createElement('div');
    el.className = `widget-card size-${w.size||'xs'}`; el.dataset.id=id; el.dataset.type=w.type; el.dataset.size=w.size||'xs'; el.dataset.orient=w.orient||'';
    applySpans(el);
    el.innerHTML = `<div class=\"widget-head\"><div class=\"widget-title\"><svg class=\"widget-glyph\" viewBox=\"0 0 24 24\"><use href=\"${iconFor(w.type)}\"/></svg>${titleFor(w.type)}</div><div class=\"widget-actions\"><button class=\"mini-btn\" data-open-settings>Settings</button><button class=\"mini-btn\" data-size>Size</button></div></div><div class=\"widget-body\">${renderBody(w.type,id)}</div>`;
    return el;
  }

  let layout; try{ layout = JSON.parse(localStorage.getItem(LS_KEY)||'null'); } catch { layout=null; }
  if(!Array.isArray(layout) || layout.length===0){ layout = [ {id:uid(), type:'kpi', size:'xs'}, {id:uid(), type:'metrics', size:'s'}, {id:uid(), type:'notes', size:'xs'} ]; }
  grid.innerHTML=''; layout.forEach(w=>{ if(!w.orient) w.orient=defaultOrientFor(w.size)||''; grid.appendChild(createWidgetEl(w)); });

  function saveLayout(){ const items = Array.from(grid.querySelectorAll('.widget-card')).map(el=>({id:el.dataset.id, type:el.dataset.type, size:el.dataset.size, orient:el.dataset.orient||''})); localStorage.setItem(LS_KEY, JSON.stringify(items)); }

  function setEditing(on){
    const onb = !!on;
    grid.classList.toggle('is-editing', onb);
    // Toggle both global and scoped classes so CSS visuals work
    document.body.classList.toggle('widgets-editing', onb);
    document.body.classList.toggle(`widgets-editing--${scope}`, onb);
    if (addBtn) { addBtn.disabled = !onb; addBtn.title = onb ? 'Add Widget' : 'Add Widget (edit mode only)'; }
    if (editBtn) { editBtn.classList.toggle('active', onb); editBtn.textContent = onb ? '✓' : '✎'; editBtn.title = onb ? 'Done' : 'Customize Widgets'; }
    if (badge) badge.setAttribute('aria-hidden', onb ? 'false' : 'true');
    grid.querySelectorAll('.widget-card').forEach(el=>{ el.setAttribute('draggable', onb ? 'true' : 'false'); el.tabIndex = onb ? 0 : -1; });
  }
  setEditing(false);
  editBtn.addEventListener('click', ()=> setEditing(!grid.classList.contains('is-editing')));
  addBtn.addEventListener('click', ()=>{
    if (!grid.classList.contains('is-editing')) { setEditing(true); }
    if (sideGallery){ sideGallery.classList.remove('is-hidden'); sideGallery.setAttribute('aria-hidden','false'); document.body.classList.add('widgets-gallery-open'); }
  });
  document.getElementById('widgetGalleryClose')?.addEventListener('click', ()=>{ if(sideGallery){ sideGallery.classList.add('is-hidden'); document.body.classList.remove('widgets-gallery-open'); } });
  if (sideGallery){ sideGallery.addEventListener('click', (e)=>{ const btn=e.target.closest('[data-add-widget]'); if(!btn) return; const type=btn.getAttribute('data-add-widget'); const data={id:uid(), type, size:'s', orient: defaultOrientFor('s')||'landscape'}; const el=createWidgetEl(data); grid.appendChild(el); saveLayout(); setEditing(true); }); }

  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-size]'); if(btn){ const card = btn.closest('.widget-card'); if(!card) return; const sizes=['xs','s','m','l','xl','xxl']; const cur=(card.dataset.size||'xs').toLowerCase(); const idx=(sizes.indexOf(cur)+1)%sizes.length; card.classList.remove('size-'+cur); const ns=sizes[idx]; card.classList.add('size-'+ns); card.dataset.size=ns; if(['xs','m','xxl'].includes(ns)) card.dataset.orient=''; applySpans(card); saveLayout(); return; }
    const setBtn2 = e.target.closest('[data-open-settings]'); if(setBtn2){ const card = setBtn2.closest('.widget-card'); if(!card) return; if (typeof openSettings === 'function') openSettings(setBtn2, card); }
  });

  // Simple drag to reorder
  let dragging=null; grid.addEventListener('dragstart', e=>{ if(!grid.classList.contains('is-editing')) return e.preventDefault(); dragging=e.target.closest('.widget-card'); if(dragging){ e.dataTransfer.setData('text/plain', dragging.dataset.id); dragging.classList.add('dragging'); } });
  grid.addEventListener('dragend', ()=>{ if(dragging){ dragging.classList.remove('dragging'); dragging=null; saveLayout(); } });
  grid.addEventListener('dragover', e=>{ if(!grid.classList.contains('is-editing')) return; e.preventDefault(); const after=[...grid.querySelectorAll('.widget-card:not(.dragging)')].find(el=> e.clientY <= el.getBoundingClientRect().top + el.offsetHeight/2 ); const card=dragging; if(!card) return; if(after==null) grid.appendChild(card); else grid.insertBefore(card, after); });

  // Persist notes per-scope
  grid.querySelectorAll('.notes-area').forEach(ta=>{ const key=ta.dataset.notesKey; try{ ta.value = localStorage.getItem(key)||''; }catch{} ta.addEventListener('input', ()=>{ try{ localStorage.setItem(key, ta.value||''); }catch{} }); });
}

// Neutralize dummy anchors so the URL doesn't become index.html#
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href="#"]');
  if (a) {
    e.preventDefault();
    e.stopPropagation();
  }
});

// ------------------------------ Service Tabs (Codepen port) ----------------
/* ──────────────────────────────────────────────────────────────
   Service: WIP, Billing, T&M, Pricing, Rules
   Soft-Glass, localStorage-backed, zero external deps
   IDs used are the ones in your index.html panel blocks
   ────────────────────────────────────────────────────────────── */

function initServiceTabs() {
  // ---------- Config (importer) ----------
  const IMPORTER = {
    mode: 'none', // 'none' | 'gas'
    gasUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
  };
  try {
    const mb = document.getElementById('modeBadge');
    if (mb) mb.textContent = `Importer: ${IMPORTER.mode}`;
  } catch {}

  // ---------- Utilities ----------
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = s => String(s ?? '');
  const csvCell = s => {
    s = String(s ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  function showToast(message, type) {
    const c = ensureToastContainer();
    const t = document.createElement('div'); t.className = 'toast ' + (type || 'info'); t.textContent = message;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 350); }, 2000);
  }
  function ensureToastContainer() {
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-atomic', 'true');
      Object.assign(c.style, { position: 'fixed', right: '16px', bottom: '16px', display: 'grid', gap: '8px', zIndex: 99999 });
      document.body.appendChild(c);
    }
    return c;
  }
  const persist = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const restore = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
  const setUndo = (text, action) => {
    const bar = $('#undoBar'); if (!bar) return action && action();
    $('#undoText').textContent = text;
    bar.classList.add('show');
    $('#undoBtn').onclick = () => { bar.classList.remove('show'); action && action(); };
    setTimeout(() => bar.classList.remove('show'), 5000);
  };

  // ---------- Pricing Engine ----------
  const PRK = 'svc.pricing.v1';
  const Pricing = {
    data: restore(PRK, {
      base: { "MAT-1001": 45, "MAT-2200": 25, "MAT-3000": 120, "MAT-1100": 18 },
      rules: [{ type: 'rep', key: '@jane', sku: '*', labor: 100, drive: 40 }, { type: 'customer', key: 'Acme Corp', sku: 'MAT-1001', price: 49 }],
      defaults: { labor: 95, drive: 35 }
    }),
    save() { persist(PRK, this.data); },
    rates({ customer = null, rep = null }) {
      const out = { ...this.data.defaults };
      const rr = this.data.rules.find(r => r.type === 'rep' && r.key === rep);
      const rc = this.data.rules.find(r => r.type === 'customer' && r.key === customer);
      if (rr) { if (rr.labor != null) out.labor = rr.labor; if (rr.drive != null) out.drive = rr.drive; }
      if (rc) { if (rc.labor != null) out.labor = rc.labor; if (rc.drive != null) out.drive = rc.drive; }
      return out;
    },
    matPrice({ sku, customer = null, rep = null }) {
      let rule = this.data.rules.find(r => r.type === 'customer' && r.key === customer && r.sku === sku && r.price != null)
        || this.data.rules.find(r => r.type === 'rep' && r.key === rep && r.sku === sku && r.price != null)
        || this.data.rules.find(r => r.type === 'customer' && r.key === customer && r.sku === '*' && r.price != null)
        || this.data.rules.find(r => r.type === 'rep' && r.key === rep && r.sku === '*' && r.price != null);
      return rule ? rule.price : (this.data.base[sku] ?? 50);
    }
  };

  // ---------- Service State ----------
  const WIP_KEY = 'svc.wip.state.v1';
  const COLS_KEY = 'svc.wip.cols.v1';
  const VIEWS_KEY = 'svc.views.v1';
  const REVIEWS_KEY = 'svc.review.views.v1';

  const defaults = {
    columns: ["Pending", "Sales Review", "Approved", "Paid", "Rejected"],
    records: [
      rec({ id: "INV-1001", channel: "#jobs-acme-348", requester: "@alex", customer: "Acme Corp", rep: "@sara",
        techs: ["@sam", "@jo"], drive: 3, labor: 7,
        mats: [{ sku: "MAT-1001", desc: '1" PVC Coupling', qty: 4, unit: "ea" }, { sku: "MAT-2200", desc: 'Sealant', qty: 2, unit: "tube" }],
        scope: "Replace leaking PVC couplings at RTU.", notes: "Urgent", status: "Pending"
      }),
      rec({ id: "INV-1002", channel: "#jobs-beta-992", requester: "@jane", customer: "Beta LLC", rep: "@jane",
        techs: ["@lee"], drive: 1.5, labor: 2, mats: [{ sku: "MAT-3000", desc: "Thermostat", qty: 1, unit: "ea" }],
        scope: "Replace faulty thermostat and recalibrate.", notes: "", status: "Sales Review",
        salesEdits: { salesPrice: 980, credits: 0, billTo: "Beta LLC, 3 Harbor Way", shipTo: "Beta Plant, Dock 2", detail: "line_with_prices", customerNotes: "Net 15", internalNotes: "Bundle with PO 8892.", attachments: [] }
      })
    ],
    tm: []
  };
  const state = restore(WIP_KEY, defaults);
  state.columns = restore(COLS_KEY, state.columns);
  const views = restore(VIEWS_KEY, {});        // {name: {wipSearch}}
  const reviewViews = restore(REVIEWS_KEY, {}); // {name: {revSearch}}

  function rec(o) { return { ...o, log: [`Submitted via Slack form in ${o.channel}`] }; }
  function estimateTotal(r) {
    const rt = Pricing.rates({ customer: r.customer, rep: r.rep });
    const mats = r.mats.reduce((s, m) => s + m.qty * Pricing.matPrice({ sku: m.sku, customer: r.customer, rep: r.rep }), 0);
    return r.labor * rt.labor + r.drive * rt.drive + mats;
  }
  const fmatch = q => {
    q = (q || '').toLowerCase().trim();
    return r => !q || [r.id, r.channel, r.customer, r.rep, r.scope, r.status].join(' ').toLowerCase().includes(q);
  };

  // ---------- WIP (Kanban) ----------
  bind('#wip-search', 'input', renderWip);
  bind('#wip-new', 'click', () => {
    const id = "INV-" + Math.floor(2000 + Math.random() * 800);
    const recX = rec({
      id, channel: "#jobs-acme-348", requester: "@ana", customer: "Acme Corp", rep: "@sara",
      techs: ["@tech1"], drive: +(Math.random() * 3).toFixed(1), labor: +(2 + Math.random() * 6).toFixed(1),
      mats: [{ sku: "MAT-1001", desc: 'PVC union', qty: 2, unit: "ea" }], scope: "Auto scope", notes: "", status: "Pending"
    });
    state.records.unshift(recX); persist(WIP_KEY, state); renderWip();
  });
  bind('#wip-move', 'click', () => {
    const q = $('#wip-search')?.value || '';
    const target = $('#wip-move-target')?.value || 'Sales Review';
    const rows = state.records.filter(fmatch(q));
    const snapshot = rows.map(r => ({ id: r.id, prev: r.status }));
    rows.forEach(r => { r.status = target; r.log.push(`Bulk moved → ${target}`); });
    persist(WIP_KEY, state); renderWip(); renderBilling();
    showToast(`Moved ${rows.length} item(s) → ${target}`);
    setUndo(`Bulk moved ${rows.length}`, () => {
      snapshot.forEach(s => { const r = state.records.find(x => x.id === s.id); if (r) r.status = s.prev; });
      persist(WIP_KEY, state); renderWip(); renderBilling();
    });
  });

  function renderWip() {
    const board = $('#wip-board'); if (!board) return;
    board.innerHTML = '';
    state.columns.forEach(col => {
      const wrap = document.createElement('div');
      wrap.className = 'kcol'; wrap.dataset.col = col;
      wrap.innerHTML = `<div class="khead" draggable="true"><span>${col}</span><span class="handle">⋮⋮</span></div><div class="kbody" data-drop="${col}" role="list"></div>`;
      const head = wrap.querySelector('.khead');
      head.addEventListener('dragstart', e => { e.dataTransfer.setData('text/col', col); wrap.classList.add('dragging-col'); });
      head.addEventListener('dragend', () => wrap.classList.remove('dragging-col'));
      wrap.addEventListener('dragover', e => { if (e.dataTransfer.getData('text/col')) { e.preventDefault(); wrap.classList.add('drag-hot'); } });
      wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-hot'));
      wrap.addEventListener('drop', e => {
        const moved = e.dataTransfer.getData('text/col'); wrap.classList.remove('drag-hot');
        if (!moved || moved === col) return;
        const order = state.columns.slice(); const from = order.indexOf(moved), to = order.indexOf(col);
        const prev = state.columns.slice();
        order.splice(to, 0, ...order.splice(from, 1)); state.columns = order; persist(COLS_KEY, order); renderWip();
        setUndo(`Moved column ${moved} → ${col}`, () => { state.columns = prev; persist(COLS_KEY, prev); renderWip(); });
      });

      const body = wrap.querySelector('.kbody');
      body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('drop-hot'); });
      body.addEventListener('dragleave', () => body.classList.remove('drop-hot'));
      body.addEventListener('drop', e => {
        e.preventDefault(); body.classList.remove('drop-hot');
        const id = e.dataTransfer.getData('text/plain'); const rec = state.records.find(r => r.id === id);
        if (!rec || rec.status === col) return;
        const prev = rec.status; rec.status = col; rec.log.push(`Moved to ${col} (Kanban)`);
        persist(WIP_KEY, state); renderWip(); renderBilling(rec.id);
        setUndo(`Moved ${rec.id} → ${col}`, () => { rec.status = prev; persist(WIP_KEY, state); renderWip(); renderBilling(rec.id); });
      });

      state.records.filter(r => r.status === col).filter(fmatch($('#wip-search')?.value)).forEach(r => {
        const card = document.createElement('div');
        card.className = 'kcard'; card.draggable = true; card.dataset.id = r.id; card.tabIndex = 0;
        card.innerHTML = `<div class="top"><strong>${r.id}</strong><span class="sml">$${estimateTotal(r).toFixed(2)}</span></div>
          <div class="meta">${esc(r.channel)} • ${esc(r.requester)}</div>
          <div class="kchips"><span class="badge">${r.techs.length} tech(s)</span><span class="badge">${r.mats.length} material(s)</span></div>
          <div class="actions"><button class="btn" data-open>Open</button><button class="btn" data-remind>Remind</button></div>`;
        card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dblclick', () => { openBillingDetail(r); jumpServiceTab('service-billing'); });
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter') { openBillingDetail(r); jumpServiceTab('service-billing'); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const idx = state.columns.indexOf(r.status);
            const next = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(state.columns.length - 1, idx + 1);
            if (next !== idx) {
              const prev = r.status; r.status = state.columns[next]; r.log.push(`Moved to ${r.status} (keyboard)`);
              persist(WIP_KEY, state); renderWip(); renderBilling(r.id);
              setUndo(`Moved ${r.id} → ${r.status}`, () => { r.status = prev; persist(WIP_KEY, state); renderWip(); renderBilling(r.id); });
            }
          }
        });
        card.querySelector('[data-open]').onclick = () => { openBillingDetail(r); jumpServiceTab('service-billing'); };
        card.querySelector('[data-remind]').onclick = () => { r.log.push('Reminder sent'); persist(WIP_KEY, state); showToast('Reminder sent'); };
        body.appendChild(card);
      });
      board.appendChild(wrap);
    });

    // Saved views (WIP)
    $('#view-save')?.addEventListener('click', () => {
      const name = $('#view-name')?.value.trim();
      if (!name) return showToast('Name your view');
      views[name] = { wipSearch: $('#wip-search')?.value || '' };
      persist(VIEWS_KEY, views); refreshViewPickers();
      showToast('WIP view saved');
    });
    $('#view-del')?.addEventListener('click', () => {
      const name = $('#view-select')?.value;
      if (!name) return;
      delete views[name]; persist(VIEWS_KEY, views); refreshViewPickers(); renderWip();
      showToast('WIP view deleted');
    });
    $('#view-select')?.addEventListener('change', () => {
      const name = $('#view-select')?.value; if (!name) return;
      $('#wip-search').value = views[name]?.wipSearch || ''; renderWip();
    });
  }

  function refreshViewPickers() {
    const vs = $('#view-select'); if (vs) vs.innerHTML = '<option value="">Views…</option>' + Object.keys(views).map(n => `<option>${esc(n)}</option>`).join('');
    const rs = $('#revview-select'); if (rs) rs.innerHTML = '<option value="">Views…</option>' + Object.keys(reviewViews).map(n => `<option>${esc(n)}</option>`).join('');
  }

  const jumpServiceTab = (panelKey) => {
    // Call your existing subtab system
    const btn = document.querySelector(`.subnav:not(.is-hidden) .subtab[data-subtab="${panelKey}"]`)
      || document.querySelector(`.subnav .subtab[data-subtab="${panelKey}"]`);
    btn?.click?.();
    // Fallback: toggle panels directly if needed
    const p = document.querySelector(`[data-subtab-panel="${panelKey}"]`);
    if (p) {
      document.querySelectorAll('.subtab-panel').forEach(el => el.classList.add('is-hidden'));
      p.classList.remove('is-hidden');
    }
  };

  // ---------- Billing (formerly Review) ----------
  bind('#rev-search', 'input', () => renderBilling());
  bind('#rev-remind', 'click', () => {
    const ids = $$('#rev-list input[type="checkbox"]:checked').map(cb => cb.dataset.id);
    if (!ids.length) return showToast('Select items first.');
    ids.forEach(id => { const r = state.records.find(x => x.id === id); if (r) r.log.push('Reminder sent'); });
    persist(WIP_KEY, state); showToast(`Reminders sent: ${ids.length}`);
  });
  bind('#rev-apply-filtered', 'click', () => {
    const edits = collectEditsFromDetail(); if (!edits) return showToast('Open a record first in Billing.');
    const q = $('#rev-search')?.value || ''; const rows = state.records.filter(fmatch(q));
    const snap = rows.map(r => ({ id: r.id, prev: r.salesEdits ? JSON.parse(JSON.stringify(r.salesEdits)) : null, prevStatus: r.status }));
    rows.forEach(r => { r.salesEdits = JSON.parse(JSON.stringify(edits)); r.status = 'Sales Review'; r.log.push('Bulk edits applied (filtered)'); });
    persist(WIP_KEY, state); renderWip(); renderBilling();
    showToast(`Applied edits to ${rows.length} item(s)`); setUndo(`Applied to ${rows.length}`, () => {
      snap.forEach(s => { const r = state.records.find(x => x.id === s.id); if (r) { r.salesEdits = s.prev; r.status = s.prevStatus; } });
      persist(WIP_KEY, state); renderWip(); renderBilling();
    });
  });
  bind('#rev-apply-selected', 'click', () => {
    const edits = collectEditsFromDetail(); if (!edits) return showToast('Open a record first in Billing.');
    const ids = $$('#rev-list input[type="checkbox"]:checked').map(cb => cb.dataset.id); if (!ids.length) return showToast('Select rows first.');
    const rows = state.records.filter(r => ids.includes(r.id));
    const snap = rows.map(r => ({ id: r.id, prev: r.salesEdits ? JSON.parse(JSON.stringify(r.salesEdits)) : null, prevStatus: r.status }));
    rows.forEach(r => { r.salesEdits = JSON.parse(JSON.stringify(edits)); r.status = 'Sales Review'; r.log.push('Bulk edits applied (selected)'); });
    persist(WIP_KEY, state); renderWip(); renderBilling();
    showToast(`Applied edits to ${rows.length} item(s)`); setUndo(`Applied to ${rows.length}`, () => {
      snap.forEach(s => { const r = state.records.find(x => x.id === s.id); if (r) { r.salesEdits = s.prev; r.status = s.prevStatus; } });
      persist(WIP_KEY, state); renderWip(); renderBilling();
    });
  });
  bind('#rev-changes-only', 'change', () => {
    const id = $('#rev-detail strong')?.textContent?.split(' ')[0]; renderBilling(id);
  });
  bind('#rev-compose', 'click', () => {
    const id = $('#rev-detail strong')?.textContent?.split(' ')[0];
    const rec = state.records.find(r => r.id === id) || state.records[0];
    if (!rec) return showToast('Open a record first');
    openSlackComposer({ type: 'record', rec });
  });

  function renderBilling(openId) {
    const list = $('#rev-list'); if (!list) return;
    list.innerHTML = '';
    state.records.filter(fmatch($('#rev-search')?.value)).forEach(r => {
      const row = document.createElement('div');
      row.className = 'rItem';
      row.innerHTML = `<input type="checkbox" data-id="${r.id}"><div><strong>${r.id}</strong> — <span class="badge">${r.status}</span><br><span class="sml">${esc(r.channel)} • ${esc(r.customer)}</span></div>`;
      row.addEventListener('click', e => { if (e.target.type === 'checkbox') return; openBillingDetail(r); });
      list.appendChild(row);
    });
    if (openId) { const rec = state.records.find(x => x.id === openId); if (rec) openBillingDetail(rec); }
  }

  function openBillingDetail(r) {
    const d = $('#rev-detail'); if (!d) return;
    const se = r.salesEdits || {};
    const baseline = {
      salesPrice: Math.round(estimateTotal(r)), credits: 0,
      billTo: '', shipTo: '', detail: (se.detail || 'lump'),
      scope: r.scope, customerNotes: '', internalNotes: ''
    };
    const warn = [];
    const eff = se.detail || 'lump';
    if (eff === 'lump' && !(se.salesPrice > 0)) warn.push('Lump sum requires a positive Sales Price.');
    if (!se.billTo) warn.push('Bill-To is missing.');
    if (!se.shipTo) warn.push('Ship-To is missing.');
    if ((se.credits || 0) < 0) warn.push('Credits cannot be negative.');
    const canApprove = warn.length === 0;
    se.attachments = se.attachments || [];

    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div><strong>${r.id}</strong> <span class="badge">${r.status}</span> <span class="badge">${esc(r.channel)}</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="d-compose">Compose</button>
          <button class="btn" id="d-csv">Export CSV</button>
          <button class="btn" id="d-prev">Preview</button>
          <button class="btn primary" id="d-approve"${canApprove ? '' : ' disabled'}>${canApprove ? 'Apply & Approve' : 'Approve anyway (override)'}</button>
          <button class="btn" id="d-reject">Reject</button>
        </div>
      </div>

      <div class="panel tm-sections" style="margin-top:8px">
        <section class="tm-section tm-section--sub">
          <h3 class="tm-section-title">Tech Submission</h3>
          <div class="tm-kv">
            ${kv("Requester", r.requester)}${kv("Sales Rep", r.rep || "—")}
            ${kv("Techs", r.techs.join(', '))}
            ${kv("Drive Hours", r.drive)}${kv("Labor Hours", r.labor)}
          </div>
        </section>
        <section class="tm-section tm-section--mats">
          <h3 class="tm-section-title">Materials</h3>
          <div class="tm-mats">${matTable(r.mats)}</div>
        </section>
        <section class="tm-section tm-section--scope">
          <h3 class="tm-section-title">Scope</h3>
          <div class="tm-note">${esc(r.scope)}</div>
        </section>
        <section class="tm-section tm-section--log">
          <h3 class="tm-section-title">Log</h3>
          <ul class="tm-log">${r.log.map(x => `<li>${esc(x)}`).join('')}</ul>
        </section>
      </div>

      <div class="panel sales-grid" style="margin-top:8px">
        <div class="sales-card">
          <h3 class="tm-section-title">Actuals Sent for Approval</h3>
          <div class="tm-kv">
            ${kv("Sales Price", baseline.salesPrice)}
            ${kv("Credits", baseline.credits)}
            ${kv("Bill-To", baseline.billTo || '—')}
            ${kv("Ship-To", baseline.shipTo || '—')}
            ${kv("Detail", (baseline.detail || 'lump').replaceAll('_',' '))}
            ${kv("Scope", baseline.scope || '—')}
          </div>
        </div>
        <div class="sales-card">
          <h3 class="tm-section-title">Edits From Sales <span id="changedCount" class="sml"></span></h3>
          ${editRow("Sales Price","e-price", se.salesPrice ?? baseline.salesPrice, (se.salesPrice ?? baseline.salesPrice) !== baseline.salesPrice)}
          ${editRow("Credits","e-credit", se.credits ?? baseline.credits, (se.credits ?? baseline.credits) !== baseline.credits)}
          ${editRowText("Bill-To","e-bill", se.billTo ?? baseline.billTo, (se.billTo ?? baseline.billTo) !== baseline.billTo)}
          ${editRowText("Ship-To","e-ship", se.shipTo ?? baseline.shipTo, (se.shipTo ?? baseline.shipTo) !== baseline.shipTo)}
          <div class="kvM ${$('#rev-changes-only')?.checked && ((se.detail || 'lump') === 'lump') ? 'hide' : ''}">
            <div>Detail ${(se.detail || 'lump') !== 'lump' ? '<span class="badge changed">changed</span>' : ''}</div>
            <div><select id="e-detail" class="input fancy">
              <option value="lump" ${(se.detail || 'lump') === 'lump' ? 'selected' : ''}>Lump Sum</option>
              <option value="line_with_prices" ${se.detail === 'line_with_prices' ? 'selected' : ''}>Line by line (with prices)</option>
              <option value="line_no_prices" ${se.detail === 'line_no_prices' ? 'selected' : ''}>Line by line (without prices)</option>
            </select></div>
          </div>
          ${editRowArea("Scope","e-scope", se.scope ?? baseline.scope, (se.scope ?? baseline.scope) !== baseline.scope)}
          ${editRowArea("Customer Notes","e-cust", se.customerNotes ?? '', (se.customerNotes ?? '') !== '')}
          ${editRowArea("Internal Notes","e-int", se.internalNotes ?? '', (se.internalNotes ?? '') !== '')}

          <div class="attach-card">
            <h4 class="tm-mini-title">Attachments</h4>
            <div id="att-list" class="sml">${se.attachments.length ? '' : 'No attachments yet.'}</div>
            <div class="att-grid">
              <input id="att-name" class="input fancy" placeholder="filename.pdf (simulate)">
              <label class="sml chk"><input id="att-include" type="checkbox" checked> Include on invoice</label>
              <label class="sml chk"><input id="att-internal" type="checkbox"> Internal only</label>
              <button class="btn" id="att-add">Add</button>
            </div>
          </div>
        </div>
      </div>`;

    // Attachments list
    drawAttList(se.attachments);
    // Changes count
    $('#changedCount').textContent = $$('#rev-detail .badge.changed').length ? `• ${$$('#rev-detail .badge.changed').length} changed` : '';

    // Apply field-level warnings instead of a banner
    try{
      const escAttr = (s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const addWarn = (id, msg)=>{
        const el = document.getElementById(id);
        if(!el) return;
        el.classList.add('needs-attn');
        el.setAttribute('aria-invalid','true');
        const flag = document.createElement('span');
        flag.className = 'attn-flag';
        flag.title = msg;
        flag.textContent = '!';
        el.insertAdjacentElement('afterend', flag);
      };
      if ((se.detail || 'lump') === 'lump' && !(se.salesPrice > 0)) addWarn('e-price', 'Lump sum requires a positive Sales Price.');
      if (!se.billTo) addWarn('e-bill', 'Bill-To is required.');
      if (!se.shipTo) addWarn('e-ship', 'Ship-To is required.');
      if ((se.credits || 0) < 0) addWarn('e-credit', 'Credits cannot be negative.');
    }catch{}

    // Wire actions
    $('#d-compose').onclick = () => openSlackComposer({ type: 'record', rec: r });
    $('#d-csv').onclick = () => exportRecordCSV(r, true);
    $('#d-prev').onclick = () => openPreview(r, collectEdits());
    $('#d-approve').onclick = () => {
      r.salesEdits = collectEdits(); const prev = r.status; r.status = 'Approved'; r.log.push('Applied sales edits');
      persist(WIP_KEY, state); renderWip(); renderBilling(r.id); showToast('Approved');
      setUndo(`${r.id} approved`, () => { r.status = prev; persist(WIP_KEY, state); renderWip(); renderBilling(r.id); });
    };
    $('#d-reject').onclick = () => {
      r.salesEdits = collectEdits(); const prev = r.status; r.status = 'Rejected'; r.log.push('Rejected');
      persist(WIP_KEY, state); renderWip(); renderBilling(r.id); showToast('Rejected');
      setUndo(`${r.id} rejected`, () => { r.status = prev; persist(WIP_KEY, state); renderWip(); renderBilling(r.id); });
    };
    $('#rev-changes-only').onchange = () => openBillingDetail(r);
    $('#att-add').onclick = () => {
      const name = $('#att-name').value.trim(); if (!name) return showToast('Enter a file name');
      const item = { name, include: $('#att-include').checked, internal: $('#att-internal').checked };
      se.attachments.push(item); drawAttList(se.attachments); $('#att-name').value = '';
    };

    function drawAttList(arr) {
      const host = $('#att-list'); host.innerHTML = '';
      if (!arr.length) { host.textContent = 'No attachments yet.'; return; }
      arr.forEach((a, i) => {
        const row = document.createElement('div'); row.className = 'sml'; row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center';
        row.innerHTML = `<span class="badge">${esc(a.name)}</span>
          <label><input type="checkbox" ${a.include ? 'checked' : ''} data-k="include"> include</label>
          <label><input type="checkbox" ${a.internal ? 'checked' : ''} data-k="internal"> internal</label>
          <button class="btn" data-del="${i}">Remove</button>`;
        row.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.onchange = () => { a[cb.dataset.k] = cb.checked; });
        row.querySelector('[data-del]').onclick = () => { arr.splice(i, 1); drawAttList(arr); };
        host.appendChild(row);
      });
    }
    function collectEdits() {
      return {
        salesPrice: +$('#e-price').value || 0, credits: +$('#e-credit').value || 0,
        billTo: $('#e-bill').value, shipTo: $('#e-ship').value,
        detail: $('#e-detail').value, scope: $('#e-scope').value,
        customerNotes: $('#e-cust').value, internalNotes: $('#e-int').value,
        attachments: (se.attachments || []).map(a => ({ ...a }))
      };
    }
  }

  function kv(k, v) { return `<div class="kvM"><div>${esc(k)}</div><div>${esc(v)}</div></div>`; }
  function editRow(k, id, val, changed) { return `<div class="kvM"><div>${esc(k)} ${changed ? '<span class="badge changed">changed</span>' : ''}</div><div><input id="${id}" class="input mono" type="number" step="0.01" value="${esc(val)}" /></div></div>`; }
  function editRowText(k, id, val, changed) { return `<div class="kvM"><div>${esc(k)} ${changed ? '<span class="badge changed">changed</span>' : ''}</div><div><input id="${id}" class="input" value="${esc(val)}" /></div></div>`; }
  function editRowArea(k, id, val, changed) { return `<div class="kvM"><div>${esc(k)} ${changed ? '<span class="badge changed">changed</span>' : ''}</div><div><textarea id="${id}" class="input" rows="3">${esc(val)}</textarea></div></div>`; }
  function matTable(mats) {
    const rows = mats.map(m => `<tr><td>${esc(m.sku)}</td><td>${esc(m.desc)}</td><td class="mono">${m.qty}</td><td>${esc(m.unit)}</td></tr>`);
    const pad = Math.max(0, 10 - rows.length);
    for (let i=0;i<pad;i++) rows.push(`<tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td></tr>`);
    return `<table class="tableP tm-mats-table"><thead><tr><th>SKU</th><th>Desc</th><th>Qty</th><th>UOM</th></tr></thead><tbody>
      ${rows.join('')}</tbody></table>`;
  }

  // ---------- CSV export + optional GAS POST ----------
  async function postToImporter(csv) {
    if (IMPORTER.mode !== 'gas') return { ok: false, skipped: true };
    try {
      const res = await fetch(IMPORTER.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv });
      const json = await res.json().catch(() => ({}));
      return { ok: true, response: json };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  function exportRecordCSV(r, sendToo) {
    const header = "InventoryID,Qty,UOM,Location,Description\n";
    const rows = r.mats.map(m => [m.sku, m.qty, m.unit, "MAIN", m.desc].map(csvCell).join(',')).join('\n');
    const csv = header + rows + '\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${r.id}-materials.csv`; document.body.appendChild(a); a.click(); a.remove();
    showToast('CSV exported');
    if (sendToo) postToImporter(csv).then(res => { if (res.skipped) return; showToast(res.ok ? 'Importer accepted CSV' : 'Importer error'); });
  }

  function openPreview(r, opts) {
    const html = renderInvoice(r, opts);
    const body = $('#inv-body'); if (!body) return;
    body.innerHTML = html; $('#inv-modal')?.classList.add('show');
  }
  bind('#inv-modal', 'click', e => { if (e.target.id === 'inv-modal' || e.target.classList.contains('inv-close')) $('#inv-modal')?.classList.remove('show'); });

  function renderInvoice(r, opts) {
    const lines = buildLines(r, opts.detail || 'lump');
    const subtotal = (opts.detail || 'lump') === 'lump' ? Math.max(opts.salesPrice || estimateTotal(r), 0) : lines.reduce((s, l) => s + l.amount, 0);
    const total = Math.max(subtotal - (opts.credits || 0), 0);
    const att = (opts.attachments || []).filter(a => a.include && !a.internal);
    return `<div><div style="display:flex;justify-content:space-between;align-items:center"><h3>Mock Invoice — ${r.id}</h3><button class="inv-close">✕</button></div>
      <p class="sml">${esc(r.channel)} • Customer: ${esc(r.customer || '—')} • Rep: ${esc(r.rep || '—')}</p>
      ${
        (opts.detail || 'lump') === 'lump'
          ? `<table class="tableP"><thead><tr><th>Description</th><th>Qty</th><th>UOM</th><th>Price</th><th>Amount</th></tr></thead><tbody>
              <tr><td>Lump Sum — ${esc(opts.scope || r.scope)}</td><td>1</td><td>job</td><td>$${subtotal.toFixed(2)}</td><td>$${subtotal.toFixed(2)}</td></tr></tbody></table>`
          : `<table class="tableP"><thead><tr><th>Description</th><th>Qty</th><th>UOM</th><th>Price</th><th>Amount</th></tr></thead><tbody>
              ${lines.map(l => `<tr><td>${esc(l.desc)}</td><td>${l.qty}</td><td>${esc(l.uom)}</td><td>$${l.price.toFixed(2)}</td><td>$${l.amount.toFixed(2)}</td></tr>`).join('')}</tbody></table>`
      }
      <p><strong>Credits:</strong> $${(opts.credits || 0).toFixed(2)} &nbsp; <strong>Total:</strong> $${total.toFixed(2)}</p>
      ${att.length ? `<p class="sml"><strong>Attachments:</strong> ${att.map(a => esc(a.name)).join(', ')}</p>` : ''}
      <p class="sml"><strong>Customer Notes:</strong> ${esc(opts.customerNotes || '')}<br><strong>Internal:</strong> ${esc(opts.internalNotes || '')}</p></div>`;
  }
  function buildLines(r, detail) {
    const rt = Pricing.rates({ customer: r.customer, rep: r.rep }); const a = [];
    if (detail !== 'lump') {
      if (r.labor > 0) a.push({ desc: `Labor — ${r.labor} hour(s)`, qty: r.labor, uom: 'hr', price: rt.labor, amount: r.labor * rt.labor });
      if (r.drive > 0) a.push({ desc: `Drive — ${r.drive} hour(s)`, qty: r.drive, uom: 'hr', price: rt.drive, amount: r.drive * rt.drive });
      r.mats.forEach(m => { const p = Pricing.matPrice({ sku: m.sku, customer: r.customer, rep: r.rep }); a.push({ desc: `Material — ${m.desc}`, qty: m.qty, uom: m.unit, price: p, amount: p * m.qty }); });
    }
    return a;
  }

  // ---------- T&M ----------
  bind('#tm-search', 'input', renderTM);
  bind('#tm-new', 'click', () => {
    const n = state.tm.length + 1;
    const row = {
      ticket: 'T&M-' + String(1000 + n), channel: '#jobs-acme-348', techs: ['@sam'],
      drive: +(Math.random() * 2).toFixed(1), labor: +(2 + Math.random() * 6).toFixed(1),
      mats: [{ sku: 'MAT-1100', desc: 'Tape', qty: 1, unit: 'roll' }],
      scope: 'Leak check & tape', slack: [{ from: 'system', text: 'Created from Slack form', ts: new Date().toLocaleTimeString() }]
    };
    state.tm.unshift(row); renderTM(); openTMThread(row);
  });
  bind('#tm-compose', 'click', () => openSlackComposer({ type: 'tm' }));
  bind('#tm-export', 'click', async () => {
    const ids = $$('#tm-table tbody input[type="checkbox"]:checked').map(cb => cb.dataset.id);
    if (!ids.length) return showToast('Select entries first.');
    const selected = state.tm.filter(r => ids.includes(r.ticket));
    const rows = selected.flatMap(r => r.mats.map(m => ({ InventoryID: m.sku, Qty: m.qty, UOM: m.unit, Location: 'MAIN', Description: m.desc })));
    const header = "InventoryID,Qty,UOM,Location,Description\n";
    const csv = header + rows.map(r => [r.InventoryID, r.Qty, r.UOM, r.Location, r.Description].map(csvCell).join(',')).join('\n') + '\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'tm-materials.csv'; document.body.appendChild(a); a.click(); a.remove();
    showToast(`CSV exported (${rows.length} lines)`);
    if (IMPORTER.mode === 'gas') {
      const res = await postToImporter(csv); showToast(res.ok ? 'Importer accepted CSV' : 'Importer error');
    }
  });
  bind('#tm-all', 'change', e => $$('#tm-table tbody input[type="checkbox"]').forEach(cb => cb.checked = e.target.checked));
  bind('#tm-post', 'click', () => {
    const row = getOpenTMThread(); const t = $('#tm-msg').value.trim(); if (!row || !t) return;
    pushTM(row, 'me', t); $('#tm-msg').value = '';
  });
  bind('#tm-ask', 'click', () => { const row = getOpenTMThread(); if (!row) return; pushTM(row, 'me', 'Please confirm bill-to & attach W-9.'); });
  bind('#tm-approve', 'click', () => { const row = getOpenTMThread(); if (!row) return; pushTM(row, 'sales', 'Approved — proceed'); });
  bind('#tm-reject', 'click', () => { const row = getOpenTMThread(); if (!row) return; pushTM(row, 'sales', 'Rejected — missing PO'); });

  function renderTM() {
    const tb = $('#tm-table tbody'); if (!tb) return;
    tb.innerHTML = '';
    const rows = state.tm.filter(fmatch($('#tm-search')?.value));
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox" data-id="${row.ticket}"></td>
        <td>${row.ticket}</td><td>${row.channel}</td><td>${row.techs.join(', ')}</td>
        <td class="mono">${row.drive}h</td><td class="mono">${row.labor}h</td>
        <td>${row.mats.length} items</td><td class="sml">${esc(row.scope)}</td>`;
      tr.addEventListener('click', e => { if (e.target.type === 'checkbox') return; openTMThread(row); });
      tb.appendChild(tr);
    });
    updateTMTotals(rows);
  }
  function tmValue(row) {
    const rt = Pricing.rates({ customer: null, rep: null });
    const labor$ = (row.labor || 0) * rt.labor;
    const drive$ = (row.drive || 0) * rt.drive;
    const mats$ = row.mats.reduce((s, m) => s + (m.qty * Pricing.matPrice({ sku: m.sku, customer: null, rep: null })), 0);
    return { labor$, drive$, mats$, total: labor$ + drive$ + mats$ };
  }
  function rollup(rows) { return rows.reduce((acc, r) => { const v = tmValue(r); acc.l += v.labor$; acc.d += v.drive$; acc.m += v.mats$; return acc; }, { l: 0, d: 0, m: 0 }); }
  function updateTMTotals(rows) {
    const agg = rollup(rows); const g = agg.l + agg.d + agg.m;
    const text = `Totals (visible): Labor $${agg.l.toFixed(2)} • Drive $${agg.d.toFixed(2)} • Materials $${agg.m.toFixed(2)} • Grand $${g.toFixed(2)}`;
    $('#tm-footer').textContent = text; $('#tm-totals').textContent = text;
  }
  let __tmOpen = null;
  function openTMThread(row) {
    __tmOpen = row;
    const thread = $('#tm-thread'); if (!thread) return;
    thread.innerHTML = '';
    (row.slack || []).forEach(m => {
      const div = document.createElement('div'); div.className = 'msg ' + (m.from || '');
      div.innerHTML = `<div class="sml">${m.from} • ${m.ts}</div><div>${esc(m.text)}</div>`;
      thread.appendChild(div);
    });
    thread.scrollTop = thread.scrollHeight;
  }
  function getOpenTMThread() { return __tmOpen; }
  function pushTM(row, from, text) {
    const msg = { from, text, ts: new Date().toLocaleTimeString() };
    row.slack = row.slack || []; row.slack.push(msg);
    renderTM(); openTMThread(row);
    const feed = $('#tm-feed'); const evt = document.createElement('div'); evt.className = 'event'; evt.textContent = `${from}: ${text}`; feed.prepend(evt);
  }

  // ---------- Pricing ----------
  bind('#mat-add', 'click', () => {
    const sku = $('#mat-sku')?.value.trim(), price = +($('#mat-price')?.value || 0);
    if (!sku || !(price > 0)) return showToast('Enter SKU + price');
    Pricing.data.base[sku] = price; Pricing.save(); drawPricing();
    $('#mat-sku').value = ''; $('#mat-desc').value = ''; $('#mat-price').value = '';
  });

  // ---------- Rules ----------
  bind('#rule-add', 'click', () => {
    const type = $('#rule-type')?.value, key = $('#rule-key')?.value.trim(), sku = $('#rule-sku')?.value.trim() || '*';
    const price = $('#rule-price')?.value ? +$('#rule-price').value : null;
    const labor = $('#rule-labor')?.value ? +$('#rule-labor').value : null;
    const drive = $('#rule-drive')?.value ? +$('#rule-drive').value : null;
    if (!key) return showToast('Enter a Customer or @rep');
    Pricing.data.rules.push({ type, key, sku, price, labor, drive }); Pricing.save(); drawPricing();
  });
  bind('#pricing-save', 'click', () => { Pricing.save(); showToast('Rules & prices saved'); });
  bind('#pricing-load', 'click', () => {
    const v = restore(PRK, null); if (v) { Pricing.data = v; drawPricing(); showToast('Loaded'); }
  });
  bind('#pricing-reset', 'click', () => { localStorage.removeItem(PRK); location.reload(); });

  function drawPricing() {
    const mt = $('#mat-table tbody'); if (mt) {
      mt.innerHTML = '';
      Object.entries(Pricing.data.base).sort((a, b) => a[0] < b[0] ? -1 : 1).forEach(([sku, price]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="mono">${esc(sku)}</td><td>${esc(sku)}</td><td class="mono">$${(+price).toFixed(2)}</td>
          <td><button class="btn" data-edit="${sku}">Edit</button> <button class="btn bad" data-del="${sku}">Delete</button></td>`;
        mt.appendChild(tr);
      });
      mt.onclick = e => {
        const sku = e.target.dataset.edit || e.target.dataset.del;
        if (!sku) return;
        if (e.target.dataset.edit) { $('#mat-sku').value = sku; $('#mat-desc').value = sku; $('#mat-price').value = Pricing.data.base[sku] ?? ''; }
        if (e.target.dataset.del) { delete Pricing.data.base[sku]; Pricing.save(); drawPricing(); }
      };
    }
    const rt = $('#rule-table tbody'); if (rt) {
      rt.innerHTML = '';
      Pricing.data.rules.forEach((r, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${esc(r.type)}</td><td>${esc(r.key)}</td><td class="mono">${esc(r.sku || '*')}</td>
          <td class="mono">${r.price != null ? ('$' + (+r.price).toFixed(2)) : '—'}</td>
          <td class="mono">${r.labor != null ? ('$' + (+r.labor).toFixed(2)) : '—'}</td>
          <td class="mono">${r.drive != null ? ('$' + (+r.drive).toFixed(2)) : '—'}</td>
          <td><button class="btn bad" data-rdel="${i}">Delete</button></td>`;
        rt.appendChild(tr);
      });
      rt.onclick = e => { if (e.target.dataset.rdel) { Pricing.data.rules.splice(+e.target.dataset.rdel, 1); Pricing.save(); drawPricing(); } };
    }
  }

  // ---------- Slack Composer ----------
  bind('#sc-close', 'click', () => $('#slack-modal')?.classList.remove('show'));
  bind('#sc-send', 'click', () => {
    const ch = $('#sc-channel')?.value.trim() || '#general';
    const msg = $('#sc-msg')?.value.trim() || '(no message)';
    const attachInvoice = $('#sc-attach-invoice')?.checked;
    const includeFiles = $('#sc-include-files')?.checked;
    const ctx = window.__scCtx;
    if (ctx?.type === 'record' && ctx.rec) {
      ctx.rec.log.push(`Slack: sent to ${ch} — "${msg}"${attachInvoice ? ' [invoice]' : ''}${includeFiles ? ' [attachments]' : ''}`);
      persist(WIP_KEY, state); renderBilling(ctx.rec.id);
    } else if (ctx?.type === 'tm') {
      showToast(`Posted T&M note to ${ch}`);
    }
    showToast(`Sent to ${ch}`); $('#slack-modal')?.classList.remove('show');
  });

  function openSlackComposer(ctx) {
    window.__scCtx = ctx;
    const channel = (ctx.type === 'record' && ctx.rec?.channel) || '#general';
    $('#sc-channel')?.setAttribute('value', channel);
    if ($('#sc-channel')) $('#sc-channel').value = channel;
    if ($('#sc-msg')) $('#sc-msg').value = (ctx.type === 'record')
      ? `@sales Please review invoice ${ctx.rec.id} for ${ctx.rec.customer}.`
      : `@sales T&M tickets selected for export. See CSV + details in thread.`;
    const host = $('#sc-files'); if (host) {
      host.innerHTML = '';
      if (ctx.type === 'record' && ctx.rec?.salesEdits?.attachments?.length) {
        host.textContent = 'Sales attachments: ' + ctx.rec.salesEdits.attachments.map(a => a.name + (a.internal ? ' (internal)' : '')).join(', ');
      } else host.textContent = 'No attachments.';
    }
    $('#slack-modal')?.classList.add('show');
  }

  // ---------- Helpers ----------
  function bind(sel, ev, fn) { const el = $(sel); if (el) el.addEventListener(ev, fn); }

  // First renders
  renderWip(); renderBilling(); renderTM(); drawPricing();
}

function setupServiceTabs(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  // --------- Demo data for WIP/Review ---------
  let jobs = [
    { id:'INV-1001', channel:'Slack', requester:'Megs', customer:'Ardent Robotics', rep:'Sam', stage:'Pending', drive:2, labor:5, mats:[{sku:'MAT-1001',qty:2}], scope:'Replace drive belt', notes:'N/A' },
    { id:'INV-1002', channel:'Email', requester:'Alex', customer:'Nimbus Co.', rep:'Priya', stage:'Sales Review', drive:1, labor:3, mats:[{sku:'MAT-2200',qty:1}], scope:'Sensor calibration', notes:'Follow SOP-22' },
    { id:'INV-1003', channel:'Slack', requester:'Jordan', customer:'VoltWorks', rep:'Lee', stage:'Approved', drive:4, labor:8, mats:[{sku:'MAT-3000',qty:4}], scope:'Install new modules', notes:'Expedite' },
  ];
  function estimate(j){
    const base = { drive:40, labor:100 };
    const mats = (j.mats||[]).reduce((s,m)=> s + (Number(m.qty)||0)*(pricing?.base?.[m.sku]||25), 0);
    return (j.drive||0)*base.drive + (j.labor||0)*base.labor + mats;
  }
  function renderKanban(){
    const map = { 'Pending':'#kcol-pending', 'Sales Review':'#kcol-review', 'Approved':'#kcol-approved', 'Paid':'#kcol-paid', 'Rejected':'#kcol-rejected' };
    Object.values(map).forEach(sel=>{ const c=$(sel); if(c) c.innerHTML=''; });
    const q = ($('#svc-wip-search')?.value||'').toLowerCase().trim();
    jobs.filter(j=> !q || Object.values(j).join(' ').toLowerCase().includes(q)).forEach(j=>{
      const sel = map[j.stage]; const col = $(sel); if(!col) return;
      const amt = estimate(j).toLocaleString(undefined,{style:'currency',currency:'USD'});
      const card = document.createElement('div'); card.className='kcard';
      card.innerHTML = `<div class="top"><div>${j.id}</div><div class="mono">${amt}</div></div>
        <div class="meta">#jobs-${j.customer.toLowerCase().split(' ').join('-')} • @${(j.requester||'ops').toLowerCase()} • ${j.customer}</div>
        <div class="kchips"><span class="chip">${(j.techs||2)} tech(s)</span><span class="chip">${(j.mats||[]).length} material(s)</span></div>
        <div class="actions"><button class="btn" data-open="${j.id}">Billing</button><button class="btn" data-remind="${j.id}">Remind</button><button class="btn" data-slack="${j.id}">Slack</button></div>`;
      col.appendChild(card);
    });
  }
  function advance(id){ const order=['Pending','Sales Review','Approved','Paid']; const j=jobs.find(x=>x.id===id); if(!j) return; const i=order.indexOf(j.stage); j.stage = order[Math.min(order.length-1, i+1)] || j.stage; renderKanban(); renderReview(); }
  function renderReview(){ const list = $('#svc-review-list'); if(!list) return; list.innerHTML = jobs.map(j=>`<div class="rItem"><input type="checkbox"/><div><strong>${j.id}</strong><div class="sml">${j.customer} — ${j.stage}</div></div><div style="margin-left:auto"><button class="mini-btn" data-open="${j.id}">Open</button></div></div>`).join(''); const detail=$('#svc-review-detail'); if(detail && jobs[0]) detail.innerHTML = `<div class="kvM"><div>Customer</div><div>${jobs[0].customer}</div><div>Requester</div><div>${jobs[0].requester}</div><div>Rep</div><div>${jobs[0].rep}</div></div>`; }
  document.addEventListener('click', (e)=>{ const adv=e.target.closest('[data-advance]'); if(adv){ advance(adv.getAttribute('data-advance')); } const op=e.target.closest('[data-open]'); if(op){ document.querySelector('.subtab[data-subtab="service-billing"]')?.click(); openModal(op.getAttribute('data-open')); } if(e.target.closest('[data-remind]')){ alert('Reminder sent'); } if(e.target.closest('[data-slack]')){ alert('Opening Slack…'); } });

  // --------- Pricing engine ---------
  const PRK='svc.pricing.v1';
  let pricing = JSON.parse(localStorage.getItem(PRK)||'null') || { base:{"MAT-1001":45,"MAT-2200":25,"MAT-3000":120,"MAT-1100":18}, rules:[{type:'rep',key:'@jane',sku:'*',labor:100,drive:40},{type:'customer',key:'Acme Corp',sku:'MAT-1001',price:49}] };
  function savePricing(){ try{ localStorage.setItem(PRK, JSON.stringify(pricing)); }catch{} }
  function renderMaterials(){ const tbody = $('#mat-table tbody'); if(!tbody) return; tbody.innerHTML = Object.entries(pricing.base).map(([sku,price])=>`<tr><td class="mono">${sku}</td><td>${sku}</td><td class="mono">${Number(price).toFixed(2)}</td><td><button class="mini-btn" data-del-mat="${sku}">Del</button></td></tr>`).join(''); }
  function renderRules(){ const tbody=$('#rule-table tbody'); if(!tbody) return; tbody.innerHTML = (pricing.rules||[]).map((r,i)=>`<tr><td>${r.type}</td><td>${r.key}</td><td>${r.sku}</td><td>${r.price??''}</td><td>${r.labor??''}</td><td>${r.drive??''}</td><td><button class="mini-btn" data-del-rule="${i}">Del</button></td></tr>`).join(''); }
  document.addEventListener('click', (e)=>{ const dm=e.target.closest('[data-del-mat]'); if(dm){ delete pricing.base[dm.getAttribute('data-del-mat')]; savePricing(); renderMaterials(); } const dr=e.target.closest('[data-del-rule]'); if(dr){ pricing.rules.splice(Number(dr.getAttribute('data-del-rule')),1); savePricing(); renderRules(); } });
  $('#mat-add')?.addEventListener('click', ()=>{ const sku=$('#mat-sku').value.trim(); const price=Number($('#mat-price').value||0); if(!sku) return; pricing.base[sku]=price; savePricing(); renderMaterials(); });
  $('#pricing-save')?.addEventListener('click', ()=>{ savePricing(); alert('Saved'); });
  $('#pricing-load')?.addEventListener('click', ()=>{ pricing = JSON.parse(localStorage.getItem(PRK)||'{}')||pricing; renderMaterials(); renderRules(); });
  $('#pricing-reset')?.addEventListener('click', ()=>{ localStorage.removeItem(PRK); pricing={ base:{}, rules:[] }; renderMaterials(); renderRules(); });
  $('#rule-add')?.addEventListener('click', ()=>{ const r={ type:$('#rule-type').value, key:$('#rule-key').value.trim(), sku:$('#rule-sku').value.trim()||'*', price:($('#rule-price').value||'')||undefined, labor:($('#rule-labor').value||'')||undefined, drive:($('#rule-drive').value||'')||undefined }; pricing.rules.push(r); savePricing(); renderRules(); });

  // --------- Modal ---------
  function openModal(id){ const modal=document.getElementById('inv-modal'); const body=document.getElementById('inv-body'); if(!modal||!body) return; const j=jobs.find(x=>x.id===id); body.innerHTML = j ? `<h3>${j.id}</h3><div class="kvM"><div>Customer</div><div>${j.customer}</div><div>Requester</div><div>${j.requester}</div><div>Rep</div><div>${j.rep}</div></div>` : '—'; modal.classList.add('show'); }
  document.querySelector('#inv-modal .inv-close')?.addEventListener('click', ()=> document.getElementById('inv-modal')?.classList.remove('show'));
  document.getElementById('inv-modal')?.addEventListener('click', (e)=>{ if(e.target.id==='inv-modal') e.currentTarget.classList.remove('show'); });

  // Initial renders
  renderKanban(); renderReview(); renderMaterials(); renderRules();
  $('#svc-wip-search')?.addEventListener('input', renderKanban);
}
