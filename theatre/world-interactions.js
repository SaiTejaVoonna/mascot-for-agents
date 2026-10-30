// Percent coordinates belong to the 960 × 540 SVG. Travel uses only transforms.
export function setupWorld({stageSound,isPerforming}) {
  const $=id=>document.getElementById(id),stage=$('stage'),controls=$('world-controls');
  const homes={claude:{x:29.5,y:64.83,w:25},gpt:{x:74,y:64.6,w:20}};
  const names={claude:'Claude',gpt:'GPT'};
  const actors=Object.fromEntries(Object.entries(homes).map(([id,home])=>[id,{...home,el:$(`actor-${id}`),seated:false,token:0}]));
  let selected='claude';
  const say=text=>{$('world-status').textContent=text;};
  const still=()=>document.body.classList.contains('still')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const position=(id,x,y)=>`translate(${(x-homes[id].x)/homes[id].w*100}%,${(y-homes[id].y)/(homes[id].w*960/540)*100}%)`;
  function select(id) {
    selected=id;
    for(const [key,a] of Object.entries(actors)) {
      a.el.classList.toggle('world-selected',key===id);
      a.el.setAttribute('aria-pressed',String(key===id));
      controls.querySelector(`[data-world-actor="${key}"]`).setAttribute('aria-pressed',String(key===id));
    }
    $('world-sit').textContent=actors[id].seated?'Stand up':'Sit by fire';
    say(`${names[id]} selected. Tap the campsite to move, or use arrow keys on the world.`);
  }
  function restore(a) {
    clearTimeout(a.timer);
    if(a.saved) {
      const img=a.el.querySelector('img');
      if(img.getAttribute('src')===a.action) img.setAttribute('src',a.saved);
      a.saved=null;
    }
  }
  function art(id,action) {
    const a=actors[id]; restore(a);
    if(still()||isPerforming()) return;
    const img=a.el.querySelector('img');a.saved=img.getAttribute('src');
    a.action=`../assets/collection/${id}-v5/${action}.webp?v=9`;
    img.setAttribute('src',a.action);
  }
  async function move(id,x,y,{seat=false,home=false}={}) {
    const a=actors[id]; x=Math.max(20,Math.min(81,x));
    const reach=10*Math.sqrt(Math.max(0,1-((x-50)/36)**2));
    y=Math.max(66-reach,Math.min(66+reach,y));
    if(x>43&&x<57&&y<71) x=x<50?40:60;
    const other=actors[id==='claude'?'gpt':'claude'];
    if(!home&&Math.abs(x-other.x)<14&&Math.abs(y-other.y)<8) x=other.x>50?other.x-16:other.x+16;
    let from=position(id,a.x,a.y);
    if(a.travel) {from=getComputedStyle(a.el).transform;a.travel.cancel();}
    const token=++a.token,oldX=a.x,distance=Math.hypot(x-a.x,(y-a.y)*.5625);
    a.x=x;a.y=y;a.seated=false;a.el.classList.remove('world-seated');
    const to=position(id,x,y),frames=[{transform:from}];
    if((oldX<43&&x>57)||(oldX>57&&x<43)) frames.push({transform:position(id,(oldX+x)/2,75),offset:.5});
    frames.push({transform:to});a.el.style.transform=to;a.el.style.zIndex=String(Math.round(y));
    art(id,'walking');say(`${names[id]} is moving${seat?' to their seat':' around the campsite'}.`);
    if(!still()&&distance>1) {
      a.travel=a.el.animate(frames,{duration:Math.max(350,Math.min(2200,distance*55)),easing:'linear'});
      try{await a.travel.finished;}catch{return;}
    }
    if(token!==a.token)return;
    a.travel=null;restore(a);a.seated=seat;a.el.classList.toggle('world-seated',seat);
    if(selected===id)$('world-sit').textContent=seat?'Stand up':'Sit by fire';
    say(`${names[id]} ${seat?'is resting on their camp stool':'has arrived'}.`);
  }
  for(const [id,a] of Object.entries(actors)) {
    a.el.tabIndex=0;a.el.setAttribute('role','button');a.el.setAttribute('aria-label',`Select ${names[id]}`);
    a.el.addEventListener('click',e=>{
      const box=a.el.getBoundingClientRect(),x=(e.clientX-box.left)/box.width,y=(e.clientY-box.top)/box.height;
      // Transparent sprite padding must not swallow clicks on the ground.
      if(e.detail && (x<.08||x>.92||y>(id==='claude'?.79:.94)))return;
      e.stopPropagation();select(id);
    });
    a.el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();select(id);}});
  }
  controls.querySelectorAll('[data-world-actor]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.worldActor)));
  stage.tabIndex=0;stage.setAttribute('aria-describedby','world-status');
  stage.addEventListener('click',e=>{
    if(stage.dataset.scene!=='campfire')return;
    const box=stage.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*100,y=(e.clientY-box.top)/box.height*100;
    if(y<49||y>82){say('Choose a spot on the campsite ground.');return;}
    move(selected,x,y);
  });
  stage.addEventListener('keydown',e=>{
    if(stage.dataset.scene!=='campfire')return;
    const step={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-3],ArrowDown:[0,3]}[e.key];
    if(!step)return;e.preventDefault();move(selected,actors[selected].x+step[0],actors[selected].y+step[1]);
  });
  $('world-sit').addEventListener('click',()=>{
    const a=actors[selected];
    if(a.seated){a.seated=false;a.el.classList.remove('world-seated');$('world-sit').textContent='Sit by fire';say(`${names[selected]} is standing.`);}
    else move(selected,homes[selected].x,homes[selected].y,{seat:true,home:true});
  });
  $('world-wave').addEventListener('click',()=>{
    const a=actors[selected];if(a.travel){say('Let the mascot arrive, then wave.');return;}
    art(selected,'hello');
    if(!still())a.el.querySelector('.actor-art').animate([{transform:'rotate(0deg)'},{transform:'rotate(-5deg)',offset:.3},{transform:'rotate(4deg)',offset:.65},{transform:'rotate(0deg)'}],{duration:650,easing:'ease-in-out',composite:'add'});
    say(`${names[selected]} says hello.`);a.timer=setTimeout(()=>restore(a),3000);
  });
  $('world-fire').addEventListener('click',()=>{
    const on=stage.dataset.fire==='off';stage.dataset.fire=on?'on':'off';
    $('world-fire').textContent=on?'Put fire out':'Light fire';$('world-fire').setAttribute('aria-pressed',String(on));
    if(!on)stageSound.stopAmbience();
    else if(isPerforming()&&$('ambience').checked)stageSound.startAmbience('campfire');
    say(on?'The campfire is lit.':'The campfire is out.');
  });
  $('world-reset').addEventListener('click',()=>{for(const id of Object.keys(actors))move(id,homes[id].x,homes[id].y,{home:true});});
  let currentStage;
  function syncScene(){
    if(currentStage===stage.dataset.scene)return;
    currentStage=stage.dataset.scene;
    controls.hidden=stage.dataset.scene!=='campfire';
    for(const [id,a] of Object.entries(actors)){
      a.token++;a.travel?.cancel();a.travel=null;restore(a);a.el.style.transform='';
      a.el.classList.remove('world-seated','world-selected');a.el.tabIndex=controls.hidden?-1:0;
      a.x=homes[id].x;a.y=homes[id].y;a.seated=false;
    }
    if(!controls.hidden)select(selected);
  }
  new MutationObserver(syncScene).observe(stage,{attributes:true,attributeFilter:['data-scene']});syncScene();
}
