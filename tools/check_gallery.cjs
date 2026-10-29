/* Local static-gallery smoke tests; no external browser session or account. */
const { chromium }=require('playwright');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd();
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.gif':'image/gif','.webp':'image/webp'};
 const server=http.createServer(async(req,res)=>{
  try{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root)throw Error('path');
   if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
  }catch{res.statusCode=404;res.end('Not found')}
 });
 await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await chromium.launch({executablePath:process.env.MASCOT_BROWSER_EXECUTABLE||undefined});
  const page=await browser.newPage({viewport:{width:1280,height:1000},colorScheme:'light'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const bad=[];page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))bad.push(r.url())});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.getByText('116 reactions · transparent stickers',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Switch to dark mode',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.getByText('116 reactions · transparent stickers',{exact:true}).waitFor();
  await page.locator('#collection').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/qa-dark.png'});
  await page.getByRole('searchbox').fill('hello');
  await page.getByText('2 reactions · transparent stickers',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Animated',exact:false}).click();
  await page.getByRole('button',{name:'Preview Claude Hello',exact:true}).click();
  await page.locator('#detail-image').evaluate(img=>img.decode());
  assert((await page.locator('#detail-image').getAttribute('src')).includes('claude-v5/hello.webp'));
  for(const link of await page.locator('#downloads a').all()){
   const response=await page.request.get(await link.getAttribute('href'));assert.equal(response.status(),200);
   assert((await response.body()).length>20);
  }
  const pack=await page.request.get(await page.locator('#source').getAttribute('href'));assert.equal(pack.status(),200);
  assert((await pack.body()).length>1000);
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  await page.getByRole('button',{name:'Switch to light mode',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();
  await page.locator('#collection').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/qa-light-mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');
  await page.getByRole('button',{name:'Animated',exact:false}).click();
  await page.waitForFunction(()=>{
   const imgs=Array.from(document.querySelectorAll('#grid img'));
   return imgs.some(im=>{const r=im.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&im.src.includes('.webp')})&&
          imgs.some(im=>im.getBoundingClientRect().top>innerHeight+100&&im.src.includes('.png'));
  });
  await page.getByRole('searchbox').fill('hello');
  await page.getByRole('button',{name:'Animated',exact:false}).click();
  await page.route('**/claude-v5/hello.webp*',route=>route.abort());
  await page.getByRole('button',{name:'Preview Claude Hello',exact:true}).click();
  await page.waitForFunction(()=>{const im=document.querySelector('#detail-image');return im.src.includes('hello.gif')&&im.complete&&im.naturalWidth>0});
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  await page.unroute('**/claude-v5/hello.webp*');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#grid img')).every(im=>im.src.includes('.png')));
  assert(await page.locator('#motion-note').isVisible());
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  console.log('Gallery verified: 116 reactions, dark mode, mobile layout, visible WebP playback, off-screen pause, GIF fallback, reduced motion and all downloads.');
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
