// App bootstrap: charts + orders table with search/sort

document.addEventListener('DOMContentLoaded', () => {
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
  initWidgetSystem();
});
/* --------------------------------------------------------------------------
   iOS-style Widget System (glass-themed, localStorage-backed)
   -------------------------------------------------------------------------- */
function initWidgetSystem(){
  const grid = document.getElementById('widgetGrid');
  const addBtn = document.getElementById('widgetsAddBtn');
  const editBtn = document.getElementById('widgetsEditBtn');
  const sheet = document.getElementById('widgetGallery');
  if(!grid || !addBtn || !editBtn || !sheet) return;

  const LS_KEY = 'widgets.layout.v1';
  const DEFAULT_LAYOUT = [
    { id: uid(), type:'kpi',        size:'m' },
    { id: uid(), type:'metrics',    size:'l' },
    { id: uid(), type:'tasks',      size:'m' },
    { id: uid(), type:'calendar',   size:'m' },
    { id: uid(), type:'quicklinks', size:'s' },
    { id: uid(), type:'email',      size:'s' },
    { id: uid(), type:'weather',    size:'s' },
    { id: uid(), type:'notes',      size:'m' },
  ];

  let layout;
  try { layout = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { layout = null; }
  if(!Array.isArray(layout) || layout.length === 0) layout = DEFAULT_LAYOUT;

  // Render current layout
  grid.innerHTML = '';
  layout.forEach(w => grid.appendChild(createWidgetEl(w)));

  // Persist on changes
  function save(){
    const items = Array.from(grid.querySelectorAll('.widget-card')).map(el => ({
      id: el.dataset.id, type: el.dataset.type, size: el.dataset.size
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  // Edit mode toggle
  let editing = false;
  function setEditing(on){
    editing = !!on;
    grid.classList.toggle('is-editing', editing);
    grid.querySelectorAll('.widget-card').forEach(el => {
      el.setAttribute('draggable', editing ? 'true' : 'false');
    });
    editBtn.classList.toggle('active', editing);
  }
  editBtn.addEventListener('click', ()=> setEditing(!editing));

  // Long press on any widget to enter edit mode
  grid.addEventListener('pointerdown', (e)=>{
    const card = e.target.closest('.widget-card');
    if(!card || editing) return;
    let pressed = true;
    const to = setTimeout(()=>{ if(pressed) setEditing(true); }, 500);
    const cancel = ()=>{ pressed=false; clearTimeout(to); window.removeEventListener('pointerup', cancel, true); window.removeEventListener('pointermove', cancel, true); };
    window.addEventListener('pointerup', cancel, true);
    window.addEventListener('pointermove', cancel, true);
  }, {passive:true});

  // Drag & drop reordering (simplified, DOM order = visual order)
  grid.addEventListener('dragstart', e=>{
    if(!editing) return e.preventDefault();
    const card = e.target.closest('.widget-card');
    if(!card) return;
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  grid.addEventListener('dragend', e=>{
    const card = e.target.closest('.widget-card');
    if(card) card.classList.remove('dragging');
    save();
  });
  grid.addEventListener('dragover', e=>{
    if(!editing) return;
    e.preventDefault();
    const after = getDragAfterElement(grid, e.clientY);
    const dragging = grid.querySelector('.dragging');
    if(!dragging) return;
    if(after == null) { grid.appendChild(dragging); }
    else { grid.insertBefore(dragging, after); }
  });
  function getDragAfterElement(container, y){
    const els = [...container.querySelectorAll('.widget-card:not(.dragging)')];
    return els.reduce((closest, child)=>{
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if(offset < 0 && offset > closest.offset){ return { offset, element: child }; }
      else { return closest; }
    }, {offset: Number.NEGATIVE_INFINITY}).element;
  }

  // Bottom sheet gallery
  function openSheet(){ sheet.setAttribute('aria-hidden','false'); document.body.classList.add('sheet-open'); }
  function closeSheet(){ sheet.setAttribute('aria-hidden','true'); document.body.classList.remove('sheet-open'); }
  addBtn.addEventListener('click', openSheet);
  sheet.addEventListener('click', (e)=>{
    if(e.target.matches('[data-sheet-close], .sheet-scrim')) closeSheet();
    const btn = e.target.closest('[data-add-widget]');
    if(!btn) return;
    const type = btn.getAttribute('data-add-widget');
    const data = { id: uid(), type, size:'s' };
    const el = createWidgetEl(data);
    grid.appendChild(el);
    save();
    closeSheet();
    setEditing(true);
  });

  // Utilities
  function uid(){ return 'w' + Math.random().toString(36).slice(2,10); }

  function createWidgetEl({id, type, size}){
    const el = document.createElement('article');
    el.className = `widget-card size-${size || 's'}`;
    el.dataset.id = id; el.dataset.type = type; el.dataset.size = size || 's';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', typeTitle(type));
    el.innerHTML = `
      <header class="widget-head">
        <div class="widget-title">
          <svg viewBox="0 0 24 24" class="widget-glyph"><use href="${iconFor(type)}"/></svg>
          <span>${typeTitle(type)}</span>
        </div>
        <div class="widget-actions">
          <button class="mini-btn size-toggle" title="Resize">S</button>
          <button class="mini-btn delete-btn" title="Remove">–</button>
        </div>
      </header>
      <div class="widget-body">${renderBody(type, id)}</div>
    `;

    // Interactions
    el.querySelector('.delete-btn')?.addEventListener('click', ()=>{
      if(!editing) setEditing(true);
      el.remove(); save();
    });
    el.querySelector('.size-toggle')?.addEventListener('click', ()=>{
      const next = nextSize(el.dataset.size);
      el.dataset.size = next;
      el.classList.remove('size-s','size-m','size-l');
      el.classList.add(`size-${next}`);
      el.querySelector('.size-toggle').textContent = next.toUpperCase().slice(0,1);
      hydrate(el);
      save();
    });

    // After attaching, hydrate any dynamic parts (charts, calculators, etc.)
    setTimeout(()=> hydrate(el), 0);
    return el;
  }

  function nextSize(s){ return s==='s' ? 'm' : s==='m' ? 'l' : 's'; }
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
            return `<ul class="mini-list">${tasks.slice(0,5).map(t=>`<li>${t.done?'✅':'⬜️'} ${escapeHtml(t.text)}</li>`).join('')}</ul>`;
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
        return `<div class="calc">
          <input type="number" class="calc-a" placeholder="A"/>
          <select class="calc-op"><option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option></select>
          <input type="number" class="calc-b" placeholder="B"/>
          <button class="mini-btn calc-go">=</button>
          <span class="calc-out">0</span>
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

    // KPI: update with window.WIDGET_DATA.kpis if present
    if (card.dataset.type === 'kpi') {
      const wrap = card.querySelector('.kpi-wrap');
      if (wrap && window.WIDGET_DATA?.kpis?.length) {
        const kpi = window.WIDGET_DATA.kpis[0];
        wrap.innerHTML =
          `<div class="kpi-value">${escapeHtml(kpi.value ?? '')}</div>
          <div class="kpi-label muted">${escapeHtml(kpi.label ?? '')}</div>
          ${kpi.trend ? `<div class="kpi-trend ${kpi.trend > 0 ? 'up' : (kpi.trend < 0 ? 'down' : '')}">${kpi.trend > 0 ? '+' : (kpi.trend < 0 ? '−' : '')}${Math.abs(kpi.trend)}%</div>` : ''}`;
      }
    }

    // Calculator logic
    const go = card.querySelector('.calc-go');
    if(go){
      const a = card.querySelector('.calc-a'), b = card.querySelector('.calc-b'), op = card.querySelector('.calc-op'), out = card.querySelector('.calc-out');
      go.addEventListener('click', ()=>{
        const av = parseFloat(a.value || '0'), bv = parseFloat(b.value || '0');
        const o = op.value;
        let r = 0; try { r = o==='+'?av+bv : o==='-'?av-bv : o==='*'?av*bv : (bv!==0?av/bv:0); } catch(e){ r=0; }
        out.textContent = String(r);
      });
    }

    // Metrics chart: use WIDGET_DATA.metrics if present
    const chartBox = card.querySelector('.chart-box[data-type="metrics"]');
    const canvas = chartBox ? chartBox.querySelector('canvas[id^="c_"]') : card.querySelector('canvas[id^="c_"]');
    if(canvas && window.Chart){
      let chartData = null, chartLabels = null;
      if (window.WIDGET_DATA?.metrics) {
        chartLabels = window.WIDGET_DATA.metrics.labels || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        chartData = window.WIDGET_DATA.metrics.data || [12,14,16,13,18,22,24,23,25,28,27,30];
      } else {
        chartLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        chartData = [12,14,16,13,18,22,24,23,25,28,27,30];
      }
      const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6f5cff';
      // Remove any existing chart instance on this canvas
      if (canvas._chartInstance) { try { canvas._chartInstance.destroy(); } catch(e){} }
      canvas._chartInstance = new Chart(canvas.getContext('2d'), {
        type:'line',
        data:{ labels:chartLabels,
          datasets:[{ data:chartData, tension:.35, borderColor:primary, backgroundColor:'rgba(111,92,255,0.12)', fill:true, pointRadius:0 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{display:false}, y:{display:false} } }
      });
    }
  }

  function sampleList(items){
    return `<ul class="mini-list">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
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
      if (ps) ps.focus();
    }
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
  // Left-rail mini links that jump to a subtab
  document.addEventListener('click', (e)=>{
    const link = e.target.closest('[data-subtab-jump]');
    if(!link) return;
    const subtab = link.dataset.subtabJump;
    const btn = document.querySelector(`.subtab[data-subtab="${subtab}"]`);
    if(btn) btn.click();
    // Update left-rail state
    document.querySelectorAll('.nav-subitem').forEach(a=>{
      a.classList.toggle('is-current', a === link);
    });
  }, { passive:true });

  // Main nav item click: jump to its first subtab in the next subgroup
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.nav-item');
    if(!item) return;
    const subgroup = item.nextElementSibling;
    if(subgroup && subgroup.classList && subgroup.classList.contains('nav-subgroup')){
      const first = subgroup.querySelector('.nav-subitem');
      if(first){
        e.preventDefault();
        const subtab = first.dataset.subtabJump;
        const btn = document.querySelector(`.subtab[data-subtab="${subtab}"]`);
        if(btn) btn.click();
      }
    }
  }, { passive:false });
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
    weather: { icon:'#i-life', label:'Weather', value:'72°F ☀️' },
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
