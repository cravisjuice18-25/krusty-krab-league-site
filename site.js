/* Shared navigation and safe display helpers. */
window.KKL = {
  escape: value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  number: value => Number(String(value ?? '').replace(/,/g, '')) || 0,
  record: value => { const [w=0,l=0,t=0] = String(value || '').split('-').map(Number); return {w,l,t,pct:w+l+t ? (w+t/2)/(w+l+t) : 0}; },
  error: (id, columns=1) => {const el=document.getElementById(id); if(el) el.innerHTML=el.tagName==='TBODY' ? `<tr><td colspan="${columns}">Records could not load. Please refresh to try again.</td></tr>` : '<p>Records could not load. Please refresh to try again.</p>';}
};
document.querySelectorAll('.nav-group-button').forEach(button => {
  button.addEventListener('click', () => {
    const open=button.getAttribute('aria-expanded')!=='true';
    document.querySelectorAll('.nav-group-button').forEach(b => {b.setAttribute('aria-expanded','false');b.parentElement.classList.remove('is-open');});
    button.setAttribute('aria-expanded',String(open));button.parentElement.classList.toggle('is-open',open);
  });
});
document.addEventListener('click', e => {if(!e.target.closest('.nav-group')) closeMenus();});
document.addEventListener('keydown', e => {if(e.key==='Escape'){const open=document.querySelector('.nav-group-button[aria-expanded="true"]');closeMenus();open?.focus();}});
function closeMenus(){document.querySelectorAll('.nav-group-button').forEach(b=>{b.setAttribute('aria-expanded','false');b.parentElement.classList.remove('is-open');});}
const currentPage=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.top-nav a').forEach(a=>{if(a.getAttribute('href')===currentPage)a.setAttribute('aria-current','page');});
// Unavailable artwork keeps a neutral league illustration instead of a broken image.
function useArchiveFallback(img){if(img.dataset.fallbackApplied)return;img.dataset.fallbackApplied='true';img.onerror=null;img.classList.add('archive-image-fallback');img.src='images/archive-fallback.svg';}
document.addEventListener('error',event=>{if(event.target.tagName==='IMG')useArchiveFallback(event.target);},true);
document.querySelectorAll('img').forEach(img=>{if(img.complete&&!img.naturalWidth)useArchiveFallback(img);});

// Small franchise markers use CSV branding; table backgrounds stay neutral.
async function addFranchiseAccents(){
 if(typeof loadCSV!=='function')return;
 try{
  const teams=await loadCSV('data/teams.csv');
  const lookup=new Map(teams.map(team=>[team.owner_id.toLowerCase(),team]));
  const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
  const apply=()=>document.querySelectorAll('.table-wrap a[href*="team.html?owner="]').forEach(link=>{
   const owner=new URL(link.href,location.href).searchParams.get('owner');
   const team=lookup.get((owner||'').toLowerCase());if(!team)return;
   link.classList.add('franchise-accent-link');
   link.style.setProperty('--franchise-primary',hex(team.primary_color,'#79cedc'));
   link.style.setProperty('--franchise-secondary',hex(team.secondary_color,'#d5a458'));
  });
  apply();
  const observer=new MutationObserver(apply);
  document.querySelectorAll('.table-wrap').forEach(el=>observer.observe(el,{childList:true,subtree:true}));
 }catch(error){console.warn('Franchise accents could not load',error);}
}
addFranchiseAccents();
