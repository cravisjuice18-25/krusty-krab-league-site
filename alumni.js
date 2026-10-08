document.addEventListener('DOMContentLoaded',async()=>{
 try{const rows=await loadCSV('data/teams.csv');const e=KKL.escape;
 document.getElementById('alumni-grid').innerHTML=rows.filter(x=>x.status.toLowerCase()!=='active').map(x=>`<article class="content-card"><p class="section-label">League Alumni</p><h2>${e(x.owner)}</h2><p>${e(x.team_name)}</p><p>Career record: ${e(x.record)} · Titles: ${KKL.number(x.titles)}</p><a href="team.html?owner=${encodeURIComponent(x.owner_id)}">View franchise history →</a></article>`).join('')||'<p>No former franchises recorded.</p>';
 }catch(err){console.error(err);KKL.error('alumni-grid');}
});
