/* A user-started, illustrative story on top of the original firm graph. */
(() => {
  'use strict';
  const explorer = document.querySelector('.oa-memory-explorer');
  const viewport = explorer?.querySelector('.oa-graph-viewport');
  const api = window.OakbaseMemoryExplorer;
  if (!explorer || !viewport || typeof api?.story?.seek!=='function' || !window.OakbaseAgentStory) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const source = window.OakbaseFirmGraph.build();
  const originals = new Map(source.nodes.map(node => [node.id, node]));
  const copy = {
    es: {
      play:'Reproducir historia', pause:'Pausar', resume:'Continuar', replay:'Volver a reproducir', reset:'Volver al grafo',
      intro:'De un correo a una tarea. Así se conecta el trabajo.', introSmall:'Pulsa reproducir para ver el ejemplo.',
      steps:['El contexto','El correo','El compromiso','La tarea','El agente','Tu resumen'],
      titles:['Todo empieza con lo que tu firma ya sabe.','Un correo incorpora una nueva señal.','El compromiso queda conectado al contexto.','Lo acordado se convierte en una tarea.','El agente recoge la tarea con su contexto.','Tu compromiso aparece en el resumen del día.'],
      subtitles:['Un cliente, su asunto y las personas que trabajan en él.','Una promesa concreta, dentro de una conversación de trabajo.','Qué hay que hacer, quién lo hará y para cuándo.','Una acción pendiente, con responsable, fecha y evidencia.','Conoce el responsable, la fecha y el correo de origen.','Tu agente te lo recuerda sin que tengas que preguntar.'],
      status:['Contexto compartido','Nueva señal de trabajo','Compromiso identificado','Tarea preparada','Aviso proactivo'],
      contextTitle:'El contexto ya está conectado', contextText:'Grupo Olivar está preparando una adquisición. Marta es el contacto del cliente. Álex participó en la reunión del jueves.',
      sourceLabel:'Fuente', sourceText:'Reunión del jueves · calendario', emailTitle:'Presupuesto de la adquisición', emailMeta:'Álex → Marta · correo enviado',
      emailText:'Hola Marta, me comprometo a enviarte el presupuesto actualizado el viernes antes de las 12:00.',
      captured:'El Brain interpreta el correo', commitmentTitle:'Enviar presupuesto actualizado', owner:'Responsable', person:'Álex', due:'Fecha límite', deadline:'Viernes · 12:00', matter:'Asunto', matterName:'Adquisición de Olivar',
      commitmentBody:'El compromiso queda vinculado al asunto, a Álex y al correo que lo acredita.', taskTitle:'Enviar presupuesto actualizado a Marta', taskBody:'La tarea conserva el compromiso y su evidencia. Está pendiente de realizar.', pending:'Pendiente', created:'Creada desde el compromiso',
      agentLabel:'Tu agente de operaciones', agentTitle:'Una tarea con todo su contexto', agentBody:'El agente recupera el compromiso de Álex con Marta, identifica el plazo y conserva el correo que lo acredita.', agentFoot:'Recuperado del Brain · con el correo de origen', taskButton:'Ver tarea y evidencia', back:'Volver al aviso',
      illustration:'Ejemplo ilustrativo de la experiencia del Brain en desarrollo. No envía correos ni crea tareas reales.',
      relation:['tiene un asunto','participó en','contacto de','origina','se convierte en'], selected:'Elemento seleccionado', recorded:'Correo de Álex a Marta',
      newEmail:'Correo de Álex', newCommitment:'Enviar presupuesto', newTask:'Tarea pendiente', nodeTypes:{Client:'Cliente',Matter:'Asunto',Person:'Profesional',Contact:'Contacto',Source:'Reunión',Email:'Correo',Commitment:'Compromiso',Task:'Tarea'},
      read:'Leer el correo de origen', close:'Cerrar detalle', complete:'Historia completada', stepLabel:'Ir al paso', provenance:'Evidencia del compromiso',
    },
    en: {
      play:'Play the story', pause:'Pause', resume:'Continue', replay:'Replay story', reset:'Back to the graph',
      intro:'From an email to a task. See how work connects.', introSmall:'Press play to explore the example.',
      steps:['Context','Email','Commitment','Task','Agent','Your briefing'],
      titles:['It starts with what your firm already knows.','An email brings in a new work signal.','The commitment connects to its context.','What was agreed becomes a task.','The agent retrieves the task with its context.','Your commitment appears in the daily briefing.'],
      subtitles:['A client, their matter and the people working on it.','A specific promise, made in the course of everyday work.','What needs doing, who will do it and by when.','A pending action, with an owner, a deadline and evidence.','It knows the owner, the deadline and the source email.','Your agent brings it to your attention, before you ask.'],
      status:['Shared context','New work signal','Commitment identified','Task prepared','Proactive notification'],
      contextTitle:'The context is already connected', contextText:'Alder Ltd. is preparing an acquisition. Maya is the client contact. Alex attended the Thursday meeting.',
      sourceLabel:'Source', sourceText:'Thursday meeting · calendar', emailTitle:'Acquisition fee estimate', emailMeta:'Alex → Maya · sent email',
      emailText:'Hi Maya, I commit to sending you the revised fee estimate by Friday before 12 pm.',
      captured:'The Brain interprets the email', commitmentTitle:'Send revised fee estimate', owner:'Owner', person:'Alex', due:'Due date', deadline:'Friday · 12 pm', matter:'Matter', matterName:'Alder acquisition',
      commitmentBody:'The commitment is linked to the matter, to Alex and to the email that supports it.', taskTitle:'Send revised fee estimate to Maya', taskBody:'The task retains the commitment and its evidence. The work is still pending.', pending:'Pending', created:'Created from the commitment',
      agentLabel:'Your operations agent', agentTitle:'A task with its full context', agentBody:'The agent retrieves Alex’s commitment to Maya, identifies the deadline and retains the email that supports it.', agentFoot:'Retrieved from the Brain · with the source email', taskButton:'View task and evidence', back:'Back to the notification',
      illustration:'Illustrative example of the Brain experience in development. No real emails are sent or tasks created.',
      relation:['has a matter','attended','contact at','creates','becomes'], selected:'Selected item', recorded:'Email from Alex to Maya',
      newEmail:'Email from Alex', newCommitment:'Send fee estimate', newTask:'Pending task', nodeTypes:{Client:'Client',Matter:'Matter',Person:'Professional',Contact:'Contact',Source:'Meeting',Email:'Email',Commitment:'Commitment',Task:'Task'},
      read:'Read the source email', close:'Close detail', complete:'Story complete', stepLabel:'Go to step', provenance:'Commitment evidence',
    },
  };
  Object.assign(copy.es,{videoLabel:'Oakbase en acción',videoTitle:'Del correo a tu agente',posterTitle:'El trabajo se conecta.',posterBody:'Un correo crea un compromiso. Tu agente te trae la tarea.',watch:'Ver la historia',explore:'Explorar el grafo',backVideo:'Volver al vídeo',progress:'Progreso de la historia',restart:'Reiniciar vídeo',keys:'Espacio para reproducir o pausar. Flechas izquierda y derecha para retroceder o avanzar cinco segundos.',of:'de'});
  Object.assign(copy.en,{videoLabel:'Oakbase in action',videoTitle:'From an email to your agent',posterTitle:'See work connect.',posterBody:'An email creates a commitment. Your agent brings you the task.',watch:'Watch the story',explore:'Explore the graph',backVideo:'Back to the video',progress:'Story progress',restart:'Restart video',keys:'Space to play or pause. Left and right arrows to skip back or forward five seconds.',of:'of'});
  const {duration,chapters,introHold,introEnd,chapterTransition}=api.story;
  const agentStart=chapters[5];
  let currentTime=0,step=-1,playing=false,started=false,exploring=false,detail='',raf=0,lastFrame=0,lastProgress=-1,scrubbing=false,resumeAfterScrub=false;
  const lang=()=>document.documentElement.lang==='es'?'es':'en',c=()=>copy[lang()],t=value=>window.OakbaseI18n?.t(value)||value;
  const icon=name=>({play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',replay:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'}[name]||'');
  const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon(name)}</svg>`;
  const formatTime=value=>`0:${String(Math.floor(value)).padStart(2,'0')}`;
  const nodes=viewport.querySelector('[data-memory-nodes]');
  const header=document.createElement('div');header.className='oa-video-header';
  header.innerHTML='<div><span data-video-eyebrow></span><strong data-video-title></strong></div><button class="oa-video-explore" type="button"></button>';
  explorer.prepend(header);
  const poster=document.createElement('div');poster.className='oa-video-poster';
  poster.innerHTML=`<button class="oa-video-start" type="button"><span class="oa-video-start-icon">${svg('play')}</span><strong data-video-poster-title></strong><span data-video-poster-body></span><small data-video-watch></small></button>`;
  viewport.append(poster);
  // The scene is the native graph. This transparent layer only adds its annotation.
  const stage=document.createElement('div');stage.className='oa-story-stage';stage.hidden=true;
  stage.innerHTML='<svg class="oa-story-pointer" aria-hidden="true"><path></path></svg><aside class="oa-story-panel" aria-live="polite" aria-atomic="true"></aside>';
  viewport.append(stage);
  const agentView=window.OakbaseAgentStory.create({viewport,onInteract:()=>pause()});
  const graphLayers=[nodes,viewport.querySelector('.oa-graph-lines')];
  const footer=document.createElement('div');footer.className='oa-video-footer';
  footer.innerHTML=`<div class="oa-video-track"><input class="oa-video-seek" type="range" min="0" max="${duration}" step="0.1" value="0"><div class="oa-video-ticks" aria-hidden="true">${chapters.slice(1).map(at=>`<i style="left:${at/duration*100}%"></i>`).join('')}</div></div><div class="oa-video-controls"><button class="oa-video-toggle" type="button"></button><span class="oa-video-time" aria-hidden="true"><span data-video-time>0:00</span><span> / ${formatTime(duration)}</span></span><span class="oa-video-current" aria-hidden="true"></span><button class="oa-video-restart" type="button">${svg('replay')}</button></div><div class="oa-story-steps" role="group"></div><p class="oa-story-disclosure"></p><span class="oa-story-announcement" role="status" aria-live="polite"></span><span class="oa-video-keys" id="oa-video-keys"></span>`;
  explorer.querySelector('.oa-graph-caption').after(footer);
  footer.style.setProperty('--chapters',chapters.length);
  const play=footer.querySelector('.oa-video-toggle'),reset=footer.querySelector('.oa-video-restart'),range=footer.querySelector('input'),panel=stage.querySelector('.oa-story-panel'),mode=header.querySelector('button');
  const anchors=['alder','story_email','story_commitment','story_task','story_agent'];
  explorer.tabIndex=0;explorer.setAttribute('aria-describedby','oa-video-keys');
  function syncCopy(){
    const x=c();
    api.story.setCopy({nodes:{
      story_email:{name:x.newEmail,description:x.emailText,source:x.recorded,quote:x.emailText},
      story_commitment:{name:x.commitmentTitle,description:x.commitmentBody,source:x.recorded,quote:x.emailText},
      story_task:{name:x.taskTitle,description:x.taskBody,source:x.recorded,quote:x.emailText},
      story_agent:{name:x.agentLabel,description:x.agentBody,source:x.recorded,quote:x.emailText},
    },edges:{sent:lang()==='es'?'envía':'sent','records commitment':x.relation[3],'becomes task':x.relation[4],'retrieved by':lang()==='es'?'recupera':'retrieves','addressed to':lang()==='es'?'dirigido a':'addressed to','owned by':lang()==='es'?'responsable':'owned by',concerns:lang()==='es'?'corresponde a':'concerns','assigned to':lang()==='es'?'responsable':'assigned to'}});
  }
  function email(){return `<div class="oa-story-card-top">${svg('mail')}<span>${c().emailMeta}</span></div><h4>${c().emailTitle}</h4><blockquote>${c().emailText}</blockquote><div class="oa-story-card-note">${c().matter} · ${c().matterName}</div>`;}
  function fields(){return `<dl><div><dt>${c().owner}</dt><dd>${c().person}</dd></div><div><dt>${c().due}</dt><dd>${c().deadline}</dd></div><div><dt>${c().matter}</dt><dd>${c().matterName}</dd></div></dl>`;}
  function renderPanel(){
    if(step<0||step===5){stage.hidden=true;return;}const x=c();let html='';
    if(detail==='story_email')html=`${email()}<button type="button" class="oa-story-text-button" data-story-close>${x.close} ${svg('close')}</button>`;
    else if(detail==='story_task')html=`<span class="oa-story-card-label">${x.provenance}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<blockquote class="oa-story-evidence">${x.emailText}</blockquote><span class="oa-story-evidence-source">${x.recorded}</span><button type="button" class="oa-story-text-button" data-story-close>${x.back} ${svg('close')}</button>`;
    else if(step===0)html=`<span class="oa-story-card-label">Shared Firm Brain</span><h4>${t(originals.get('alder').name)}</h4><p>${x.contextText}</p>`;
    else if(step===1)html=email();
    else if(step===2)html=`<span class="oa-story-card-label">${x.captured}</span><h4>${x.commitmentTitle}</h4>${fields()}<button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else if(step===3)html=`<span class="oa-story-card-label">${x.created}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else html=`<div class="oa-story-card-top">${svg('bell')}<span>${x.agentLabel}</span></div><h4>${x.agentTitle}</h4><p>${x.agentBody}</p><div class="oa-story-card-note">${x.agentFoot}</div><button type="button" class="oa-story-task-button" data-story-task>${x.taskButton} ${svg('arrow')}</button>`;
    panel.innerHTML=html;
    panel.querySelector('[data-story-evidence]')?.addEventListener('click',()=>{pause();detail='story_email';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-task]')?.addEventListener('click',()=>{pause();detail='story_task';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-close]')?.addEventListener('click',()=>{detail='';renderPanel();play.focus({preventScroll:true});});
    positionPanel();
  }
  function positionPanel(){
    if(!started||exploring||currentTime>=agentStart||currentTime<(reduced.matches?introHold:introEnd)){stage.hidden=true;return;}
    const point=api.story.getPoint(detail||anchors[Math.max(0,step)]);if(!point){stage.hidden=true;return;}
    stage.hidden=false;
    const w=viewport.clientWidth,h=viewport.clientHeight,pw=panel.offsetWidth,ph=panel.offsetHeight,mobile=w<740;
    let left,top;
    if(mobile){left=Math.max(12,(w-pw)/2);top=Math.min(h-ph-16,Math.max(300,point.y+52));}
    else{left=point.x+80;if(left+pw>w-18)left=point.x-pw-80;left=Math.max(18,Math.min(w-pw-18,left));top=Math.max(22,Math.min(h-ph-22,point.y-ph*.45));}
    panel.style.left=`${left}px`;panel.style.top=`${top}px`;
    const pointer=stage.querySelector('svg'),path=pointer.querySelector('path');pointer.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const endX=Math.max(left+12,Math.min(left+pw-12,point.x)),endY=mobile?top:Math.max(top+15,Math.min(top+ph-15,point.y));
    const x=mobile?endX:point.x<left?left:point.x>left+pw?left+pw:endX;
    path.setAttribute('d',`M ${point.x} ${point.y} L ${x} ${endY}`);
  }
  function renderControls(){
    const x=c(),label=playing?x.pause:currentTime>=duration?x.replay:started?x.resume:x.play;
    play.innerHTML=svg(playing?'pause':currentTime>=duration?'replay':'play');play.setAttribute('aria-label',label);play.title=label;
    reset.setAttribute('aria-label',x.restart);reset.title=x.restart;
    explorer.dataset.storyPaused=String(!playing);explorer.dataset.videoPlaying=String(playing);
    poster.hidden=started||exploring;footer.hidden=exploring;
    mode.textContent=exploring?x.backVideo:x.explore;
    renderAgentScene();
  }
  function updateProgress(force=false){
    const frame=Math.floor(currentTime*10);if(!force&&frame===lastProgress)return;lastProgress=frame;
    range.value=String(currentTime);range.style.setProperty('--progress',`${currentTime/duration*100}%`);
    range.setAttribute('aria-valuetext',`${formatTime(currentTime)} ${c().of} ${formatTime(duration)} · ${c().steps[Math.max(0,step)]}`);
    footer.querySelector('[data-video-time]').textContent=formatTime(currentTime);
  }
  function renderChapter(){
    const x=c();footer.querySelector('.oa-video-current').textContent=x.steps[Math.max(0,step)];
    [...footer.querySelector('.oa-story-steps').children].forEach((b,i)=>{b.setAttribute('aria-current',i===step&&started?'step':'false');b.dataset.done=String(i<step);});
    if(started){renderPanel();footer.querySelector('[role=status]').textContent=x.titles[Math.max(0,step)]+' '+x.subtitles[Math.max(0,step)];}
  }
  function renderLanguage(){
    const x=c();header.querySelector('[data-video-eyebrow]').textContent=x.videoLabel;header.querySelector('[data-video-title]').textContent=x.videoTitle;
    poster.querySelector('[data-video-poster-title]').textContent=x.posterTitle;poster.querySelector('[data-video-poster-body]').textContent=x.posterBody;poster.querySelector('[data-video-watch]').textContent=`${x.watch} · ${formatTime(duration)}`;poster.querySelector('button').setAttribute('aria-label',x.watch);
    footer.querySelector('.oa-story-disclosure').textContent=x.illustration;footer.querySelector('.oa-video-keys').textContent=x.keys;range.setAttribute('aria-label',x.progress);
    const list=footer.querySelector('.oa-story-steps');list.setAttribute('aria-label',lang()==='es'?'Capítulos del vídeo':'Video chapters');
    if(!list.children.length)chapters.forEach((at,i)=>{const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{pause();detail='';seek(i===0?introEnd:at+chapterTransition);});list.append(b);});
    [...list.children].forEach((b,i)=>{b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${x.steps[i]}`;b.setAttribute('aria-label',`${x.stepLabel} ${i+1}: ${x.steps[i]}`);});
    syncCopy();renderAgentCopy();renderControls();renderChapter();updateProgress(true);
  }
  function renderAgentCopy(){
    const x=c(),es=lang()==='es';
    agentView.render({
      kicker:es?'Del Brain a tu resumen del día':'From the Brain to your daily briefing',
      agentIntro:es?'He revisado tu carga de trabajo. Este compromiso con Marta requiere tu atención.':'I’ve reviewed your workload. This commitment to Maya needs your attention.',
      taskTitle:x.taskTitle,taskNote:`${x.deadline} · ${x.matterName}`,
      detailTitle:es?'Tu compromiso, con su contexto':'Your commitment, with its context',
      detailBody:es?'Álex es el responsable de enviar el presupuesto actualizado a Marta.':'Alex is responsible for sending the revised fee estimate to Maya.',
      evidence:x.emailText,sourceLabel:`${x.recorded} · Outlook`,
      footer:es?'Preparado para ti. Listo para tu revisión.':'Prepared for you. Ready for your review.',
    });
  }
  function renderAgentScene(){
    const visible=started&&!exploring&&currentTime>=agentStart;
    const progress=visible?(reduced.matches?1:Math.min(1,Math.max(0,(currentTime-agentStart)/.8))):0;
    if(visible)agentView.setProgress(progress,{reducedMotion:reduced.matches});
    else{
      if(agentView.element.contains(document.activeElement))play.focus({preventScroll:true});
      agentView.hide();
    }
    graphLayers.forEach(layer=>{if(visible)layer.style.opacity=String(1-.94*progress);else layer.style.removeProperty('opacity');});
    if(visible){stage.hidden=true;if(panel.contains(document.activeElement))play.focus({preventScroll:true});}
  }
  function seek(time){
    currentTime=Math.max(0,Math.min(duration,Number(time)||0));started=true;detail='';
    const result=api.story.seek(currentTime,{reducedMotion:reduced.matches});
    const next=result.step;if(step!==next){step=next;renderChapter();}
    else if(panel.querySelector('[data-story-close]'))renderPanel();
    renderAgentScene();updateProgress();renderControlsIfNeeded();
  }
  let controlState='';
  function renderControlsIfNeeded(){const next=[playing,started,exploring,currentTime>=duration].join(':');if(next!==controlState){controlState=next;renderControls();}}
  function tick(now){
    raf=0;if(!playing)return;
    const elapsed=Math.max(0,now-lastFrame)/1000;lastFrame=now;seek(currentTime+elapsed);
    if(currentTime>=duration){playing=false;renderControlsIfNeeded();footer.querySelector('[role=status]').textContent=c().complete;return;}
    raf=requestAnimationFrame(tick);
  }
  function pause(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;renderControlsIfNeeded();}
  function start(){
    if(exploring)return;
    if(currentTime>=duration){currentTime=0;step=-1;}
    seek(currentTime);playing=true;lastFrame=performance.now();renderControlsIfNeeded();if(!raf)raf=requestAnimationFrame(tick);
  }
  function toggle(){if(playing)pause();else start();}
  play.addEventListener('click',toggle);poster.querySelector('button').addEventListener('click',()=>{start();play.focus({preventScroll:true});});
  reset.addEventListener('click',()=>{pause();scrubbing=false;resumeAfterScrub=false;started=false;currentTime=0;step=-1;detail='';api.story.end({animate:false});stage.hidden=true;renderControlsIfNeeded();renderChapter();updateProgress(true);play.focus({preventScroll:true});});
  function finishScrub(resume=true){if(!scrubbing)return;scrubbing=false;const shouldResume=resume&&resumeAfterScrub&&currentTime<duration;resumeAfterScrub=false;if(shouldResume)start();}
  range.addEventListener('pointerdown',()=>{scrubbing=true;resumeAfterScrub=playing;pause();});
  range.addEventListener('input',()=>{const resume=!scrubbing&&playing;pause();seek(range.value);if(resume&&currentTime<duration)start();});
  range.addEventListener('change',()=>finishScrub());
  window.addEventListener('pointerup',()=>finishScrub());window.addEventListener('pointercancel',()=>finishScrub(false));range.addEventListener('blur',()=>finishScrub(false));
  range.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const resume=playing;pause();seek(event.key==='Home'?0:event.key==='End'?duration:currentTime+(['ArrowLeft','ArrowDown'].includes(event.key)?-1:1));if(resume&&currentTime<duration)start();
  });
  explorer.addEventListener('keydown',event=>{
    if(exploring||event.target.closest('button,input,a,select,textarea'))return;
    if(event.code==='Space'){event.preventDefault();toggle();}
    else if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const resume=playing;pause();seek(currentTime+(event.key==='ArrowLeft'?-5:5));if(resume&&currentTime<duration)start();}
  });
  function applyMode(){
    explorer.classList.toggle('oa-video-mode',!exploring);nodes.inert=!exploring;if(!exploring)nodes.setAttribute('aria-hidden','true');else nodes.removeAttribute('aria-hidden');
    explorer.setAttribute('aria-describedby',exploring?'':'oa-video-keys');stage.hidden=true;renderControls();
  }
  mode.addEventListener('click',()=>{
    pause();finishScrub(false);exploring=!exploring;api.story.end({animate:false});applyMode();
    if(!exploring&&started){step=-1;seek(currentTime);}else if(exploring)delete explorer.dataset.storyActive;
  });
  // Annotation buttons remain usable, while graph exploration is an explicit mode.
  viewport.addEventListener('click',event=>{if(!exploring&&event.target.closest('[data-memory-node]')){event.preventDefault();event.stopImmediatePropagation();}},true);
  viewport.addEventListener('focusin',event=>{if(!exploring&&event.target.closest('.oa-story-panel,.oa-video-agent-scene'))pause();});
  stage.addEventListener('pointerdown',event=>event.stopPropagation());
  viewport.addEventListener('oakbase:graphframe',positionPanel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();finishScrub(false);}});
  document.addEventListener('oakbase:languagechange',renderLanguage);
  reduced.addEventListener('change',()=>{if(started&&!exploring)seek(currentTime);});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){pause();finishScrub(false);}},{threshold:0}).observe(explorer);
  new ResizeObserver(positionPanel).observe(panel);
  applyMode();api.story.end({animate:false});renderLanguage();
})();
