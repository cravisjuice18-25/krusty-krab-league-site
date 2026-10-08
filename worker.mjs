// Serve an official fixed-origin feed on the same domain as the website.
export default {
 async fetch(request, env) {
  if (new URL(request.url).pathname !== '/api/nfl-news') return env.ASSETS.fetch(request);
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  try {
   const response = await fetch('https://www.espn.com/espn/rss/nfl/news', {
    headers: {Accept:'application/rss+xml, application/xml, text/xml'},
    cf: {cacheTtl:300,cacheEverything:true}, signal:AbortSignal.timeout(10000)
   });
   if (!response.ok) throw new Error('News source unavailable');
   const xml = await response.text();
   if (!xml.includes('<rss') || !xml.includes('<item>')) throw new Error('Invalid news feed');
   return new Response(request.method==='HEAD'?null:xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
  } catch {
   return new Response('NFL headlines are temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});
  }
 }
};
