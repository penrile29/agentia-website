/* Inserted inside createMemoryExplorer in the generated V2 copy only. */
  const storyOriginalNodes=data.slice(),storyOriginalConnections=connections.slice();
  const storyEssential=new Set(['alder','acquisition','maya','alex','meeting']);
  const storyIds=['story_email','story_commitment','story_task','story_agent'];
  const storyDuration=18,storyChapters=Object.freeze([0,2,4,6,8,10]);
  const storyIntroHold=.2,storyIntroEnd=1,storyChapterTransition=.75;
  const storyState={active:false,returning:false,epoch:0,step:0,created:false,animateArrivals:true,targetZoom:1,motion:null,timeline:false,time:0,reducedMotion:false,visualKey:'',revision:0,cameraCache:null,timelineStyles:new Map(),copy:{nodes:{},edges:{}}};
  const storyNodeSpecs=[
   {id:'story_email',kind:'Source',name:'Email from Alex',description:'A sent email contains a new commitment to the client.',source:'Outlook · Sent email',quote:'I commit to sending you the revised fee estimate by Friday before 12 pm.',brand:'outlook',storyAt:1},
   {id:'story_commitment',kind:'Commitment',name:'Send revised fee estimate',description:'A commitment linked to its matter, owner and source email.',source:'Outlook · Sent email',quote:'I commit to sending you the revised fee estimate by Friday before 12 pm.',brand:'outlook',storyAt:2},
   {id:'story_task',kind:'Suggested task',name:'Send fee estimate to Maya',description:'A pending task prepared from the commitment. Alex is responsible; Friday at noon is the deadline.',source:'Outlook · Source evidence',quote:'I commit to sending you the revised fee estimate by Friday before 12 pm.',brand:'outlook',storyAt:3},
   {id:'story_agent',kind:'Operations Agent',name:'Operations Agent',description:'The agent retrieves the pending task and brings it to Alex’s attention.',source:'Oakbase · Illustrative notification',quote:'Your revised fee estimate is due Friday before noon.',brand:'oakbase',storyAt:4}
  ];
  const storyEdgeSpecs=[
   ['alex','story_email','sent'],['story_email','maya','addressed to'],['story_email','acquisition','concerns'],
   ['story_email','story_commitment','records commitment'],['story_commitment','acquisition','concerns'],['story_commitment','alex','owned by'],
   ['story_commitment','story_task','becomes task'],['story_task','alex','assigned to'],['story_task','story_agent','retrieved by']
  ];
  function storyCreate(){
   if(storyState.created)return;
   storyState.created=true;assets.oakbase=logo;brandNames.oakbase='Oakbase';
   storyNodeSpecs.forEach(spec=>{
    const n={...spec,group:'alder',matter:'acquisition',storyOnly:true};
    const b=document.createElement('button'),dot=document.createElement('span'),label=document.createElement('span');
    b.type='button';b.className='oa-graph-node cursor-interaction';b.dataset.memoryNode=n.id;b.dataset.kind=n.kind;b.dataset.storyNode=n.id;
    b.setAttribute('aria-label',t(n.name)+', '+t(n.kind));b.setAttribute('aria-pressed','false');b.hidden=true;
    dot.className='oa-graph-dot';dot.setAttribute('aria-hidden','true');label.className='oa-graph-label';label.textContent=t(n.name);b.append(dot,label);
    b.addEventListener('click',()=>select(n.id));nodeLayer.append(b);n.button=b;
    data.push(n);byId.set(n.id,n);adjacent.set(n.id,[]);members.get('alder').add(n.id);
   });
   storyEdgeSpecs.forEach(([from,to,label])=>{
    const e={from,to,label,storyLabelKey:label,storyOnly:true,storyPrimary:(from==='story_email'&&to==='story_commitment')||(from==='story_commitment'&&to==='story_task')||(from==='story_task'&&to==='story_agent')};
    e.path=addSVG('path',{},edgeLayer);e.text=addSVG('text',{},labelLayer);e.text.textContent=t(label);
    e.path.setAttribute('pathLength','1');
    e.text.dataset.storyEdge='true';e.path.dataset.storyEdge='true';e.path.dataset.storyFrom=from;e.path.dataset.storyTo=to;e.path.style.display='none';e.text.style.display='none';
    connections.push(e);adjacent.get(from).push({edge:e,node:byId.get(to)});adjacent.get(to).push({edge:e,node:byId.get(from)});
   });
   storyApplyCopy();
  }
  function storyApplyCopy(){
   if(!storyState.created)return;
   storyIds.forEach(id=>{
    const n=byId.get(id),values=storyState.copy.nodes[id]||{};
    ['name','description','source','quote'].forEach(key=>{if(typeof values[key]==='string')n[key]=values[key];});
    n.button.querySelector('.oa-graph-label').textContent=t(n.name);n.button.setAttribute('aria-label',t(n.name)+', '+t(n.kind));
   });
   connections.filter(e=>e.storyOnly).forEach(e=>{e.label=storyState.copy.edges[e.storyLabelKey]||e.storyLabelKey;e.text.textContent=t(e.label);});
  }
  function storyWorldPoints(original){
   const points=new Map(original),cluster=storyOriginalNodes.filter(n=>n.group==='alder').map(n=>original.get(n.id)).filter(Boolean);
   if(!cluster.length)return points;
   const left=Math.min(...cluster.map(p=>p.x)),right=Math.max(...cluster.map(p=>p.x)),top=Math.min(...cluster.map(p=>p.y)),bottom=Math.max(...cluster.map(p=>p.y));
   const unit=Math.sqrt(graphWidth*graphHeight/clients.length);
   storyIds.forEach((id,i)=>{
    const p=graphWidth<740
     ?{x:(left+right)/2+(i%2?1:-1)*unit*.16,y:bottom+unit*(.39+i*.38),radius:1.7}
     :{x:right+unit*.34,y:top+unit*(.10+i*.22),radius:1.7};
    points.set(id,p);
   });
   return points;
  }
  function storyCameraTarget(step=storyState.step){
   const points=storyWorldPoints(basePositions()),cluster=[...storyOriginalNodes.filter(n=>n.group==='alder').map(n=>points.get(n.id)),...storyIds.slice(0,step).map(id=>points.get(id))].filter(Boolean);
   if(!cluster.length||!graphWidth||!graphHeight)return {zoom:1,x:0,y:0};
   const left=Math.min(...cluster.map(p=>p.x)),right=Math.max(...cluster.map(p=>p.x)),top=Math.min(...cluster.map(p=>p.y)),bottom=Math.max(...cluster.map(p=>p.y));
   const mobile=graphWidth<740,padLeft=mobile?42:75,padRight=mobile?42:330,padTop=mobile?25:95,padBottom=mobile?graphHeight-Math.min(graphHeight-(step>=4?395:340),400):85;
   const availableWidth=Math.max(150,graphWidth-padLeft-padRight),availableHeight=Math.max(180,graphHeight-padTop-padBottom);
   const scale=Math.max(1.05,Math.min(mobile?4:7.5,availableWidth/Math.max(1,right-left),availableHeight/Math.max(1,bottom-top)));
   const centerX=padLeft+availableWidth/2,centerY=padTop+availableHeight/2;
   storyState.targetZoom=scale;
   return {zoom:scale,x:centerX-graphWidth/2-((left+right)/2-graphWidth/2)*scale,y:centerY-graphHeight/2-((top+bottom)/2-graphHeight/2)*scale};
  }
  function storyEase(value){const p=clamp(value);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
  function storyArrival(at,duration=.75){
   if(!storyState.active)return 0;
   if(!storyState.timeline)return at<=storyState.step?1:0;
   const elapsed=storyState.time-storyChapters[at];
   return storyState.reducedMotion?(elapsed>=0?1:0):storyEase(elapsed/duration);
  }
  function storyVisible(n){return !n.storyOnly||storyArrival(n.storyAt)>0;}
  function storyBlend(){
   if(storyState.timeline)return storyState.reducedMotion?(storyState.time>=storyIntroHold?1:0):storyEase((storyState.time-storyIntroHold)/(storyIntroEnd-storyIntroHold));
   return storyState.active||storyState.returning?clamp((zoom-1)/Math.max(.05,storyState.targetZoom-1)):0;
  }
  function storyNodeFrame(n,visible){
   if(n.storyOnly){
    const shown=Boolean(storyState.active&&visible);
    if(!storyState.timeline&&shown&&!n.storyShown&&storyState.animateArrivals)n.button.dataset.storyArrival='true';
    else if(!shown||storyState.timeline)delete n.button.dataset.storyArrival;
    n.storyShown=shown;
   }
   const enabled=(storyState.active||storyState.returning)&&(!storyState.timeline||storyState.time>=storyIntroHold),blend=storyBlend();
   if(enabled){
    n.button.dataset.storyEssential=String(storyEssential.has(n.id));
    n.button.style.opacity=String(n.storyOnly?storyArrival(n.storyAt):n.group==='alder'?(storyEssential.has(n.id)?1:1-.55*blend):1-.94*blend);
    if(n.storyOnly)n.button.dataset.storyCurrent=String(n.storyAt===Math.min(4,storyState.step));
   }else{
    n.button.style.removeProperty('opacity');delete n.button.dataset.storyEssential;delete n.button.dataset.storyCurrent;
   }
  }
  function storyEdgeArrival(e,visible){
   if(!e.storyOnly)return;
   const shown=Boolean(storyState.active&&visible);
   if(!storyState.timeline&&shown&&!e.storyShown&&storyState.animateArrivals)e.path.dataset.storyArrival='true';
   else if(!shown||storyState.timeline)delete e.path.dataset.storyArrival;
   e.storyShown=shown;
   if(storyState.timeline){
    const at=Math.max(byId.get(e.from).storyAt||0,byId.get(e.to).storyAt||0),progress=storyArrival(at,1);
    e.path.style.strokeDasharray='1';e.path.style.strokeDashoffset=String(1-progress);
    e.text.style.opacity=String(progress);
   }
  }
  function storyEdgeFrame(e){
   if(!(storyState.active||storyState.returning)||(storyState.timeline&&storyState.time<storyIntroHold))return;
   const blend=storyBlend(),local=byId.get(e.from).group==='alder'&&byId.get(e.to).group==='alder';
   const primary=e.storyOnly&&storyIds.includes(e.from)&&storyIds.includes(e.to);
   const arrival=e.storyOnly?storyArrival(Math.max(byId.get(e.from).storyAt||0,byId.get(e.to).storyAt||0),1):1;
   e.path.style.opacity=String(e.storyOnly?(primary?1:.32)*arrival:local?1-.50*blend:1-.97*blend);
   e.path.dataset.storyCurrent=String(Boolean(e.storyOnly&&(byId.get(e.from).storyAt===Math.min(4,storyState.step)||byId.get(e.to).storyAt===Math.min(4,storyState.step))));
   e.text.style.display=e.storyOnly&&e.storyPrimary&&viewport.dataset.flying!=='true'?'':'none';
  }
  function storyFrame(){
   viewport.dataset.storyActive=String((storyState.active||storyState.returning)&&!(storyState.timeline&&storyState.time<storyIntroHold));viewport.dataset.storyStep=String(storyState.step);viewport.dataset.storyTimeline=String(storyState.timeline);
   viewport.dispatchEvent(new CustomEvent('oakbase:graphframe',{detail:{active:storyState.active,step:storyState.step,time:storyState.time,timeline:storyState.timeline,zoom}}));
  }
  function storyTimelineStyles(enable){
   if(enable){
    const elements=[...data.flatMap(n=>[n.button,n.button.querySelector('.oa-graph-dot'),n.button.querySelector('.oa-graph-label')]),...connections.flatMap(e=>[e.path,e.text])].filter(Boolean);
    elements.forEach(el=>{
     if(!storyState.timelineStyles.has(el))storyState.timelineStyles.set(el,{animation:el.style.animation,transition:el.style.transition});
     el.style.animation='none';el.style.transition='none';
    });
   }else{
    storyState.timelineStyles.forEach((value,el)=>{
     if(value.animation)el.style.animation=value.animation;else el.style.removeProperty('animation');
     if(value.transition)el.style.transition=value.transition;else el.style.removeProperty('transition');
    });storyState.timelineStyles.clear();
    connections.filter(e=>e.storyOnly).forEach(e=>{e.path.style.removeProperty('stroke-dasharray');e.path.style.removeProperty('stroke-dashoffset');e.text.style.removeProperty('opacity');});
   }
  }
  function storyTimelineCamera(time,motionReduced){
   const key=graphWidth+':'+graphHeight;
   if(!storyState.cameraCache||storyState.cameraCache.key!==key){
    storyState.cameraCache={key,targets:storyChapters.map((_,index)=>storyCameraTarget(index))};
   }
   const targets=storyState.cameraCache.targets,overview={zoom:1,x:0,y:0};
   let from=overview,to=overview,progress=1;
   if(time>=storyIntroHold){
    from=overview;to=targets[0];progress=motionReduced?1:clamp((time-storyIntroHold)/(storyIntroEnd-storyIntroHold));
    for(let index=1;index<storyChapters.length;index++){
     if(time<storyChapters[index])break;
     from=targets[index-1];to=targets[index];progress=motionReduced?1:clamp((time-storyChapters[index])/storyChapterTransition);
    }
   }
   const eased=storyEase(progress);storyState.targetZoom=to.zoom;
   return {zoom:from.zoom+(to.zoom-from.zoom)*eased,x:from.x+(to.x-from.x)*eased,y:from.y+(to.y-from.y)*eased};
  }
  function storySeek(seconds,{reducedMotion=reduced.matches,force=false}={}){
   const value=Number(seconds),time=Math.max(0,Math.min(storyDuration,Number.isFinite(value)?value:0));
   const entering=!storyState.timeline||!storyState.active;
   if(entering){
    ++storyState.epoch;stopFlight();storyCreate();storyState.timeline=true;storyState.active=true;storyState.returning=false;storyState.animateArrivals=false;
    storyTimelineStyles(true);storyState.visualKey='';state.memoryClient='alder';state.memoryNode='alder';
   }else if(storyState.motion||flight)stopFlight();
   storyState.time=time;storyState.reducedMotion=Boolean(reducedMotion);
   storyState.step=storyChapters.reduce((step,start,index)=>time>=start?index:step,0);
   const view=time<storyIntroHold?'firm':'client';
   if(state.memoryView!==view||entering){state.memoryView=view;updateChrome();if(view==='client')updateInspector();}
   const target=storyTimelineCamera(time,storyState.reducedMotion);
   const arrivals=storyIds.flatMap((_,index)=>[storyArrival(index+1),storyArrival(index+1,1)]);
   const key=[graphWidth,graphHeight,storyState.step,storyState.revision,view,storyState.reducedMotion,target.zoom,target.x,target.y,storyBlend(),...arrivals].map(v=>typeof v==='number'?v.toFixed(7):String(v)).join('|');
   const changed=force||key!==storyState.visualKey;
   zoom=target.zoom;panX=target.x;panY=target.y;viewport.dataset.flying='false';
   if(changed){storyState.visualKey=key;drawGraph();}
   return {time,step:storyState.step,changed};
  }
  function storyCancelCamera(){
   const motion=storyState.motion;if(!motion)return;
   if(motion.raf)cancelAnimationFrame(motion.raf);storyState.motion=null;flight=0;viewport.dataset.flying='false';motion.resolve({cancelled:true});
  }
  function storyFly(target,animate=true,duration=1800){
   stopFlight();
   if(!animate||reduced.matches){zoom=target.zoom;panX=target.x;panY=target.y;drawGraph();return Promise.resolve({cancelled:false});}
   return new Promise(resolve=>{
    const motion={start:{zoom,x:panX,y:panY},target,duration,elapsed:0,last:performance.now(),raf:0,paused:false,resolve};storyState.motion=motion;viewport.dataset.flying='true';
    const frame=now=>{
     if(storyState.motion!==motion||motion.paused)return;
     motion.elapsed=Math.min(duration,motion.elapsed+Math.max(0,now-motion.last));motion.last=now;
     const progress=motion.elapsed/duration,ease=progress<.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
     zoom=motion.start.zoom+(target.zoom-motion.start.zoom)*ease;panX=motion.start.x+(target.x-motion.start.x)*ease;panY=motion.start.y+(target.y-motion.start.y)*ease;drawGraph();
     if(progress<1){motion.raf=requestAnimationFrame(frame);flight=motion.raf;}else{storyState.motion=null;flight=0;viewport.dataset.flying='false';drawGraph();resolve({cancelled:false});}
    };
    motion.frame=frame;motion.raf=requestAnimationFrame(frame);flight=motion.raf;
   });
  }
  const story={
   duration:storyDuration,chapters:storyChapters,introHold:storyIntroHold,introEnd:storyIntroEnd,chapterTransition:storyChapterTransition,seek:storySeek,
   get active(){return storyState.active;},get step(){return storyState.step;},get time(){return storyState.time;},get paused(){return Boolean(storyState.motion?.paused);},
   begin({animate=true}={}){
    if(storyState.timeline){storyTimelineStyles(false);storyState.timeline=false;storyState.visualKey='';}
    storyState.epoch++;storyCancelCamera();storyCreate();storyState.active=true;storyState.returning=false;storyState.step=0;
    state.memoryClient='alder';state.memoryNode='alder';state.memoryView='client';updateChrome();updateInspector();
    const target=storyCameraTarget();drawGraph();return storyFly(target,animate,1800);
   },
   setStep(step,{animate=true}={}){
    if(storyState.timeline){const value=Math.max(0,Math.min(storyChapters.length-1,Math.floor(Number(step)||0)));return Promise.resolve({...storySeek(storyChapters[value],{reducedMotion:!animate||reduced.matches}),cancelled:false});}
    if(!storyState.active)return story.begin({animate}).then(result=>{if(!result.cancelled)return story.setStep(step,{animate:false});return result;});
    storyState.step=Math.max(0,Math.min(4,Math.floor(Number(step)||0)));
    storyState.animateArrivals=Boolean(animate&&!reduced.matches);
    if(!storyState.animateArrivals){data.filter(n=>n.storyOnly).forEach(n=>delete n.button.dataset.storyArrival);connections.filter(e=>e.storyOnly).forEach(e=>delete e.path.dataset.storyArrival);}
    const target=storyCameraTarget();drawGraph();return storyFly(target,animate,1100);
   },
   end({animate=true}={}){
    if(storyState.timeline){storyTimelineStyles(false);storyState.timeline=false;storyState.visualKey='';}
    const epoch=++storyState.epoch;
    storyCancelCamera();storyState.active=false;storyState.returning=true;storyState.step=0;state.memoryView='firm';state.memoryNode='alder';state.memoryClient='alder';updateChrome();
    return storyFly({zoom:1,x:0,y:0},animate,1400).then(result=>{if(epoch===storyState.epoch&&!storyState.active){storyState.returning=false;drawGraph();}return result;});
   },
   getPoint(id){
    const n=byId.get(id);if(!n||!storyVisible(n))return null;
    const p=positions().get(id);return p?{x:p.x,y:p.y}:null;
   },
   setCopy(value={}){
    storyState.copy={nodes:{...storyState.copy.nodes,...(value.nodes||{})},edges:{...storyState.copy.edges,...(value.edges||{})}};
    storyApplyCopy();storyState.revision++;if(storyState.active){if(storyState.timeline)storySeek(storyState.time,{reducedMotion:storyState.reducedMotion,force:true});else drawGraph();}
   },
   pause(){const motion=storyState.motion;if(!motion||motion.paused)return;if(motion.raf)cancelAnimationFrame(motion.raf);motion.paused=true;motion.raf=0;flight=0;viewport.dataset.flying='false';},
   resume(){const motion=storyState.motion;if(!motion||!motion.paused)return;motion.paused=false;motion.last=performance.now();viewport.dataset.flying='true';motion.raf=requestAnimationFrame(motion.frame);flight=motion.raf;}
  };
