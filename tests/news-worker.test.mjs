import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
const url='https://krustykrableague.com/api/nfl-news';
test('official feed is served as cached XML', async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async requested=>{assert.equal(requested,'https://www.espn.com/espn/rss/nfl/news');return new Response('<rss><channel><item><title>News</title></item></channel></rss>');};
 try{const response=await worker.fetch(new Request(url),{});assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/application\/xml/);assert.match(response.headers.get('Cache-Control'),/max-age=300/);assert.match(await response.text(),/<rss>/);}finally{globalThis.fetch=previous;}
});
test('source failures and invalid responses become a temporary error',async()=>{
 const previous=globalThis.fetch;
 try{for(const response of [new Response('Unavailable',{status:503}),new Response('<html>Sign in</html>')]){globalThis.fetch=async()=>response;assert.equal((await worker.fetch(new Request(url),{})).status,503);}}finally{globalThis.fetch=previous;}
});
test('non-GET methods are rejected and normal pages use static assets',async()=>{
 assert.equal((await worker.fetch(new Request(url,{method:'POST'}),{})).status,405);
 const response=await worker.fetch(new Request('https://krustykrableague.com/'),{ASSETS:{fetch:async()=>new Response('Home')}});assert.equal(await response.text(),'Home');
});
