// Lightweight theme tokens + applier for future Theme Studio
(function(){
  const defaultSoftGlass = {
    '--outline': 'rgba(255,255,255,0.35)',
    '--line': '1px',
    '--outline-style': 'solid',
    '--radius': '20px',
    '--shadow-offset': '0px',
    '--bg': 'radial-gradient(1200px 700px at 80% -10%, rgba(255,155,155,.37), transparent 60%),\n        radial-gradient(900px 500px at -10% 10%, rgba(155,155,255,.37), transparent 50%),\n        linear-gradient(180deg,#fff5f5 0%, #f6f1ff 50%, #eef9ff 85%, #ffffff 100%)',
    '--sidebar-bg': 'rgba(255,255,255,0.6)',
    '--headline-gradient': 'linear-gradient(90deg,#8057ff,#22d3ee,#34d399)',
    '--card-fill': 'rgba(255,255,255,0.65)'
  };

  function applyTheme(vars){
    const r = document.body;
    Object.entries(vars).forEach(([k,v])=>{
      r.style.setProperty(k, v);
      document.documentElement.style.setProperty(k, v);
    });
  }

  window.Theme = { apply: applyTheme, defaults: { softGlass: defaultSoftGlass } };

  // Apply default on load
  document.addEventListener('DOMContentLoaded', ()=>{
    document.body.setAttribute('data-look','glass');
    applyTheme(defaultSoftGlass);
  });
})();
