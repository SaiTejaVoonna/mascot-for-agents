const $ = selector => document.querySelector(selector);
const BASE = new URL('../', document.baseURI);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width:760px)');
const scheme = matchMedia('(prefers-color-scheme: dark)');
const svg = path => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const icons = {
 heart:svg('<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>'),
 search:svg('<circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 5 5"/>'),
 play:svg('<path d="m9 5 11 7-11 7Z"/>'),pause:svg('<path d="M8 5v14M16 5v14"/>'),
 arrow:svg('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
 down:svg('<path d="M12 3v13m-5-5 5 5 5-5M5 17v4h14v-4"/>'),
 info:svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>'),
 close:svg('<path d="m6 6 12 12M6 18 18 6"/>'),
 moon:svg('<path d="M20 14a8.5 8.5 0 0 1-10-10 8.5 8.5 0 1 0 10 10Z"/>'),
 sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>')
};
const read = (key,fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}};
const write = (key,value) => {try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let saved = new Set(Array.isArray(read('mascot-favorites',[])) ? read('mascot-favorites',[]) : []);
let manualTheme; try{manualTheme=localStorage.getItem('mascot-theme')}catch{}
function theme(value,persist=false){document.documentElement.dataset.theme=value;const dark=value==='dark';$('#theme-toggle').innerHTML=icons[dark?'sun':'moon'];$('#theme-toggle').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');$('#theme-toggle').setAttribute('aria-pressed',String(dark));document.querySelector('meta[name=theme-color]').content=dark?'#20231e':'#f6f4ed';if(persist){manualTheme=value;try{localStorage.setItem('mascot-theme',value)}catch{}}}
theme(['dark','light'].includes(manualTheme)?manualTheme:scheme.matches?'dark':'light');
$('#theme-toggle').onclick=()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark',true);
scheme.addEventListener('change',()=>{if(!['dark','light'].includes(manualTheme))theme(scheme.matches?'dark':'light')});
$('#search-icon').innerHTML=icons.search;$('#close-preview').innerHTML=icons.close;$('#download-icon').innerHTML=icons.down;$('#note-icon').innerHTML=icons.info;
document.querySelectorAll('.button-arrow').forEach(e=>e.innerHTML=icons.arrow);
document.querySelectorAll('.pack-arrow').forEach(e=>e.innerHTML=icons.down);
const pressed=(selector,attr,value)=>document.querySelectorAll(selector+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===value)));
document.querySelectorAll('a[href^="#"]').forEach(a=>a.dataset.fragment=a.getAttribute('href'));
let catalog,all=[],char='all',mood='all',mode=reduced.matches?'still':'animated',format='webp',limit=12,selected='claude:hello',paused=reduced.matches,heroPaused=reduced.matches,onlySaved=false,trigger;
const visible=new Set(), failures=new Map();
const title=c=>c==='gpt'?'GPT':'Claude';
const asset=(e,ext)=>new URL(`assets/collection/${e.char}-v5/${e.id}.${ext}?v=9`,BASE).href;
function image(img,e,ext){
 const key=e.char+':'+e.id+':'+ext;const fallback=failures.get(key)||ext;const next=asset(e,fallback);
 if(img.src===next)return;
 img.onerror=()=>{if(fallback==='webp'){failures.set(key,'gif');image(img,e,ext)}else if(fallback==='gif'){failures.set(key,'png');image(img,e,ext)}else{img.onerror=null;img.alt=`${title(e.char)} ${e.name||e.id} preview unavailable`}};
 img.src=next;
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const img=entry.target;const e=all.find(e=>e.key===img.dataset.key);if(!e)continue;if(entry.isIntersecting)visible.add(e.key);else visible.delete(e.key);image(img,e,entry.isIntersecting&&mode==='animated'&&!document.hidden?'webp':'png')}},{rootMargin:'40px'});
function syncURL(){const u=new URL(location.href);for(const [key,value] of Object.entries({character:char==='all'?'':char,mood:mood==='all'?'':mood,q:$('#search').value.trim(),view:mode==='animated'?'':mode,reaction:selected==='claude:hello'?'':selected,saved:onlySaved?'1':''})){if(value)u.searchParams.set(key,value);else u.searchParams.delete(key)}history.replaceState(null,'',u);document.querySelectorAll('a[data-fragment]').forEach(a=>a.href=u.pathname+u.search+a.dataset.fragment)}
function updateSaved(){ $('#saved-toggle').innerHTML=icons.heart+`Saved <span>(${saved.size})</span>`;$('#saved-toggle').setAttribute('aria-pressed',String(onlySaved)) }
function render(){
 observer.disconnect();visible.clear();const q=$('#search').value.toLowerCase().trim();
 const items=all.filter(e=>(char==='all'||e.char===char)&&(!onlySaved||saved.has(e.key))&&(!q||[e.name,e.char,e.category,...e.tags].join(' ').toLowerCase().includes(q))&&(mood==='all'||mood==='work'&&e.category==='Work'||mood==='joy'&&e.category==='Joy'||mood==='feelings'&&['Everyday','Attitude','Shy','Sad','Surprise'].includes(e.category)||mood==='actions'&&['Actions','Gestures'].includes(e.category)));
 $('#results').textContent=`${items.length} reaction${items.length===1?'':'s'}${mode==='animated'?' in motion':' as stickers'}`;
 $('#reset').hidden=char==='all'&&mood==='all'&&!q&&!onlySaved;$('#more').hidden=items.length<=limit;
 $('#grid').innerHTML=items.length?items.slice(0,limit).map(e=>`<article class="card ${selected===e.key?'selected':''}"><button class="art-button" data-key="${e.key}" aria-label="Preview ${title(e.char)} ${e.name}" aria-pressed="${selected===e.key}"><img src="${asset(e,'png')}" alt="${title(e.char)} ${e.name}" data-key="${e.key}" loading="lazy" width="288" height="288"><span class="card-arrow">${icons.arrow}</span></button><button class="heart" data-save="${e.key}" aria-label="Save ${title(e.char)} ${e.name}" aria-pressed="${saved.has(e.key)}">${icons.heart}</button><div class="card-meta"><div><h3>${e.name}</h3><small><span class="char-dot ${e.char}"></span>${title(e.char)}</small></div></div></article>`).join(''):'<div class="empty"><p>No matching reactions. Try another feeling or clear your filters.</p><button id="empty-reset">Clear filters</button></div>';
 $('#grid').setAttribute('aria-busy','false');$('#empty-reset')?.addEventListener('click',reset);
 document.querySelectorAll('#grid img').forEach(i=>observer.observe(i));updateSaved();syncURL();
}
const descriptions={hello:'A little wave. A good place to start.',thinking:'For the moments that need a little more thought.',celebrating:'For the tiny wins. And the very big ones.',happy:'No extra words needed.',love:'A little affection goes a long way.',dancing:'A tiny dance break feels about right.',focused:'Head down. Getting somewhere.',laughing:'When the joke lands a little too well.',walking:'One little step at a time.'};
function updatePreview(){const e=all.find(e=>e.key===selected);if(!e)return;image($('#preview-image'),e,paused||document.hidden||(phone.matches&&!$('#mobile-preview').open)?'png':'webp');$('#preview-image').alt=title(e.char)+' '+e.name;$('#preview-category').textContent=title(e.char)+' / '+e.category;$('#preview-title').textContent=e.name;$('#preview-description').textContent=descriptions[e.id]||e.name+' reaction.';$('#preview-pause').innerHTML=icons[paused?'play':'pause'];$('#preview-pause').setAttribute('aria-label',paused?'Play selected animation':'Pause selected animation');$('#preview-specs').textContent=format==='png'?'384 × 384 px':`288 px / ${e.fps} fps / ${(e.durationMs/1000).toFixed(2)} s`;$('#download').href=asset(e,format);$('#download').download=`${e.char}-${e.id}.${format}`;$('#download span').textContent='Download '+format.toUpperCase();pressed('#formats','format',format);document.querySelectorAll('.art-button').forEach(b=>{b.closest('.card').classList.toggle('selected',b.dataset.key===selected);b.setAttribute('aria-pressed',String(b.dataset.key===selected))})}
function hero(){for(const [id,c,e] of [['hero-claude','claude','hello'],['hero-gpt','gpt','thinking']])image($('#'+id),{char:c,id:e},heroPaused||document.hidden?'png':'webp');$('#hero-pause').innerHTML=icons[heroPaused?'play':'pause']+(heroPaused?'Play':'Pause');$('#hero-pause').setAttribute('aria-label',heroPaused?'Play hero animation':'Pause hero animation')}
function closePreview(){if($('#mobile-preview').open)$('#mobile-preview').close()}
$('#mobile-preview').addEventListener('close',()=>{document.querySelector('.workspace').append($('#desk'));updatePreview();if(trigger?.isConnected)trigger.focus({preventScroll:true})});
$('#close-preview').onclick=closePreview;
$('#mobile-preview').addEventListener('click',event=>{if(event.target===$('#mobile-preview')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePreview()}});
phone.addEventListener('change',()=>{if(!phone.matches)closePreview()});
function reset(){char='all';mood='all';onlySaved=false;limit=12;$('#search').value='';pressed('#characters','value',char);pressed('#moods','value',mood);render();$('#search').focus({preventScroll:true})}
$('#reset').onclick=reset;
$('#search').addEventListener('input',()=>{if(!catalog)return;limit=12;render()});
$('#characters').onclick=ev=>{const b=ev.target.closest('button');if(!b||!catalog)return;char=b.dataset.value;pressed('#characters','value',char);limit=12;render()};
$('#moods').onclick=ev=>{const b=ev.target.closest('button');if(!b||!catalog)return;mood=b.dataset.value;pressed('#moods','value',mood);limit=12;render()};
$('#modes').onclick=ev=>{const b=ev.target.closest('button');if(!b||!catalog)return;mode=b.dataset.value;paused=heroPaused=mode==='still';pressed('#modes','value',mode);render();updatePreview();hero()};
$('#grid').onclick=ev=>{const heart=ev.target.closest('[data-save]');if(heart){const key=heart.dataset.save;saved.has(key)?saved.delete(key):saved.add(key);write('mascot-favorites',[...saved]);if(onlySaved)render();else{heart.setAttribute('aria-pressed',String(saved.has(key)));updateSaved()}return}const b=ev.target.closest('.art-button');if(!b)return;selected=b.dataset.key;paused=mode==='still';updatePreview();syncURL();if(phone.matches){trigger=b;$('#mobile-preview').append($('#desk'));$('#mobile-preview').showModal();updatePreview()}};
$('#saved-toggle').onclick=()=>{if(!catalog)return;onlySaved=!onlySaved;limit=12;render()};$('#more').onclick=()=>{limit+=12;render()};
$('#formats').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;format=b.dataset.format;updatePreview()};$('#preview-pause').onclick=()=>{paused=!paused;updatePreview()};$('#hero-pause').onclick=()=>{heroPaused=!heroPaused;hero()};
document.querySelectorAll('.tone-switch button').forEach(b=>b.onclick=()=>{$('#preview-stage').dataset.tone=b.dataset.tone;pressed('.tone-switch','tone',b.dataset.tone)});
document.addEventListener('keydown',ev=>{if(ev.key==='/'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!$('#mobile-preview').open&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){ev.preventDefault();$('#search').focus()}});
document.addEventListener('visibilitychange',()=>{document.querySelectorAll('#grid img').forEach(i=>{const e=all.find(e=>e.key===i.dataset.key);image(i,e,!document.hidden&&visible.has(e.key)&&mode==='animated'?'webp':'png')});hero();updatePreview()});
reduced.addEventListener('change',ev=>{if(ev.matches){mode='still';paused=heroPaused=true;pressed('#modes','value',mode);if(catalog)render();hero();updatePreview()}});
$('#download').onclick=async ev=>{if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;ev.preventDefault();const a=ev.currentTarget;if(a.getAttribute('aria-busy')==='true')return;const href=a.href,name=a.download,label=a.querySelector('span').textContent;a.setAttribute('aria-busy','true');a.querySelector('span').textContent='Preparing download…';try{const r=await fetch(href);if(!r.ok)throw Error('download');const blob=await r.blob(),objectURL=URL.createObjectURL(blob),link=document.createElement('a');link.href=objectURL;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);$('#toast').textContent='Download started.'}catch{$('#toast').textContent='Download could not start. Try again or use a character pack below.'}finally{a.removeAttribute('aria-busy');a.querySelector('span').textContent=label}};
for(const [id,c,e] of [['pack-gpt','gpt','happy'],['pack-claude','claude','happy'],['foot-1','claude','love'],['foot-2','gpt','happy'],['foot-3','claude','celebrating']])image($('#'+id),{char:c,id:e},'png');
hero();
async function load(){try{const response=await fetch(new URL('catalog.json?v=9',document.baseURI));if(!response.ok)throw Error('catalog');catalog=await response.json();const preferred=['hello','thinking','celebrating','happy','love','dancing','focused','laughing','walking'];const expressions=[...catalog.expressions].sort((a,b)=>(preferred.includes(a.id)?preferred.indexOf(a.id):99)-(preferred.includes(b.id)?preferred.indexOf(b.id):99));all=expressions.flatMap(e=>['claude','gpt'].map(c=>({...e,char:c,key:c+':'+e.id})));const params=new URLSearchParams(location.search);char=['gpt','claude'].includes(params.get('character'))?params.get('character'):'all';mood=['work','joy','feelings','actions'].includes(params.get('mood'))?params.get('mood'):'all';if(params.get('view')==='still')mode='still';onlySaved=params.get('saved')==='1';$('#search').value=params.get('q')||'';if(all.some(e=>e.key===params.get('reaction')))selected=params.get('reaction');paused=heroPaused=mode==='still';pressed('#characters','value',char);pressed('#moods','value',mood);pressed('#modes','value',mode);render();updatePreview();hero()}catch{$('#grid').setAttribute('aria-busy','false');$('#results').textContent='Collection unavailable';$('#grid').innerHTML='<div class="empty"><p>The reactions could not load. Check your connection and try again.</p><button id="retry">Retry loading</button></div>';$('#retry').onclick=load;$('#more').hidden=true}}
load();

