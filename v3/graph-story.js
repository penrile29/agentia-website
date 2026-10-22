/* A user-started, illustrative story on top of the original firm graph. */
(() => {
  'use strict';
  const explorer = document.querySelector('.oa-memory-explorer');
  const viewport = explorer?.querySelector('.oa-graph-viewport');
  const api = window.OakbaseMemoryExplorer;
  if (!explorer || !viewport || !api) return;
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
  let step = -1, playing = false, timer = 0, focusTimer = 0, dueAt = 0, remaining = 0, focused = false, detail = '', completed = false;
  const durations = [5100, 6500, 5700, 5200, 7000];
  const lang = () => document.documentElement.lang === 'es' ? 'es' : 'en';
  const c = () => copy[lang()];
  const t = value => window.OakbaseI18n?.t(value) || value;
  const icon = name => ({ play:'<path d="m8 5 11 7-11 7Z"/>', pause:'<path d="M8 5v14M16 5v14"/>', reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>', check:'<path d="m5 12 4 4L19 6"/>', arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>' }[name] || '');
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon(name)}</svg>`;
  const control = document.createElement('div'); control.className = 'oa-story-controls';
  control.innerHTML = '<button type="button" class="oa-story-play"><span data-story-icon></span><span data-story-play-label></span></button><button type="button" class="oa-story-reset" hidden></button>';
  explorer.querySelector('.oa-graph-toolbar').append(control);
  const intro = document.createElement('div'); intro.className = 'oa-story-intro';
  intro.innerHTML = '<span data-story-intro></span><span data-story-intro-small></span>';
  explorer.querySelector('.oa-graph-toolbar').after(intro);
  const stage = document.createElement('div'); stage.className='oa-story-stage'; stage.hidden=true;
  stage.innerHTML = '<div class="oa-story-heading"><span class="oa-story-eyebrow" data-story-status></span><h3 data-story-title></h3><p data-story-subtitle></p></div><svg class="oa-story-agent-link" aria-hidden="true"></svg><div class="oa-story-map"><svg class="oa-story-connections" aria-hidden="true"></svg><div class="oa-story-entities"></div></div><aside class="oa-story-panel" aria-live="polite" aria-atomic="true"></aside>';
  viewport.append(stage);
  const footer = document.createElement('div'); footer.className='oa-story-footer'; footer.hidden=true;
  footer.innerHTML='<div class="oa-story-steps" role="group"></div><p class="oa-story-disclosure"></p><span class="oa-story-announcement" role="status" aria-live="polite"></span>';
  explorer.querySelector('.oa-graph-caption').after(footer);
  const play = control.querySelector('.oa-story-play'), reset = control.querySelector('.oa-story-reset');
  const panel = stage.querySelector('.oa-story-panel'), map=stage.querySelector('.oa-story-map'), entities=stage.querySelector('.oa-story-entities'), lines=stage.querySelector('.oa-story-connections');
  const nativeLayers = [viewport.querySelector('[data-memory-nodes]'), viewport.querySelector('.oa-graph-lines'), viewport.querySelector('.oa-graph-controls')];
  const nodeSpecs=[
    {id:'alder',kind:'Client',x:54,y:12,at:0}, {id:'acquisition',kind:'Matter',x:64,y:37,at:0},
    {id:'maya',kind:'Contact',x:20,y:13,at:0}, {id:'meeting',kind:'Source',x:32,y:37,at:0},
    {id:'alex',kind:'Person',x:13,y:55,at:0}, {id:'story_email',kind:'Email',x:22,y:79,at:1},
    {id:'story_commitment',kind:'Commitment',x:60,y:63,at:2}, {id:'story_task',kind:'Task',x:78,y:86,at:3},
  ];
  const links=[['maya','alder',0],['alder','acquisition',0],['meeting','acquisition',0],['alex','meeting',0],['maya','meeting',0],['alex','story_email',1],['story_email','story_commitment',2],['story_commitment','acquisition',2],['story_commitment','alex',2],['story_commitment','story_task',3]];
  function name(node) { return node.id === 'story_email' ? c().newEmail : node.id === 'story_commitment' ? c().newCommitment : node.id === 'story_task' ? c().newTask : t(originals.get(node.id).name); }
  nodeSpecs.forEach(node=>{
    const button=document.createElement('button');button.type='button';button.className='oa-story-node';button.dataset.kind=node.kind;button.dataset.storyNode=node.id;
    button.style.left=`${node.x}%`;button.style.top=`${node.y}%`;
    button.innerHTML='<span class="oa-story-node-dot" aria-hidden="true"></span><span class="oa-story-node-kind"></span><span class="oa-story-node-name"></span>';
    button.addEventListener('click',()=>{pause();detail=node.id;renderPanel();});entities.append(button);node.button=button;
  });
  function drawLines(){
    const width=map.clientWidth,height=map.clientHeight;if(!width||!height)return;
    lines.setAttribute('viewBox',`0 0 ${width} ${height}`);lines.replaceChildren();
    links.filter(link=>link[2]<=step).forEach(([from,to,at])=>{
      const a=nodeSpecs.find(node=>node.id===from),b=nodeSpecs.find(node=>node.id===to);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${a.x*width/100} ${a.y*height/100} L ${b.x*width/100} ${b.y*height/100}`);
      path.setAttribute('pathLength','1');path.dataset.new=String(at>0);path.dataset.current=String(at===step);lines.append(path);
      if(width>460 && ((from==='story_email'&&to==='story_commitment')||(from==='story_commitment'&&to==='story_task'))){
        const label=document.createElementNS('http://www.w3.org/2000/svg','text');
        label.setAttribute('x',String((a.x+b.x)*width/200));label.setAttribute('y',String((a.y+b.y)*height/200+(from==='story_email'?-9:14)));
        label.textContent=from==='story_email'?c().relation[3]:c().relation[4];lines.append(label);
      }
    });
    const agentLink=stage.querySelector('.oa-story-agent-link');agentLink.replaceChildren();
    if(step===4&&stage.clientWidth>740){
      agentLink.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);
      const task=nodeSpecs.find(node=>node.id==='story_task'),sx=map.offsetLeft+width*task.x/100,sy=map.offsetTop+height*task.y/100,ex=panel.offsetLeft-5,ey=panel.offsetTop+panel.offsetHeight*.64;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${sx+14} ${sy} C ${ex-30} ${sy}, ${ex-80} ${ey}, ${ex} ${ey} m -5 -4 5 4 -5 4`);agentLink.append(path);
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('x',String(ex-55));label.setAttribute('y',String(ey-12));label.textContent=lang()==='es'?'recupera':'retrieves';agentLink.append(label);
    }
  }
  function email(){return `<div class="oa-story-card-top">${svg('mail')}<span>${c().emailMeta}</span></div><h4>${c().emailTitle}</h4><blockquote>${c().emailText}</blockquote><div class="oa-story-card-note">${c().matter} · ${c().matterName}</div>`;}
  function fields(){return `<dl><div><dt>${c().owner}</dt><dd>${c().person}</dd></div><div><dt>${c().due}</dt><dd>${c().deadline}</dd></div><div><dt>${c().matter}</dt><dd>${c().matterName}</dd></div></dl>`;}
  function renderPanel(){
    const x=c();let html='';
    if(detail && !detail.startsWith('story_')){
      const node=nodeSpecs.find(node=>node.id===detail), original=originals.get(detail);
      const text=typeof original.description==='object'?original.description[lang()]:t(original.description);
      html=`<span class="oa-story-card-label">${x.nodeTypes[node.kind]}</span><h4>${name(node)}</h4><p>${text||x.contextText}</p><button type="button" class="oa-story-text-button" data-story-close>${x.close} ${svg('close')}</button>`;
    } else if(detail==='story_email') {
      html=`${email()}<button type="button" class="oa-story-text-button" data-story-close>${x.close} ${svg('close')}</button>`;
    } else if(detail==='story_task'||detail==='story_commitment') {
      html=`<span class="oa-story-card-label">${x.provenance}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<blockquote class="oa-story-evidence">${x.emailText}</blockquote><span class="oa-story-evidence-source">${x.recorded}</span><button type="button" class="oa-story-text-button" data-story-close>${step===4?x.back:x.close} ${svg('close')}</button>`;
    } else if(step===0){
      html=`<span class="oa-story-card-label">Shared Firm Brain</span><h4>${x.contextTitle}</h4><p>${x.contextText}</p><div class="oa-story-card-note">${x.sourceLabel}<br><strong>${x.sourceText}</strong></div>`;
    } else if(step===1) html=email();
    else if(step===2) html=`<span class="oa-story-card-label">${x.captured}</span><h4>${x.commitmentTitle}</h4>${fields()}<p>${x.commitmentBody}</p><button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else if(step===3) html=`<span class="oa-story-card-label">${x.created}</span><h4>${x.taskTitle}</h4><span class="oa-story-state">${x.pending}</span>${fields()}<p>${x.taskBody}</p><button type="button" class="oa-story-text-button" data-story-evidence>${x.read} ${svg('arrow')}</button>`;
    else html=`<div class="oa-story-card-top">${svg('bell')}<span>${x.agentLabel}</span></div><h4>${x.agentTitle}</h4><p class="oa-story-notification">${x.agentBody}</p><div class="oa-story-notification-task">${svg('check')}<span>${x.taskTitle}<small>${x.pending} · ${x.deadline}</small></span></div><p class="oa-story-card-note">${x.agentFoot}</p><button type="button" class="oa-story-task-button" data-story-task>${x.taskButton} ${svg('arrow')}</button>`;
    panel.innerHTML=html;
    panel.querySelector('[data-story-evidence]')?.addEventListener('click',()=>{pause();detail='story_email';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-task]')?.addEventListener('click',()=>{pause();detail='story_task';renderPanel();panel.querySelector('[data-story-close]').focus({preventScroll:true});});
    panel.querySelector('[data-story-close]')?.addEventListener('click',()=>{detail='';renderPanel();play.focus({preventScroll:true});});
  }
  function renderControls(){
    const x=c(),label=playing?x.pause:step<0?x.play:completed?x.replay:x.resume;
    control.querySelector('[data-story-play-label]').textContent=label;
    control.querySelector('[data-story-icon]').innerHTML=svg(playing?'pause':'play');
    play.setAttribute('aria-label',label); reset.textContent=x.reset;reset.hidden=step<0;
    intro.querySelector('[data-story-intro]').textContent=x.intro;intro.querySelector('[data-story-intro-small]').textContent=x.introSmall;
  }
  function render(){
    renderControls();if(step<0)return;
    const x=c();stage.querySelector('[data-story-status]').textContent=`0${step+1} / 05 · ${x.status[step]}`;
    stage.querySelector('[data-story-title]').textContent=x.titles[step];stage.querySelector('[data-story-subtitle]').textContent=x.subtitles[step];
    stage.dataset.step=String(step);footer.querySelector('.oa-story-disclosure').textContent=x.illustration;
    const steps=footer.querySelector('.oa-story-steps');steps.setAttribute('aria-label',lang()==='es'?'Pasos de la historia':'Story steps');
    if(!steps.children.length) x.steps.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{pause();go(i);});steps.append(b);});
    [...steps.children].forEach((b,i)=>{b.innerHTML=`<span>0${i+1}</span>${x.steps[i]}`;b.setAttribute('aria-label',`${x.stepLabel} ${i+1}: ${x.steps[i]}`);b.setAttribute('aria-current',i===step?'step':'false');b.dataset.done=String(i<step);});
    nodeSpecs.forEach(node=>{node.button.hidden=node.at>step;node.button.dataset.current=String(node.at===step&&step>0);node.button.querySelector('.oa-story-node-kind').textContent=x.nodeTypes[node.kind];node.button.querySelector('.oa-story-node-name').textContent=name(node);node.button.setAttribute('aria-label',`${x.nodeTypes[node.kind]}: ${name(node)}`);});
    renderPanel();drawLines();explorer.querySelector('[data-graph-hint]').textContent=lang()==='es'?'Selecciona un elemento para ver su información':'Select an item to see its context';
    footer.querySelector('[role=status]').textContent=x.titles[step]+' '+x.subtitles[step];
  }
  function focusStory(){
    focused=true;stage.hidden=false;explorer.dataset.storyFocused='true';
    nativeLayers.forEach(layer=>{layer.inert=true;});drawLines();
  }
  function clearTimers(){clearTimeout(timer);clearTimeout(focusTimer);timer=focusTimer=0;}
  function schedule(){dueAt=performance.now()+remaining;timer=setTimeout(()=>{if(step<4)go(step+1);else{playing=false;completed=true;remaining=0;renderControls();footer.querySelector('[role=status]').textContent=c().complete;}},remaining);}
  function go(next,opening=false){
    clearTimers();step=next;completed=false;detail='';remaining=durations[next];
    explorer.dataset.storyActive='true';footer.hidden=false;intro.hidden=true;
    explorer.querySelector('[data-graph-explore]').hidden=true;
    if(opening&&!reduced.matches){
      api.restore({memoryView:'firm',memoryClient:'alder'});
      // A short establishing shot preserves the full firm, then uses its existing camera.
      focusTimer=setTimeout(()=>{api.select('alder',false,true);focusTimer=setTimeout(focusStory,760);},850);
    } else {api.select('alder',false,false);focusStory();}
    render();if(playing)schedule();
  }
  function pause(){
    if(!playing)return;remaining=Math.max(1,dueAt-performance.now());playing=false;clearTimers();
    if(!focused)focusStory();renderControls();
  }
  play.addEventListener('click',()=>{
    if(playing){pause();return;}
    playing=true;
    if(step<0||completed){focused=false;stage.hidden=true;delete explorer.dataset.storyFocused;nativeLayers.forEach(layer=>{layer.inert=false;});go(0,true);}
    else{detail='';renderPanel();renderControls();schedule();}
  });
  reset.addEventListener('click',()=>{
    clearTimers();step=-1;playing=false;focused=false;completed=false;detail='';stage.hidden=footer.hidden=true;intro.hidden=false;
    delete explorer.dataset.storyActive;delete explorer.dataset.storyFocused;nativeLayers.forEach(layer=>{layer.inert=false;});
    explorer.querySelector('[data-graph-explore]').hidden=false;api.restore({memoryView:'firm',memoryClient:'alder'});renderControls();play.focus({preventScroll:true});
  });
  stage.addEventListener('pointerdown',event=>event.stopPropagation());
  stage.addEventListener('focusin',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('oakbase:languagechange',render);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0}).observe(explorer);
  new ResizeObserver(drawLines).observe(map);
  renderControls();
})();
