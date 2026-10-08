document.addEventListener('DOMContentLoaded',async()=>{
 try{const rows=await loadCSV('data/hall-of-fame.csv');const e=KKL.escape;
 document.getElementById('lore-grid').innerHTML=rows.sort((a,b)=>KKL.number(b.year)-KKL.number(a.year)).map(x=>`<article class="content-card"><p class="section-label">${e(x.year)} · ${e(x.category)}</p><h2>${e(x.title)}</h2><p>${e(x.caption)}</p></article>`).join('')||'<p>No league moments recorded yet.</p>';
 }catch(err){console.error(err);KKL.error('lore-grid');}
});
