/* A user-started, illustrative story on top of the original firm graph. */
(() => {
  'use strict';
  const explorer = document.querySelector('.oa-memory-explorer');
  const viewport = explorer?.querySelector('.oa-graph-viewport');
  const api = window.OakbaseMemoryExplorer;
  if (!explorer || !viewport || !api?.story) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const source = window.OakbaseFirmGraph.build();
  const originals = new Map(source.nodes.map(node => [node.id, node]));
  const copy = {
    es: {
      play:'Reproducir historia', pause:'Pausar', resume:'Continuar', replay:'Volver a reproducir', reset:'Volver al grafo',
      intro:'De un correo a una tarea. Así se conecta el trabajo.', introSmall:'Pulsa reproducir para ver el ejemplo.',
      steps:['El contexto','El correo','El compromiso','La tarea','El agente'],
      titles:['Todo empieza con lo que tu firma ya sabe.','Un correo incorpora una nueva señal.','El compromiso queda conectado al contexto.','Lo acordado se convierte en una tarea.','El agente te lo trae, sin que tengas que preguntar.'],
      subtitles:['Un cliente, su asunto y las personas que trabajan en él.','Una promesa concreta, dentro de una conversación de trabajo.','Qué hay que hacer, quién lo hará y para cuándo.','Una acción pendiente, con responsable, fecha y evidencia.','Recupera la tarea del Brain y avisa a la persona responsable.'],
      status:['Contexto compartido','Nueva señal de trabajo','Compromiso identificado','Tarea preparada','Aviso proactivo'],
      contextTitle:'El contexto ya está conectado', contextText:'Grupo Olivar está preparando una adquisición. Marta es el contacto del cliente. Álex participó en la reunión del jueves.',
      sourceLabel:'Fuente', sourceText:'Reunión del jueves · calendario', emailTitle:'Presupuesto de la adquisición', emailMeta:'Álex → Marta · correo enviado',
      emailText:'Hola Marta, me comprometo a enviarte el presupuesto actualizado el viernes antes de las 12:00.',
      captured:'El Brain interpreta el correo', commitmentTitle:'Enviar presupuesto actualizado', owner:'Responsable', person:'Álex', due:'Fecha límite', deadline:'Viernes · 12:00', matter:'Asunto', matterName:'Adquisición de Olivar',
      commitmentBody:'El compromiso queda vinculado al asunto, a Álex y al correo que lo acredita.', taskTitle:'Enviar presupuesto actualizado a Marta', taskBody:'La tarea conserva el compromiso y su evidencia. Está pendiente de realizar.', pending:'Pendiente', created:'Creada desde el compromiso',
      agentLabel:'Tu agente de operaciones', agentTitle:'Un compromiso necesita tu atención', agentBody:'Álex, tienes pendiente enviar el presupuesto actualizado a Marta. Te comprometiste para el viernes a las 12:00.', agentFoot:'Recuperado del Brain · con el correo de origen', taskButton:'Ver tarea y evidencia', back:'Volver al aviso',
      illustration:'Ejemplo ilustrativo de la experiencia del Brain en desarrollo. No envía correos ni crea tareas reales.',
      relation:['tiene un asunto','participó en','contacto de','origina','se convierte en'], selected:'Elemento seleccionado', recorded:'Correo de Álex a Marta',
      newEmail:'Correo de Álex', newCommitment:'Enviar presupuesto', newTask:'Tarea pendiente', nodeTypes:{Client:'Cliente',Matter:'Asunto',Person:'Profesional',Contact:'Contacto',Source:'Reunión',Email:'Correo',Commitment:'Compromiso',Task:'Tarea'},
      read:'Leer el correo de origen', close:'Cerrar detalle', complete:'Historia completada', stepLabel:'Ir al paso', provenance:'Evidencia del compromiso',
    },
    en: {
      play:'Play the story', pause:'Pause', resume:'Continue', replay:'Replay story', reset:'Back to the graph',
      intro:'From an email to a task. See how work connects.', introSmall:'Press play to explore the example.',
      steps:['Context','Email','Commitment','Task','Agent'],
      titles:['It starts with what your firm already knows.','An email brings in a new work signal.','The commitment connects to its context.','What was agreed becomes a task.','Your agent brings it to you, before you ask.'],
      subtitles:['A client, their matter and the people working on it.','A specific promise, made in the course of everyday work.','What needs doing, who will do it and by when.','A pending action, with an owner, a deadline and evidence.','It retrieves the task from the Brain and notifies its owner.'],
      status:['Shared context','New work signal','Commitment identified','Task prepared','Proactive notification'],
      contextTitle:'The context is already connected', contextText:'Alder Ltd. is preparing an acquisition. Maya is the client contact. Alex attended the Thursday meeting.',
      sourceLabel:'Source', sourceText:'Thursday meeting · calendar', emailTitle:'Acquisition fee estimate', emailMeta:'Alex → Maya · sent email',
      emailText:'Hi Maya, I commit to sending you the revised fee estimate by Friday before 12 pm.',
      captured:'The Brain interprets the email', commitmentTitle:'Send revised fee estimate', owner:'Owner', person:'Alex', due:'Due date', deadline:'Friday · 12 pm', matter:'Matter', matterName:'Alder acquisition',
      commitmentBody:'The commitment is linked to the matter, to Alex and to the email that supports it.', taskTitle:'Send revised fee estimate to Maya', taskBody:'The task retains the commitment and its evidence. The work is still pending.', pending:'Pending', created:'Created from the commitment',
      agentLabel:'Your operations agent', agentTitle:'A commitment needs your attention', agentBody:'Alex, you have a revised fee estimate to send to Maya. You committed to Friday before 12 pm.', agentFoot:'Retrieved from the Brain · with the source email', taskButton:'View task and evidence', back:'Back to the notification',
      illustration:'Illustrative example of the Brain experience in development. No real emails are sent or tasks created.',
      relation:['has a matter','attended','contact at','creates','becomes'], selected:'Selected item', recorded:'Email from Alex to Maya',
      newEmail:'Email from Alex', newCommitment:'Send fee estimate', newTask:'Pending task', nodeTypes:{Client:'Client',Matter:'Matter',Person:'Professional',Contact:'Contact',Source:'Meeting',Email:'Email',Commitment:'Commitment',Task:'Task'},
      read:'Read the source email', close:'Close detail', complete:'Story complete', stepLabel:'Go to step', provenance:'Commitment evidence',
    },
  };
  let step=-1, playing=false, timer=0, focusTimer=0, dueAt=0, remaining=0, detail='', completed=false, cameraReady=false, generation=0;
  const durations=[6500,6500,5500,5500,7000];
  const lang=()=>document.documentElement.lang==='es'?'es':'en';
  const c=()=>copy[lang()];
  const t=value=>window.OakbaseI18n?.t(value)||value;
  const icon=name=>({play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',check:'<path d="m5 12 4 4L19 6"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'}[name]||'');
  const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon(name)}</svg>`;
  const control=document.createElement('div');control.className='oa-story-controls';
  control.innerHTML='<button type="button" class="oa-story-play"><span data-story-icon></span><span data-story-play-label></span></button><button type="button" class="oa-story-reset" hidden></button>';
  explorer.querySelector('.oa-graph-toolbar').append(control);
  const intro=document.createElement('div');intro.className='oa-story-intro';
  intro.innerHTML='<span data-story-intro></span><span data-story-intro-small></span>';
  explorer.querySelector('.oa-graph-toolbar').after(intro);
  // This layer only contains the annotation. All nodes and edges remain in the
  // original explorer layers, rendered by its original camera.
  const stage=document.createElement('div');stage.className='oa-story-stage';stage.hidden=true;
  stage.innerHTML='<svg class="oa-story-pointer" aria-hidden="true"><path></path></svg><aside class="oa-story-panel" aria-live="polite" aria-atomic="true"></aside>';
  viewport.append(stage);
  const footer=document.createElement('div');footer.className='oa-story-footer';footer.hidden=true;
  footer.innerHTML='<div class="oa-story-steps" role="group"></div><p class="oa-story-disclosure"></p><span class="oa-story-announcement" role="status" aria-live="polite"></span>';
  explorer.querySelector('.oa-graph-caption').after(footer);
  const play=control.querySelector('.oa-story-play'),reset=control.querySelector('.oa-story-reset'),panel=stage.querySelector('.oa-story-panel');
  const anchors=['alder','story_email','story_commitment','story_task','story_agent'];
  function syncCopy(){
    const x=c();
    api.story.setCopy({nodes:{
      story_email:{name:x.newEmail,description:x.emailText,source:x.recorded,quote:x.emailText},
      story_commitment:{name:x.commitmentTitle,description:x.commitmentBody,source:x.recorded,quote:x.emailText},
      story_task:{name:x.taskTitle,description:x.taskBody,source:x.recorded,quote:x.emailText},
      story_agent:{name:x.agentLabel,description:x.agentBody,source:x.recorded,quote:x.emailText},
    },edges:{'sent':lang()==='es'?'envía':'sent','records commitment':x.relation[3],'becomes task':x.relation[4],'retrieved by':lang()==='es'?'recupera':'retrieves','addressed to':lang()==='es'?'dirigido a':'addressed to','owned by':lang()==='es'?'responsable':'owned by','concerns':lang()==='es'?'corresponde a':'concerns','assigned to':lang()==='es'?'responsable':'assigned to'}});
  }
  function email(){return `<div class="oa-story-card-top">${svg('mail')}<span>${c().emailMeta}</span></div><h4>${c().emailTitle}</h4><blockquote>${c().emailText}</blockquote><div class="oa-story-card-note">${c().matter} · ${c().matterName}</div>`;}
  function fields(){return `<dl><div><dt>${c().owner}</dt><dd>${c().person}</dd></div><div><dt>${c().due}</dt><dd>${c().deadline}</dd></div><div><dt>${c().matter}</dt><dd>${c().matterName}</dd></div></dl>`;}
  function renderPanel(){
    if(step<0)return;const x=c();let html='';
    if(detail&&!detail.startsWith('story_')){
      const node=originals.get(detail);if(!node)return;
      const description=typeof node.description==='object'?node.description[lang()]:t(node.description);
      html=`<span class="oa-story-card-label">${t(node.kind)}</span><h4>${t(node.name)}</h4><p>${description||x.contextText}</p><button type="button" class="oa-story-text-button" data-story-close>${x.close} ${svg('close')}</button>`;
    }else if(detail==='story_email'){
      html=`${email()}<button type="button" class="oa-story-text-button" data-story-close>${x.close} ${svg('close')}</button>`;
    }else if(detail==='story_task'||detail==='story_commitment'){
      html=`<span class="oa-story-card-label">${x.provenance}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<blockquote class="oa-story-evidence">${x.emailText}</blockquote><span class="oa-story-evidence-source">${x.recorded}</span><button type="button" class="oa-story-text-button" data-story-close>${step===4?x.back:x.close} ${svg('close')}</button>`;
    }else if(step===0){
      html=`<span class="oa-story-card-label">Shared Firm Brain</span><h4>${t(originals.get('alder').name)}</h4><p>${x.contextText}</p>`;
    }else if(step===1)html=email();
    else if(step===2)html=`<span class="oa-story-card-label">${x.captured}</span><h4>${x.commitmentTitle}</h4>${fields()}<button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else if(step===3)html=`<span class="oa-story-card-label">${x.created}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else html=`<div class="oa-story-card-top">${svg('bell')}<span>${x.agentLabel}</span></div><h4>${x.agentTitle}</h4><p class="oa-story-notification">${x.agentBody}</p><div class="oa-story-card-note">${x.agentFoot}</div><button type="button" class="oa-story-task-button" data-story-task>${x.taskButton} ${svg('arrow')}</button>`;
    panel.innerHTML=html;
    panel.querySelector('[data-story-evidence]')?.addEventListener('click',()=>{pause();detail='story_email';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-task]')?.addEventListener('click',()=>{pause();detail='story_task';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-close]')?.addEventListener('click',()=>{detail='';renderPanel();play.focus({preventScroll:true});});
    positionPanel();
  }
  function positionPanel(){
    if(step<0||!cameraReady){stage.hidden=true;return;}
    const point=api.story.getPoint(detail||anchors[step]);if(!point){stage.hidden=true;return;}
    stage.hidden=false;
    const w=viewport.clientWidth,h=viewport.clientHeight,pw=panel.offsetWidth,ph=panel.offsetHeight,mobile=w<740;
    let left,top;
    if(mobile){left=Math.max(12,(w-pw)/2);top=Math.min(h-ph-18,Math.max(300,point.y+58));}
    else{
      left=point.x+80;
      if(left+pw>w-18)left=point.x-pw-80;
      left=Math.max(18,Math.min(w-pw-18,left));top=Math.max(25,Math.min(h-ph-24,point.y-ph*.45));
    }
    panel.style.left=`${left}px`;panel.style.top=`${top}px`;
    const pointer=stage.querySelector('svg'),path=pointer.querySelector('path');pointer.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const endX=Math.max(left+12,Math.min(left+pw-12,point.x)),endY=mobile?top:Math.max(top+15,Math.min(top+ph-15,point.y));
    const x=mobile?endX:point.x<left?left:point.x>left+pw?left+pw:endX;
    path.setAttribute('d',`M ${point.x} ${point.y} L ${x} ${endY}`);
  }
  function renderControls(){
    const x=c(),label=playing?x.pause:step<0?x.play:completed?x.replay:x.resume;
    control.querySelector('[data-story-play-label]').textContent=label;control.querySelector('[data-story-icon]').innerHTML=svg(playing?'pause':'play');
    play.setAttribute('aria-label',label);reset.textContent=x.reset;reset.hidden=step<0;
    intro.querySelector('[data-story-intro]').textContent=step<0?x.intro:x.titles[step];
    intro.querySelector('[data-story-intro-small]').textContent=step<0?x.introSmall:`0${step+1} / 05 · ${x.status[step]}`;
    explorer.dataset.storyPaused=String(!playing);
  }
  function render(){
    syncCopy();renderControls();if(step<0)return;
    const x=c();stage.dataset.step=String(step);footer.querySelector('.oa-story-disclosure').textContent=x.illustration;
    const steps=footer.querySelector('.oa-story-steps');steps.setAttribute('aria-label',lang()==='es'?'Pasos de la historia':'Story steps');
    if(!steps.children.length)x.steps.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{pause();go(i);});steps.append(b);});
    [...steps.children].forEach((b,i)=>{b.innerHTML=`<span>0${i+1}</span>${x.steps[i]}`;b.setAttribute('aria-label',`${x.stepLabel} ${i+1}: ${x.steps[i]}`);b.setAttribute('aria-current',i===step?'step':'false');b.dataset.done=String(i<step);});
    renderPanel();footer.querySelector('[role=status]').textContent=x.titles[step]+' '+x.subtitles[step];
    explorer.querySelector('[data-graph-hint]').textContent=lang()==='es'?'El mismo grafo, enriquecido por el trabajo diario':'The same graph, enriched by everyday work';
  }
  function clearTimers(){clearTimeout(timer);clearTimeout(focusTimer);timer=focusTimer=0;}
  function schedule(){dueAt=performance.now()+remaining;timer=setTimeout(()=>{if(step<4)go(step+1);else{playing=false;completed=true;remaining=0;renderControls();footer.querySelector('[role=status]').textContent=c().complete;}},remaining);}
  async function startCamera(token){
    focusTimer=0;await api.story.begin({animate:!reduced.matches});
    if(token!==generation||step<0)return;
    cameraReady=true;positionPanel();
  }
  function go(next,opening=false){
    clearTimers();step=next;completed=false;detail='';remaining=durations[next];
    explorer.dataset.storyActive='true';footer.hidden=false;explorer.querySelector('[data-graph-explore]').hidden=true;
    const token=++generation;
    if(opening){
      cameraReady=false;stage.hidden=true;
      // The first frame is the original firm. Its camera then moves continuously.
      api.story.end({animate:false});
      if(reduced.matches)startCamera(token);else focusTimer=setTimeout(()=>startCamera(token),600);
    }else{
      if(!api.story.active)api.story.begin({animate:false});
      api.story.setStep(next,{animate:playing&&!reduced.matches});cameraReady=true;
    }
    render();if(playing)schedule();
  }
  function pause(){
    if(!playing)return;remaining=Math.max(1,dueAt-performance.now());playing=false;
    clearTimeout(timer);timer=0;
    // Preserve the establishing shot or current camera position when paused.
    if(focusTimer){clearTimeout(focusTimer);focusTimer=-1;}
    api.story.pause?.();renderControls();
  }
  play.addEventListener('click',()=>{
    if(playing){pause();return;}playing=true;
    if(step<0||completed)go(0,true);
    else{detail='';renderPanel();renderControls();if(focusTimer===-1)startCamera(generation);else api.story.resume?.();schedule();}
  });
  reset.addEventListener('click',()=>{
    clearTimers();++generation;step=-1;playing=false;cameraReady=false;completed=false;detail='';stage.hidden=footer.hidden=true;
    delete explorer.dataset.storyActive;delete explorer.dataset.storyPaused;explorer.querySelector('[data-graph-explore]').hidden=false;
    api.story.end({animate:!reduced.matches});renderControls();play.focus({preventScroll:true});
  });
  viewport.addEventListener('click',event=>{
    const button=event.target.closest('[data-memory-node]');if(step<0||!button)return;
    event.preventDefault();event.stopImmediatePropagation();pause();detail=button.dataset.memoryNode;cameraReady=true;renderPanel();
  },true);
  viewport.addEventListener('focusin',event=>{if(step>=0&&event.target.closest('[data-memory-node],.oa-story-panel'))pause();});
  stage.addEventListener('pointerdown',event=>event.stopPropagation());
  viewport.addEventListener('oakbase:graphframe',positionPanel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('oakbase:languagechange',render);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0}).observe(explorer);
  new ResizeObserver(positionPanel).observe(panel);
  renderControls();syncCopy();
})();
