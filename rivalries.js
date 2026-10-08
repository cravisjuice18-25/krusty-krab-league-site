document.addEventListener('DOMContentLoaded',async()=>{
 try{
  const [teams,series]=await Promise.all([loadCSV('data/teams.csv'),loadCSV('data/team-h2h.csv')]);const {escape:e,number:n}=KKL;const select=document.getElementById('rivalry-owner');
  select.innerHTML=teams.map(x=>`<option value="${e(x.owner_id)}">${e(x.owner)} · ${e(x.team_name)}</option>`).join('');
  const requested=new URLSearchParams(location.search).get('owner');if(teams.some(x=>x.owner_id===requested))select.value=requested;
  const render=()=>{const rows=series.filter(x=>x.owner_id===select.value).sort((a,b)=>n(b.total_games)-n(a.total_games));
   document.getElementById('h2h-table').innerHTML=rows.map(x=>`<tr><td><a href="team.html?owner=${encodeURIComponent(x.opponent_id)}">${e(x.opponent_name)}</a></td><td>${n(x.total_games)}</td><td>${e(x.record)}</td><td>${n(x.win_pct).toFixed(3)}</td><td>${n(x.points_for).toLocaleString()}</td><td>${n(x.points_against).toLocaleString()}</td><td>${n(x.margin)>0?'+':''}${n(x.margin).toLocaleString()}</td></tr>`).join('')||'<tr><td colspan="7">No series recorded for this franchise.</td></tr>';
   document.getElementById('h2h-summary').textContent=`${rows.length} recorded opponents · ${rows.reduce((sum,x)=>sum+n(x.total_games),0)} games`;
   history.replaceState(null,'',`?owner=${encodeURIComponent(select.value)}`);};render();select.addEventListener('change',render);
 }catch(err){console.error(err);KKL.error('h2h-table',7);}
});
