/* Stable, irregular constellations. Only real relationships are drawn by the explorer. */
(() => {
 'use strict';
 const tau=Math.PI*2;
 function randomFor(id){
  let seed=2166136261;
  for(const character of id)seed=Math.imul(seed^character.charCodeAt(0),16777619);
  return ()=>{seed+=0x6D2B79F5;let n=seed;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return ((n^n>>>14)>>>0)/4294967296;};
 }
 function build(nodes,connections,width,height){
  const points=new Map(),clients=nodes.filter(n=>n.kind==='Client'),byId=new Map(nodes.map(n=>[n.id,n]));
  const matters=new Map(clients.map(n=>[n.id,[]])),records=new Map(),groups=new Map(clients.map(n=>[n.id,[]]));
  nodes.forEach(n=>{groups.get(n.group).push(n);if(n.matter&&n.id!==n.matter&&!n.actor){if(!records.has(n.matter))records.set(n.matter,[]);records.get(n.matter).push(n);}});
  connections.forEach(e=>{if(e.label==='has matter')matters.get(e.from).push(byId.get(e.to));});
  const unit=Math.sqrt(width*height/clients.length),placed=[];
  const setPoint=(node,x,y)=>{
   const random=randomFor(node.id+':star'),radius=node.kind==='Client'?3.2+random()*1.8:node.kind==='Matter'?1.8+random()*1.1:.8+random()*.9;
   points.set(node.id,{x:Math.max(12,Math.min(width-12,x)),y:Math.max(12,Math.min(height-12,y)),radius});
  };
  clients.forEach((client,index)=>{
   const random=randomFor(client.id+':constellation');
   const radius=Math.min(width*.16,unit*(.25+random()*.18));
   const marginX=radius+18,marginY=radius+24;
   let center,bestScore=-Infinity;
   // Rejection sampling, with unequal cluster sizes, leaves natural pockets of space.
   // No grid, force simulation or moving positions on each frame.
   for(let attempt=0;attempt<700;attempt++){
    const x=index===0?width*.43:marginX+random()*(width-2*marginX);
    const y=index===0?height*.43:marginY+random()*(height-2*marginY);
    const nx=(x-width/2)/(width*.54),ny=(y-height/2)/(height*.54);
    if(nx*nx+ny*ny>1.04+.10*Math.sin(Math.atan2(ny,nx)*5))continue;
    let score=Infinity;
    placed.forEach(other=>{
     const dx=Math.abs(x-other.x),dy=Math.abs(y-other.y);
     const separation=Math.hypot(dx,dy)/(radius+other.radius);
     const labelClearance=Math.max(dx/(width<600?72:100),dy/32);
     score=Math.min(score,separation,labelClearance);
    });
    if(score>bestScore){center={x,y,radius};bestScore=score;}
    if(score>1.08)break;
   }
   placed.push(center);setPoint(client,center.x,center.y);
   const rotation=random()*tau,stretch=.72+random()*.42,local=[{x:0,y:0}],angles=[];
   const place=(node,x,y)=>{
    const distance=Math.hypot(x,y),limit=radius*.96;
    if(distance>limit){x*=limit/distance;y*=limit/distance;}
    local.push({x,y});
    const cos=Math.cos(rotation),sin=Math.sin(rotation);
    setPoint(node,center.x+x*cos-y*stretch*sin,center.y+x*sin+y*stretch*cos);
   };
   matters.get(client.id).forEach(matter=>{
    let angle=random()*tau;
    for(let attempt=0;attempt<30&&angles.some(a=>Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))<.8);attempt++)angle=random()*tau;
    angles.push(angle);
    const distance=radius*(.32+random()*.43),mx=Math.cos(angle)*distance,my=Math.sin(angle)*distance;
    place(matter,mx,my);
    (records.get(matter.id)||[]).forEach(node=>{
     let x,y,clearance=-Infinity,best;
     for(let attempt=0;attempt<25;attempt++){
      const theta=angle+(random()-.5)*4.6,reach=radius*(.16+random()*.42);
      x=mx+Math.cos(theta)*reach;y=my+Math.sin(theta)*reach;
      const length=Math.hypot(x,y);if(length>radius*.96){x*=radius*.96/length;y*=radius*.96/length;}
      const gap=Math.min(...local.map(p=>Math.hypot(p.x-x,p.y-y)));
      if(gap>clearance){best={x,y};clearance=gap;}
      if(gap>radius*.16)break;
     }
     place(node,best.x,best.y);
    });
   });
   groups.get(client.id).filter(n=>!points.has(n.id)).forEach(node=>{
    const angle=random()*tau,distance=radius*(.2+random()*.6);
    place(node,Math.cos(angle)*distance,Math.sin(angle)*distance);
   });
  });
  return points;
 }
 window.OakbaseFirmLayout={build};
})();
