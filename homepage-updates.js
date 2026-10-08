document.addEventListener('DOMContentLoaded',()=>{
 renderHomePlayoffRace();
 renderInsiderFeed();
});
async function renderHomePlayoffRace(){
 const {escape:e,number:n}=KKL;
 try{
  const data=await loadCSV('data/current-standings.csv');
  const year=Math.max(...data.map(x=>n(x.year)));
  const rows=data.filter(x=>n(x.year)===year).sort((a,b)=>n(a.rank)-n(b.rank));
  document.getElementById('home-race-label').textContent=rows.length?`${year} · Through Week ${Math.max(...rows.map(x=>n(x.through_week)))}`:'Current Season';
  document.getElementById('home-race-body').innerHTML=rows.map(x=>`<tr class="race-${n(x.rank)<=3?'direct':n(x.rank)<=5?'playin':'outside'}"><td>${e(x.rank)}</td><td><a href="team.html?owner=${encodeURIComponent(x.owner_id)}">${e(x.team)}</a></td><td>${e(x.record)}</td><td>${n(x.points_for).toLocaleString()}</td><td>${n(x.rank)<=3?'Direct playoff position':n(x.rank)<=5?'Play-in position':'Outside playoff positions'}</td></tr>`).join('')||'<tr><td colspan="5">No standings recorded yet.</td></tr>';
 }catch{KKL.error('home-race-body',5);}
}
async function renderInsiderFeed(){
 const container=document.getElementById('insider-feed');
 try{
  const response=await fetch('/api/nfl-news',{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Feed unavailable');
  const xml=new DOMParser().parseFromString(await response.text(),'application/xml');
  if(xml.querySelector('parsererror'))throw new Error('Invalid feed');
  const articles=Array.from(xml.querySelectorAll('item')).slice(0,8);
  if(!articles.length)throw new Error('Empty feed');
  container.replaceChildren();
  for(const item of articles){
   const url=new URL(item.querySelector('link')?.textContent||'');
   if(url.protocol!=='https:'||!(url.hostname==='espn.com'||url.hostname.endsWith('.espn.com')))continue;
   const article=document.createElement('article');article.className='insider-headline';
   const a=document.createElement('a');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.querySelector('title')?.textContent||'Read report';article.append(a);
   const date=new Date(item.querySelector('pubDate')?.textContent||'');
   if(!Number.isNaN(date.getTime())){const time=document.createElement('time');time.dateTime=date.toISOString();time.textContent=`ESPN · ${date.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`;article.append(time);}
   container.append(article);
  }
  if(!container.children.length)throw new Error('No valid articles');
 }catch{container.textContent='Headlines are temporarily unavailable. Use the ESPN or X links below for the latest reports.';}
}
