document.addEventListener('DOMContentLoaded', async () => {
 const {escape:e,number:n,record:r,error}=KKL;
 const results=await Promise.allSettled(['current-standings','teams','pickem-weekly'].map(p=>loadCSV(`data/${p}.csv`)));
 if(document.getElementById('current-table') && results[0].status==='fulfilled'){
  const data=results[0].value;const year=Math.max(...data.map(x=>n(x.year)));const rows=data.filter(x=>n(x.year)===year).sort((a,b)=>n(a.rank)-n(b.rank));
  document.getElementById('current-season-label').textContent=`${year} · Through Week ${Math.max(...rows.map(x=>n(x.through_week)))}`;
  document.getElementById('current-table').innerHTML=rows.map(x=>`<tr><td>${e(x.rank)}</td><td><a href="team.html?owner=${encodeURIComponent(x.owner_id)}">${e(x.team)}</a></td><td>${e(x.record)}</td><td>${n(x.points_for).toLocaleString()}</td><td>${n(x.points_against).toLocaleString()}</td><td>${n(x.rank)<=3?'Direct playoff position':n(x.rank)<=5?'Play-in position':'Outside playoff positions'}</td></tr>`).join('')||'<tr><td colspan="6">No current standings recorded.</td></tr>';
 }else error('current-table',6);
 if(results[1].status==='fulfilled'){
  const render=()=>{const status=document.getElementById('franchise-status').value;const rows=results[1].value.filter(x=>status==='all'||x.status.toLowerCase()===status).sort((a,b)=>r(b.record).pct-r(a.record).pct||r(b.record).w-r(a.record).w);
   document.getElementById('lifetime-table').innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td><a href="team.html?owner=${encodeURIComponent(x.owner_id)}">${e(x.team_name)}</a></td><td>${e(x.owner)}</td><td>${e(x.record)}</td><td>${r(x.record).pct.toFixed(3)}</td><td>${n(x.titles)}</td><td>${n(x.top_week_count)}</td></tr>`).join('');};render();document.getElementById('franchise-status').addEventListener('change',render);
 }else error('lifetime-table',7);
 if(results[2].status==='fulfilled'){
  const data=results[2].value;const year=Math.max(...data.map(x=>n(x.year)));const rows=data.filter(x=>n(x.year)===year).sort((a,b)=>n(b.total_correct)-n(a.total_correct));let rank=0,last;
  document.getElementById('pickem-label').textContent=`${year} · Correct picks through Week ${Math.max(...rows.map(x=>n(x.through_week)))}`;
  document.getElementById('pickem-table').innerHTML=rows.map((x,i)=>{if(n(x.total_correct)!==last)rank=i+1;last=n(x.total_correct);return `<tr><td>${rank}</td><td>${e(x.owner_id)}</td><td>${last}</td></tr>`;}).join('')||'<tr><td colspan="3">No pick’em results recorded.</td></tr>';
 }else error('pickem-table',3);
});
