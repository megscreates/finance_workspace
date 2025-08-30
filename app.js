// App bootstrap: charts + orders table with search/sort

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initOrders();
});

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

