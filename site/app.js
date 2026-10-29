const $=s=>document.querySelector(s);let data,character='all',format='png',category='All',limit=24,active;const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;
const url=p=>new URL(p,document.baseURI).href;
const asset=(m,e,f)=>url(`${m.base}${e.id}.${f}?v=9`);
let previewing=false;
function applyMotion(img,play){const next=play?img.dataset.motion:img.dataset.still;if(next&&img.src!==next)img.src=next;}
const motionObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.target.isConnected)applyMotion(e.target,e.isIntersecting&&!document.hidden&&!reduced);},{rootMargin:'60px'}):null;
function configurePreview(img,m,e,play,observe){
 img.dataset.still=asset(m,e,'png');img.dataset.motion=asset(m,e,'webp');img.dataset.fallback=asset(m,e,'gif');
 img.onerror=()=>{if(img.src===img.dataset.motion&&img.dataset.motion!==img.dataset.still){if(img.dataset.motion!==img.dataset.fallback){img.dataset.motion=img.dataset.fallback;applyMotion(img,true);}else{img.dataset.motion=img.dataset.still;img.onerror=null;applyMotion(img,false);}}};
 applyMotion(img,play&&!observe&&!document.hidden);
 if(play&&observe){if(motionObserver)motionObserver.observe(img);else applyMotion(img,!document.hidden);}
}
document.addEventListener('visibilitychange',()=>{
 const images=document.querySelectorAll('#grid img[data-motion]');
 if(motionObserver)motionObserver.disconnect();
 for(const img of images){applyMotion(img,false);if(!document.hidden&&format==='gif'&&!reduced){if(motionObserver)motionObserver.observe(img);else applyMotion(img,true);}}
 if(active&&$('#detail').open)applyMotion($('#detail-image'),previewing&&!document.hidden);
});
function pressed(parent,button){parent.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}
function render(){if(!data)return;if(motionObserver)motionObserver.disconnect();const q=$('#search').value.trim().toLowerCase();$('#clear').hidden=!q;let items=[];for(const e of data.expressions)for(const m of data.mascots){if(character!=='all'&&m.id!==character)continue;if(category!=='All'&&e.category!==category)continue;if(q&&![e.id,e.name,e.category,m.name,...e.tags].join(' ').toLowerCase().includes(q))continue;items.push({m,e})}$('#result').textContent=`${items.length} reaction${items.length===1?'':'s'}${format==='gif'?' · animated loops':' · transparent stickers'}`;$('#grid').replaceChildren();for(const {m,e} of items.slice(0,limit)){const card=document.createElement('article');card.className='card';const open=document.createElement('button');open.className='card-open';open.setAttribute('aria-label',`Preview ${m.name} ${e.name}`);const stage=document.createElement('div');stage.className=`stage ${m.id}-stage`;const tag=document.createElement('span');tag.className='format-tag';tag.textContent=format==='gif'?'ANIMATED / LOOP':'PNG / STILL';const img=document.createElement('img');configurePreview(img,m,e,format==='gif'&&!reduced,true);img.alt=`${m.name} ${e.name}`;img.loading='lazy';img.width=288;img.height=288;const expand=document.createElement('span');expand.className='expand';expand.textContent='↗';stage.append(tag,img,expand);open.append(stage);open.onclick=()=>show(m,e);const info=document.createElement('div');info.className='card-info';const names=document.createElement('div'),h=document.createElement('h3'),sub=document.createElement('p');h.textContent=e.name;sub.className='character-name';sub.textContent=m.name;names.append(h,sub);const link=document.createElement('a');link.href=asset(m,e,format);link.download=`${m.id}-${e.id}.${format}`;link.className='quick-download';link.textContent='↓';link.setAttribute('aria-label',`Download ${m.name} ${e.name} ${format.toUpperCase()}`);info.append(names,link);card.append(open,info);$('#grid').append(card)}if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='No matches yet. Try another feeling, emoji or character.';$('#grid').append(p)}$('#more').hidden=items.length<=limit;$('#motion-note').hidden=!(format==='gif'&&reduced)}
function show(m,e){active={m,e};$('#detail-title').textContent=e.name;$('#detail-character').textContent=`${m.name} / ${e.category}`;$('#detail-stage').className=`detail-stage ${m.id}-stage`;$('#detail .fineprint').textContent=`Transparent PNG 384 px · GIF/WebP 288 px · ${e.fps||25} fps · ${(e.durationMs/1000).toFixed(2)}-second animation`;$('#detail-image').alt=`${m.name} ${e.name}`;preview(format==='gif'&&!reduced);$('#downloads').replaceChildren();for(const f of ['png','gif','webp']){const a=document.createElement('a');a.href=asset(m,e,f);a.download=`${m.id}-${e.id}.${f}`;a.textContent=f.toUpperCase();const arrow=document.createElement('span');arrow.textContent='↓';a.append(arrow);$('#downloads').append(a)}$('#source').href=url(`${m.pack}?v=9`);$('#detail').showModal()}
function preview(play){if(!active)return;previewing=play;configurePreview($('#detail-image'),active.m,active.e,play,false);$('#still').setAttribute('aria-pressed',String(!play));$('#play').setAttribute('aria-pressed',String(play))}
$('#still').onclick=()=>preview(false);$('#play').onclick=()=>preview(true);$('#close').onclick=()=>{$('#detail').close();preview(false)};$('#detail').addEventListener('close',()=>preview(false));$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#characters').onclick=e=>{const b=e.target.closest('button');if(!b)return;character=b.dataset.character;limit=24;pressed($('#characters'),b);render()};$('#formats').onclick=e=>{const b=e.target.closest('button');if(!b)return;format=b.dataset.format;limit=24;pressed($('#formats'),b);render()};$('#search').oninput=()=>{limit=24;render()};$('#clear').onclick=()=>{$('#search').value='';limit=24;render();$('#search').focus()};$('#reset').onclick=()=>{character='all';category='All';format='png';limit=24;$('#search').value='';pressed($('#characters'),$('#characters button'));pressed($('#formats'),$('#formats button'));pressed($('#categories'),$('#categories button'));render()};$('#more').onclick=()=>{limit+=24;render()};
fetch(url('./catalog.json?v=9'),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then(d=>{data=d;for(const name of ['All',...new Set(data.expressions.map(e=>e.category))]){const b=document.createElement('button');b.textContent=name;b.setAttribute('aria-pressed',String(name==='All'));b.onclick=()=>{category=name;limit=24;pressed($('#categories'),b);render()};$('#categories').append(b)}render()}).catch(()=>{$('#result').textContent='The collection could not load. Please reload the page.'});

const systemTheme=matchMedia('(prefers-color-scheme: dark)');
let manualTheme=false;
try { manualTheme=['light','dark'].includes(localStorage.getItem('mascot-theme')); } catch {}
function setTheme(theme,persist=false){
 document.documentElement.dataset.theme=theme;
 const dark=theme==='dark',b=$('#theme-toggle');
 b.textContent=dark?'☀':'☾';
 b.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
 b.setAttribute('aria-pressed',String(dark));
 document.querySelector('meta[name="theme-color"]').content=dark?'#151519':'#f8f7f4';
 if(persist){manualTheme=true;try{localStorage.setItem('mascot-theme',theme)}catch{}}
}
setTheme(document.documentElement.dataset.theme||'light');
$('#theme-toggle').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true);
systemTheme.addEventListener('change',e=>{if(!manualTheme)setTheme(e.matches?'dark':'light')});

motionPreference.addEventListener('change',e=>{reduced=e.matches;render();if(reduced&&active)preview(false);});
