// A dependency-free editor shell. Existing controls retain their IDs and listeners.
export function setupStudio({readScene,restoreScene,restoreSource}) {
  const $=id=>document.getElementById(id),editor=document.querySelector('.editor');
  const performance=document.querySelector('.performance');
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;};
  const script=make('div','studio-panel');
  while(editor.firstChild)script.append(editor.firstChild);
  const bar=make('div','inspector-heading'),title=make('h2','','Scene studio');
  const saved=make('span','draft-state','Local workspace');saved.id='draft-state';
  bar.append(title,saved);
  const tabs=make('div','studio-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Scene editor');
  const panels=[{id:'script',name:'Script',panel:script}];
  for(const [id,name,selector] of [['voices','Voices','.voice-settings'],['scene','Scene','.scene-settings'],['sound','Sound','.sound-settings']]) {
    const panel=make('div','studio-panel'),details=performance.querySelector(selector);
    const heading=make('h3','panel-title',name==='Scene'?'Scene & playback':name==='Voices'?'Voices & delivery':'Sound & atmosphere');
    panel.append(heading);details.open=true;panel.append(details);panels.push({id,name,panel});
  }
  const help=make('p','studio-footnote','Free browser tools. No account or API key. Dialogue and settings save on this device; mascot positions reset on reload.');
  editor.append(bar,tabs);
  function activate(id,focus=false) {
    for(const item of panels){const active=item.id===id;item.panel.hidden=!active;item.button.setAttribute('aria-selected',String(active));item.button.tabIndex=active?0:-1;if(active&&focus)item.button.focus();}
  }
  for(const item of panels) {
    const button=make('button','',item.name);item.button=button;button.type='button';button.id=`tab-${item.id}`;
    button.setAttribute('role','tab');button.setAttribute('aria-controls',`panel-${item.id}`);
    item.panel.id=`panel-${item.id}`;item.panel.setAttribute('role','tabpanel');item.panel.setAttribute('aria-labelledby',button.id);
    button.addEventListener('click',()=>activate(item.id));
    button.addEventListener('keydown',event=>{
      const index=panels.indexOf(item);let next;
      if(event.key==='ArrowRight')next=(index+1)%panels.length;
      if(event.key==='ArrowLeft')next=(index+panels.length-1)%panels.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=panels.length-1;
      if(next!==undefined){event.preventDefault();activate(panels[next].id,true);}
    });
    tabs.append(button);editor.append(item.panel);
  }
  editor.append(help);activate('script');
  // Playback comes first; exploration is a separate, labelled tool below it.
  $('status').after($('world-controls'));
  $('status').after($('error'));
  const focus=$('focus-stage');
  const setFocus=on=>{document.body.classList.toggle('stage-focus',on);focus.textContent=on?'Back to editor':'Focus stage';focus.setAttribute('aria-pressed',String(on));};
  focus.addEventListener('click',()=>setFocus(!document.body.classList.contains('stage-focus')));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('stage-focus')){setFocus(false);focus.focus();}});
  // Output labels make sound sliders usable without guessing their value.
  for(const id of ['voice-volume','effects-volume','ambience-volume','sound-pitch','light']) {
    const input=$(id),output=make('output','slider-readout');output.htmlFor=id;input.before(output);
    const update=()=>{output.value=id==='sound-pitch'?`${Number(input.value).toFixed(2)}×`:`${Math.round(Number(input.value)*100)}%`;};
    input.addEventListener('input',update);input.addEventListener('change',update);update();
  }
  const key='little-theatre-draft-v1';let timer;
  try {
    const draft=JSON.parse(localStorage.getItem(key));
    if(draft?.scene){restoreScene(draft.scene);saved.textContent='Draft restored';
      for(const id of ['voice-volume','effects-volume','ambience-volume','sound-pitch','light'])$(id).dispatchEvent(new Event('input'));
    }
    else if(typeof draft?.source==='string'&&draft.source.length<=4000){restoreSource(draft.source);saved.textContent='Draft restored · unfinished line';}
  }catch{saved.textContent='Local workspace';}
  const persist=()=>{
    const draft={source:$('script').value,savedAt:Date.now()};
    try{draft.scene=readScene();}catch{/* Preserve unfinished source too. Play still validates it. */}
    try{localStorage.setItem(key,JSON.stringify(draft));saved.textContent=draft.scene?'Saved on this device':'Draft saved · unfinished line';}
    catch(reason){saved.textContent=reason.name==='QuotaExceededError'?'Storage full · export your scene':'Local saving unavailable · export scene';}
  };
  const schedule=()=>{saved.textContent='Saving…';clearTimeout(timer);timer=setTimeout(persist,450);};
  document.addEventListener('input',event=>{if(event.target.closest('.editor,.performance'))schedule();});
  document.addEventListener('change',event=>{if(event.target.closest('.editor,.performance'))schedule();});
  document.addEventListener('click',event=>{if(event.target.closest('[data-insert],[data-remove],[data-textmode],#load-example,[data-delivery]'))schedule();});
  window.addEventListener('pagehide',persist);
}
