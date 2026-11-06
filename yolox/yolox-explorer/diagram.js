// Diagram rendering, edge routing, camera navigation, and startup.

function arrow(){let e=document.createElement('span');e.className='arrow';e.textContent='';e.setAttribute('aria-hidden','true');return e;}
function flow(nodes){let el=document.createElement('div');el.className='flow';nodes.forEach((x,i)=>{if(i)el.append(arrow());el.append(renderNode(x));});return el;}
function renderNode(x){if(x.id==='unpooled'){const anchor=document.createElement('div');anchor.className='node passthrough-anchor';anchor.dataset.id=x.id;return anchor;}if(x.title==='Identity'){const anchor=document.createElement('div');anchor.className='node shortcut-anchor';anchor.dataset.id=x.id;return anchor;}const inline=/^head(?:80|40|20)branches$/.test(x.id)||/^csp(?:\d+|neck(?:bottom)?\d+)branches$/.test(x.id);let el=document.createElement('div');el.className='node'+(opened.has(x.id)||inline?' open':'')+(inline?' inline-branches':'')+(selected===x.id?' selected':'');el.dataset.id=x.id;let b=document.createElement('div');b.className='label';const selectButton=document.createElement('button');selectButton.type='button';selectButton.className='box-select';selectButton.setAttribute('aria-label','Select '+x.title);selectButton.onclick=()=>activate(x);if(x.taper){el.classList.add('taper-'+x.taper);const frame=svgElement('svg',{class:'taper-frame',viewBox:'0 0 100 100',preserveAspectRatio:'none','aria-hidden':'true'});frame.append(svgElement('polygon',{points:x.taper==='widen'?'0,25 100,0 100,100 0,75':'0,0 100,25 100,75 0,100','vector-effect':'non-scaling-stroke'}));b.append(frame);}let title=document.createElement('strong');title.textContent=x.title;if(x.convolution){const {cout,k,s}=x.convolution;title.textContent=cout+'×Conv('+k+'×'+k+', s='+s+')';if(x.children)title.append(document.createTextNode(' → BN → SiLU'));}if(x.id==='backbone'){const subtitle=document.createElement('span');subtitle.className='backbone-subtitle';subtitle.textContent='CSPDarknet';title.append(subtitle);}let shape=document.createElement('small');shape.textContent=x.id==='backbone'?'':x.shape;let action=document.createElement(x.children?'button':'span');action.className='action';action.textContent=x.children?(opened.has(x.id)?'− Collapse':'+ Expand'):'';if(x.children){action.type='button';action.setAttribute('aria-expanded',opened.has(x.id));action.setAttribute('aria-label',(opened.has(x.id)?'Collapse ':'Expand ')+x.title);action.onclick=e=>{e.stopPropagation();activate(x,true);};}b.append(selectButton,title,action);if(x.filterHelp)attachPopup(b,filterInfoPopup,x);if(x.title==='Sigmoid')attachPopup(b,sigmoidPopup);if(x.id==='filter')attachPopup(b,filterOverviewPopup);if(x.id==='output')attachPopup(b,outputPopup);if(x.id==='heads')attachPopup(b,headsPopup);if(x.id==='backbone')attachPopup(b,backbonePopup);if(x.id==='neck')attachPopup(b,neckPopup);if(x.id==='neckbottomup')attachPopup(b,bottomupPopup);if(x.title==='Upsample ×2')attachPopup(b,upsamplePopup);if(x.id==='necktopdown')attachPopup(b,topdownPopup);if(x.id==='input')attachPopup(b,inputPopup);if(x.id==='rearrange')attachPopup(b,focusPopup);if(x.convolution&&!x.children)attachPopup(b,convPopup,x.convolution);if(x.title==='Batch normalization')attachPopup(b,bnPopup);if(x.title==='SiLU')attachPopup(b,siluPopup);if(x.pooling)attachPopup(b,maxpoolPopup,x.pooling);if(x.title==='Elementwise add')attachPopup(b,addPopup);if(x.title==='Concatenate'||x.predictionAssembly)attachPopup(b,concatPopup,x);if(!inline){el.append(b);if(b.popupInfo)el.append(b.popupInfo);}if((opened.has(x.id)||inline)&&x.children){if(x.parallel){let p=document.createElement('div');p.className='parallel';p.append(arrow());let lanes=document.createElement('div');lanes.className='lanes';x.children.forEach(l=>{let lane=document.createElement('div');lane.className='lane';let name=document.createElement('span');name.className='lane-name';name.textContent=l.name;if(l.name&&!inline&&x.title!=='Residual paths'&&x.id!=='pools')lane.append(name);lane.append(flow(l.nodes));lanes.append(lane);});p.append(lanes,arrow());el.append(p);}else el.append(flow(x.children));}if(/^head(?:80|40|20)(?:reg|predictions)$/.test(x.id)&&!opened.has(x.id)){for(const [i,channels] of [4,1].entries()){const port=document.createElement('span');port.className='head-output-port';const size=x.id.match(/^head(80|40|20)/)[1];port.dataset.shape=channels+' × '+size+' × '+size;port.style.top=(i===0?'30%':'75%');el.append(port);}}if(x.tap){let t=document.createElement('span');t.className='tap';t.textContent=x.tap;el.append(t);}el.addEventListener('click',e=>{if(e.target.closest('.node')!==el||e.target.closest('button'))return;e.stopPropagation();activate(x);});return el;}
function render(){hideInputPopup();canvas.replaceChildren(flow(pipeline));drawConnections();updateDetails();}
function updateDetails(){details.replaceChildren();let x=index.get(selected);let h=document.createElement('h2');h.textContent=x?x.title:'Explore the architecture';details.append(h);if(x){let meta=document.createElement('div');meta.className='meta';meta.textContent='Output: '+x.shape+' · batch dimension B omitted in diagram';details.append(meta);}let p=document.createElement('p');p.textContent=x?x.info:'Open Backbone to reveal Focus → dark2 → dark3 → dark4 → dark5. Open any nested block to continue exploring.';details.append(p);}
function activate(x,toggle=false){selected=x.id;if(toggle&&x.children){if(opened.has(x.id))opened.delete(x.id);else opened.add(x.id);render();}else{hideInputPopup();canvas.querySelectorAll('.node').forEach(node=>node.classList.toggle('selected',node.dataset.id===selected));updateDetails();}canvas.querySelector('[data-id="'+x.id+'"] > .label > '+(toggle?'.action':'.box-select'))?.focus({preventScroll:true});}
let panX=40,panY=52;
function updateCamera(){canvas.style.transform='none';canvas.style.zoom=scale;canvas.style.left=(panX/scale)+'px';canvas.style.top=(panY/scale)+'px';drawConnections();}
function zoomTo(next,x,y){next=Math.max(.001,Math.min(3,next));const ratio=next/scale;panX=x-(x-panX)*ratio;panY=y-(y-panY)*ratio;scale=next;updateCamera();}
viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);zoomTo(scale*Math.exp(-delta*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
const pointers=new Map();let gesture=null,suppressClick=false;
function gestureState(){const points=[...pointers.values()];if(points.length>1){const [a,b]=points;return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};}return points.length?{...points[0],d:0}:null;}
viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=gestureState();if(pointers.size===1)suppressClick=false;else suppressClick=true;});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=gestureState();if(!gesture)return;const dx=next.x-gesture.x,dy=next.y-gesture.y;if(!suppressClick&&Math.hypot(dx,dy)<5)return;suppressClick=true;viewport.classList.add('dragging');if(!viewport.hasPointerCapture(e.pointerId))viewport.setPointerCapture(e.pointerId);panX+=dx;panY+=dy;updateCamera();gesture=next;});
function releasePointer(e){pointers.delete(e.pointerId);gesture=gestureState();if(!pointers.size)viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup',releasePointer);viewport.addEventListener('pointercancel',releasePointer);viewport.addEventListener('lostpointercapture',releasePointer);
window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);
viewport.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
viewport.addEventListener('dragstart',e=>e.preventDefault());
viewport.addEventListener('click',e=>{if(e.target.closest('.label,.popup-info')||suppressClick)return;selected=null;canvas.querySelectorAll('.node.selected').forEach(node=>node.classList.remove('selected'));if(document.activeElement?.closest('#canvas'))document.activeElement.blur();});

function drawConnections(){
 canvas.querySelector('.connections')?.remove();
 const svg=svgElement('svg',{class:'connections','aria-label':'Feature flow connections',role:'img'});
 const defs=svgElement('defs',{});
 for(const [id,color] of [['flow-tip','var(--muted)'],['neck-tip','var(--muted)']]){const marker=svgElement('marker',{id,viewBox:'0 0 8 8',refX:8,refY:4,markerWidth:8,markerHeight:8,orient:'auto',markerUnits:'userSpaceOnUse'});marker.append(svgElement('polygon',{points:'0,0 8,4 0,8',fill:color}));defs.append(marker);}svg.append(defs);
 const origin=canvas.getBoundingClientRect();
 function box(e){const r=e.getBoundingClientRect();return {l:(r.left-origin.left)/scale,r:(r.right-origin.left)/scale,t:(r.top-origin.top)/scale,b:(r.bottom-origin.top)/scale,w:r.width/scale,h:r.height/scale};}
 function edge(d,neck=false,head=true){svg.append(svgElement('path',{d,class:neck?'neck-edge':'flow-edge','marker-end':head?(neck?'url(#neck-tip)':'url(#flow-tip)'):'none'}));}
 // Expanded groups expose their visible operations as connection ports.
 function ports(node,side){
  if(!node.classList.contains('open')){const outputs=node.querySelectorAll(':scope > .head-output-port');return side==='out'&&outputs.length?[...outputs]:[node];}
  const row=[...node.children].find(e=>e.classList.contains('flow'));
  if(row){const nodes=[...row.children].filter(e=>e.classList.contains('node'));return ports(side==='in'?nodes[0]:nodes[nodes.length-1],side);}
  const parallel=[...node.children].find(e=>e.classList.contains('parallel'));
  if(parallel){return [...parallel.querySelector('.lanes').children].flatMap(lane=>{const nodes=[...lane.querySelector('.flow').children].filter(e=>e.classList.contains('node'));if(side==='in'&&nodes[0].classList.contains('shortcut-anchor'))return [];return ports(side==='in'?nodes[0]:nodes[nodes.length-1],side);});}
  return [node];
 }
 // Only dark5 enters the reduction; the other scales feed later fusion.
 function routeNeckInput(sourceNode,neckNode,d){
  const expanded=opened.has('neck');
  const targetNode=expanded?(d===5?ports(neckNode,'in')[0]:(opened.has('necktopdown')?canvas.querySelector('[data-id="neckcat'+(d===3?'80':'40')+'"]'):canvas.querySelector('[data-id="necktopdown"]'))):neckNode;
  const source=box(sourceNode),target=box(targetNode),shape=index.get('dark'+d).shape;
  if(d===5){const y=source.t+source.h/2;edge('M '+source.r+' '+y+' H '+target.l,true);labelShape(shape,(source.r+target.l)/2,y);return;}
  const backbone=box(canvas.querySelector('[data-id="backbone"]')),neck=box(neckNode);
  const above=d===3,sx=source.l+source.w*.65,tx=target.l+target.w*.5;
  if(expanded&&!opened.has('backbone')&&!opened.has('necktopdown')&&!opened.has('neckbottomup')){
   const cy=source.t+source.h/2,clearance=Math.max(source.h,target.h)/2+25,y=cy+(above?-clearance:clearance);
   const from=above?source.t:source.b,to=above?target.t+target.h*.125:target.b-target.h*.125;
   edge('M '+sx+' '+from+' V '+y+' H '+tx+' V '+to,true);labelShape(shape,(sx+tx)/2,y);return;
  }

  const stage=opened.has('backbone')?box(canvas.querySelector('[data-id="dark'+d+'"]')):null;
  const topDown=expanded?box(canvas.querySelector('[data-id="necktopdown"]')):neck;
  const sourceBounds=stage||source;
  let y=expanded?(above?Math.min(sourceBounds.t,topDown.t)-105:Math.max(sourceBounds.b,topDown.b)+45):(above?Math.min(backbone.t,neck.t)-35:Math.max(backbone.b,neck.b)+35);
  if(expanded&&opened.has('backbone')){if(above)y=Math.min(y,backbone.t-35);else if(Math.abs(y-backbone.b)<24)y=backbone.b+35;}
  const from=above?source.t:source.b;
  const tapered=expanded&&!opened.has('necktopdown');
  const to=above?target.t+(tapered?target.h*.125:0):target.b-(tapered?target.h*.125:0);
  if(stage){const rail=stage.r+35,sy=source.t+source.h/2;edge('M '+source.r+' '+sy+' H '+rail+' V '+y+' H '+tx+' V '+to,true);labelShape(shape,(rail+tx)/2,y);}
  else{edge('M '+sx+' '+from+' V '+y+' H '+tx+' V '+to,true);labelShape(shape,(sx+tx)/2,y);}
 }
 function tensorShape(node){const value=node.dataset.shape||index.get(node.dataset.id)?.shape;return /^\d+ × \d+ × \d+$/.test(value||'')?value:(index.get(node.dataset.id)?.filterHelp?value:null);}
 function labelShape(shape,x,y){if(!shape)return;const lines=Array.isArray(shape)?shape:[shape];lines.forEach((line,i)=>{const labelY=y-10-(lines.length-1-i)*17;const text=svgElement('text',{x,y:labelY,'text-anchor':'middle'});text.textContent=line;text.dataset.edgeY=y;svg.append(text);});}
 function link(a,b,showShape=true){
 if(a.dataset.id==='heads'&&b.dataset.id==='filter'){
  const targetNode=ports(b,'in')[0],target=box(targetNode),group=box(a),outputs=opened.has('heads')?ports(a,'out'):null;
  if(!opened.has('heads')){for(let i=0;i<3;i++){const y=group.t+group.h*(i+1)/4;edge('M '+group.r+' '+y+' H '+target.l);labelShape('85 × '+[80,40,20][i]+' × '+[80,40,20][i],(group.r+target.l)/2,y);}return;}

  for(let i=0;i<3;i++){
   const source=outputs?box(outputs[i]):group,sy=outputs?source.t+source.h/2:group.t+group.h*(i+1)/4;
   const shape=outputs?tensorShape(outputs[i]):'85 × '+[80,40,20][i]+' × '+[80,40,20][i];
   if(i===1){edge('M '+source.r+' '+sy+' H '+target.l);labelShape(shape,(source.r+target.l)/2,sy);continue;}
   const above=i===0,tx=target.l+target.w*.5,ty=above?target.t:target.b;
   if(above?sy<ty-25:sy>ty+25){edge('M '+source.r+' '+sy+' H '+tx+' V '+ty);labelShape(shape,(source.r+tx)/2,sy);}
   else{const rail=group.r+35,y=above?Math.min(sy,target.t)-35:Math.max(sy,target.b)+35;edge('M '+source.r+' '+sy+' H '+rail+' V '+y+' H '+tx+' V '+ty);labelShape(shape,(rail+tx)/2,y);}
  }return;
 }
 if(/^head(?:80|40|20)branches$/.test(a.dataset.id)&&b.dataset.id===a.dataset.id.replace('branches','pack')){
  const target=box(b);for(const output of ports(a,'out')){const source=box(output),y=source.t+source.h/2;edge('M '+source.r+' '+y+' H '+target.l);labelShape(tensorShape(output),(source.r+target.l)/2,y);}return;
 }
 if(a.dataset.id==='neck'&&b.dataset.id==='heads'&&opened.has('heads')){
  const firstHead=canvas.querySelector('[data-id="head80"]'),fineTarget=box(ports(firstHead,'in')[0]);
  const neck=box(a),heads=box(b),neckExpanded=opened.has('neck'),bottomNode=canvas.querySelector('[data-id="neckbottomup"]');
  if(neckExpanded&&!opened.has('neckbottomup')){
   const bottom=box(bottomNode),cy=bottom.t+bottom.h/2,sx=bottom.l+bottom.w*.65;
   const targets=[80,40,20].map(size=>box(ports(canvas.querySelector('[data-id="head'+size+'"]'),'in')[0]));
   const plain=[80,40,20].every(size=>!opened.has('head'+size));
   const reach=bottom.h/2+45;
   for(let i=0;i<3;i++){
    const target=targets[i],ty=target.t+target.h/2,shape=[128,256,512][i]+' × '+[80,40,20][i]+' × '+[80,40,20][i];
    if(i===1){edge('M '+bottom.r+' '+cy+' H '+target.l);labelShape(shape,(bottom.r+target.l)/2,cy);continue;}
    const sign=i===0?-1:1,sy=cy+sign*bottom.h*(.5-.25*.65),y=plain?ty:cy+sign*reach;
    if(plain){edge('M '+sx+' '+sy+' V '+y+' H '+target.l);labelShape(shape,(sx+target.l)/2,y);}
    else{const rail=heads.l-35;edge('M '+sx+' '+sy+' V '+y+' H '+rail+' V '+ty+' H '+target.l);labelShape(shape,(sx+rail)/2,y);labelShape(shape,(rail+target.l)/2,ty);}
   }return;
  }

  for(const [id,targetId,shape,slot] of [['cspneck80','head80','128 × 80 × 80',0],['cspneckbottom40','head40','256 × 40 × 40',1],['cspneckbottom20','head20','512 × 20 × 20',2]]){
   const target=slot===0?fineTarget:box(ports(canvas.querySelector('[data-id="'+targetId+'"]'),'in')[0]);
   const bottom=neckExpanded?box(bottomNode):neck;
   if(slot===0&&neckExpanded&&opened.has('neckbottomup')){
    const first=box(ports(bottomNode,'in')[0]),row=box(bottomNode.querySelector(':scope > .flow')),sx=first.l-30,sy=first.t+first.h/2,y=row.t+22,rail=target.l-140,ty=target.t+target.h/2;
    edge('M '+sx+' '+sy+' V '+y+' H '+rail+' V '+ty+' H '+target.l);labelShape(shape,(sx+bottom.r)/2,y);labelShape(shape,(rail+target.l)/2,ty);continue;
   }
   const visible=neckExpanded&&slot!==0?canvas.querySelector('[data-id="'+id+'"]'):null,source=visible?box(ports(visible,'out')[0]):bottom;
   const sy=visible?source.t+source.h/2:source.t+source.h*(neckExpanded?(slot===0?.25:.5):(slot+1)/4),ty=target.t+target.h/2,rail=heads.l-115;
   if(slot===1&&visible){
    const group=box(canvas.querySelector('[data-id="'+id+'"]')),exit=group.r+35,y=bottom.b+45;
    edge('M '+source.r+' '+sy+' H '+exit+' V '+y+' H '+rail+' V '+ty+' H '+target.l);labelShape(shape,(exit+rail)/2,y);labelShape(shape,(rail+target.l)/2,ty);
   }else{edge('M '+source.r+' '+sy+' H '+rail+' V '+ty+' H '+target.l);labelShape(shape,(rail+target.l)/2,ty);}
  }
  return;
 }

 if(a.dataset.id==='neck'&&b.dataset.id==='heads'){
  const target=box(b);
  if(!opened.has('neck')){const source=box(a);for(const [i,shape] of ['128 × 80 × 80','256 × 40 × 40','512 × 20 × 20'].entries()){const y=source.t+source.h*(i+1)/4;edge('M '+source.r+' '+y+' H '+target.l);labelShape(shape,(source.r+target.l)/2,y);}return;}
  const topNode=canvas.querySelector('[data-id="necktopdown"]'),bottomNode=canvas.querySelector('[data-id="neckbottomup"]'),top=box(topNode),bottom=box(bottomNode);
  if(!opened.has('necktopdown')&&!opened.has('neckbottomup')){
   const cy=bottom.t+bottom.h/2,clearance=Math.max(bottom.h,target.h)/2+25,sx=bottom.l+bottom.w*.8,tx=target.l+target.w*.5;
   for(const [shape,sign] of [['128 × 80 × 80',-1],['256 × 40 × 40',1]]){
    const y=cy+sign*clearance,sy=cy+sign*bottom.h*.3,ty=sign<0?target.t:target.b;
    edge('M '+sx+' '+sy+' V '+y+' H '+tx+' V '+ty);labelShape(shape,(sx+tx)/2,y);
   }
   edge('M '+bottom.r+' '+cy+' H '+target.l);labelShape('512 × 20 × 20',(bottom.r+target.l)/2,cy);return;
  }
  for(const [id,group,side] of [['cspneck80',bottomNode,'top'],['cspneckbottom40',bottomNode,'bottom'],['cspneckbottom20',bottomNode,'straight']]){
   const visible=side==='top'?null:canvas.querySelector('[data-id="'+id+'"]'),source=box(ports(visible||group,'out')[0]),shape=index.get(id).shape;
   if(side==='top'){
    const tx=target.l+target.w*.5;
    if(opened.has('neckbottomup')){
     const first=box(ports(bottomNode,'in')[0]),row=box(bottomNode.querySelector(':scope > .flow'));
     const sx=first.l-30,sy=first.t+first.h/2,y=row.t+22;
     edge('M '+sx+' '+sy+' V '+y+' H '+tx+' V '+target.t);
     labelShape(shape,(sx+bottom.r)/2,y);
     labelShape(shape,(bottom.r+tx)/2,y);
    }else{
     const sx=bottom.l+bottom.w*.8,sy=bottom.t+bottom.h*.2;
     const y=Math.min(bottom.t,target.t)-45;
     edge('M '+sx+' '+sy+' V '+y+' H '+tx+' V '+target.t);
     labelShape(shape,(sx+tx)/2,y);
    }
    continue;
   }
   if(side==='straight'){const y=source.t+source.h/2;edge('M '+source.r+' '+y+' H '+target.l);labelShape(shape,(source.r+target.l)/2,y);continue;}
   const above=side==='top',sx=source.l+source.w*.8,tx=target.l+target.w*(above?.35:.65),tapered=!visible;
   const sy=above?source.t+(tapered?source.h*.05:0):source.b-(tapered?source.h*.2:0);
   const y=above?Math.min(top.t,bottom.t,target.t)-75:Math.max(top.b,bottom.b,target.b)+75;
   edge('M '+sx+' '+sy+' V '+y+' H '+tx+' V '+(above?target.t:target.b));labelShape(shape,(sx+tx)/2,y);
  }
  return;
 }

 if(a.dataset.id==='necktopdown'&&b.dataset.id==='neckbottomup'&&!opened.has('necktopdown')&&!opened.has('neckbottomup')){
  const source=box(a),target=box(b);
  for(const [id,fraction] of [['neckreduce',.25],['cspneck80',.5],['neckreduce40',.75]]){
   const y=source.t+source.h*fraction;
   edge('M '+source.r+' '+y+' H '+target.l);
   labelShape(index.get(id).shape,(source.r+target.l)/2,y);
  }
  return;
 }

 if(a.dataset.id==='pools'&&b.dataset.id==='sppcat'&&a.classList.contains('open')){
  const target=box(b);for(const output of ports(a,'out')){const source=box(output),y=source.t+source.h/2;edge('M '+source.r+' '+y+' H '+target.l);labelShape(tensorShape(output),(source.r+target.l)/2,y);}return;
 }
 if(a.dataset.id==='pools'&&b.dataset.id==='sppcat'&&!a.classList.contains('open')){
  const source=box(a),target=box(b),shape='256 × 20 × 20',mid=(source.r+target.l)/2;
  for(const fraction of [.125,.375,.625,.875]){const y=source.t+source.h*fraction;edge('M '+source.r+' '+y+' H '+target.l);labelShape(shape,mid,y);}return;
 }
 if(index.get(a.dataset.id)?.title==='Residual paths'&&index.get(b.dataset.id)?.title==='Elementwise add'){
  const target=box(b);
  if(a.classList.contains('open')){for(const node of ports(a,'out')){const source=box(node),y=source.t+source.h/2;edge('M '+source.r+' '+y+' H '+target.l);labelShape(tensorShape(node),(source.r+target.l)/2,y);}}
  else{const source=box(a);for(const fraction of [.28,.72]){const y=source.t+source.h*fraction;edge('M '+source.r+' '+y+' H '+target.l);labelShape(tensorShape(a),(source.r+target.l)/2,y);}}
  return;
 }
 if(a.dataset.id==='backbone'&&b.dataset.id==='neck'&&!opened.has('backbone')){
  const source=box(a);
  if(!opened.has('neck')){const target=box(b);for(const [i,stage] of stages.slice(2).entries()){const y=source.t+source.h*(i+1)/4;edge('M '+source.r+' '+y+' H '+target.l,true);labelShape(stage.shape,(source.r+target.l)/2,y);}return;}
  for(const d of [3,4,5])routeNeckInput(a,b,d);return;
 }
 const sources=ports(a,'out'),targets=ports(b,'in');
 if(targets.length>1){
  const from=sources[0],source=box(from),sy=source.t+source.h/2,rail=Math.min(...targets.map(node=>box(node).l))-140;
  edge('M '+source.r+' '+sy+' H '+rail,false,false);
  const ys=targets.map(node=>{const r=box(node);return r.t+r.h/2;});edge('M '+rail+' '+Math.min(sy,...ys)+' V '+Math.max(sy,...ys),false,false);
  targets.forEach((node,i)=>{const target=box(node);edge('M '+rail+' '+ys[i]+' H '+target.l,false,!node.classList.contains('passthrough-anchor'));labelShape(tensorShape(from),(rail+target.l)/2,ys[i]);});return;
 }
 if(sources.length>1){
  const target=box(targets[0]);
  sources.forEach((node,i)=>{const source=box(node),sy=source.t+source.h/2;
   if(i===0){const ty=target.t+target.h/2;edge('M '+source.r+' '+sy+' H '+target.l);labelShape(tensorShape(node),(source.r+target.l)/2,ty);}
   else{const tx=target.l+target.w*i/sources.length;edge('M '+source.r+' '+sy+' H '+tx+' V '+target.b);labelShape(tensorShape(node),(source.r+tx)/2,sy);}
  });return;
 }
 const from=sources[0],to=targets[0],x=box(from),y=box(to),sy=x.t+x.h/2,ty=y.t+y.h/2,m=(x.r+y.l)/2;
 if(Math.abs(sy-ty)<.5){edge('M '+x.r+' '+sy+' H '+y.l);if(showShape)labelShape(tensorShape(from),m,sy);}
 else{edge('M '+x.r+' '+sy+' H '+m+' V '+ty+' H '+y.l);if(showShape)labelShape(tensorShape(from),(x.r+m)/2,sy);}
 }
 // Align actual visible input/output ports rather than the centers of group frames.
 const rows=[...canvas.querySelectorAll('.flow')];
 for(const row of rows){row.style.alignItems='flex-start';for(const node of [...row.children].filter(e=>e.classList.contains('node'))){node.style.marginTop='0px';node.style.transform='';}}
 // Finalize the filter input height before aligning its internal row.
 if(!opened.has('heads')){
  const filter=canvas.querySelector('[data-id="filter"]'),heads=canvas.querySelector('[data-id="heads"]');
  ports(filter,'in')[0].querySelector('.label').style.minHeight=box(heads).h+'px';
 }
 for(const row of rows.reverse()){
  const nodes=[...row.children].filter(e=>e.classList.contains('node'));if(!nodes.length)continue;
  for(let i=1;i<nodes.length;i++){const node=nodes[i],previous=nodes[i-1];if(index.get(node.dataset.id)?.title==='Elementwise add'&&index.get(previous.dataset.id)?.title==='Residual paths'&&previous.classList.contains('open')){const outputs=ports(previous,'out').map(box),ys=outputs.map(r=>r.t+r.h/2);node.querySelector('.label').style.minHeight=(Math.max(...ys)-Math.min(...ys)+100)+'px';node.dataset.inputOffset='50';}}
  for(let i=1;i<nodes.length;i++){const node=nodes[i],previous=nodes[i-1];if(node.dataset.id==='sppcat'&&previous.dataset.id==='pools'&&previous.classList.contains('open')){const ys=ports(previous,'out').map(output=>{const r=box(output);return r.t+r.h/2;});node.querySelector('.label').style.minHeight=(Math.max(...ys)-Math.min(...ys)+48)+'px';node.dataset.inputOffset='24';}}
  for(let i=1;i<nodes.length;i++){const node=nodes[i],previous=nodes[i-1];if(/^head(?:80|40|20)pack$/.test(node.dataset.id)){const ys=ports(previous,'out').map(output=>{const r=box(output);return r.t+r.h/2;});node.querySelector('.label').style.minHeight=(Math.max(...ys)-Math.min(...ys)+100)+'px';node.dataset.inputOffset='50';}}
  const offsets=[0];
  const portOffset=(node,side)=>{if(node.dataset.id==='heads'&&opened.has('heads')){const middle=box(ports(canvas.querySelector('[data-id="head40"]'),side)[0]),n=box(node);return middle.t+middle.h/2-n.t;}if(side==='in'&&node.dataset.inputOffset)return Number(node.dataset.inputOffset);const p=box(ports(node,side)[0]),n=box(node);return p.t+p.h/2-n.t;};
  for(let i=1;i<nodes.length;i++)offsets[i]=offsets[i-1]+portOffset(nodes[i-1],'out')-portOffset(nodes[i],'in');
  const minimum=Math.min(...offsets);nodes.forEach((node,i)=>node.style.marginTop=(offsets[i]-minimum)+'px');
 }
 for(const anchor of canvas.querySelectorAll('.shortcut-anchor')){const lanes=anchor.closest('.lanes'),first=lanes.children[0].querySelector('.node'),input=box(ports(first,'in')[0]),shortcut=box(anchor),sx=input.l-80,sy=input.t+input.h/2;edge('M '+sx+' '+sy+' V '+(shortcut.t+shortcut.h/2)+' H '+shortcut.r,false,false);}
 const neckNode=canvas.querySelector('[data-id="neck"]');
 for(const row of canvas.querySelectorAll('.flow')){const nodes=[...row.children].filter(e=>e.classList.contains('node'));for(let i=1;i<nodes.length;i++){if(opened.has('backbone')&&nodes[i-1].dataset.id==='backbone'&&nodes[i].dataset.id==='neck')continue;link(nodes[i-1],nodes[i]);}}
 if(opened.has('backbone'))for(const d of [3,4,5]){
  const stage=canvas.querySelector('[data-id="dark'+d+'"]');
  for(const output of ports(stage,'out'))routeNeckInput(output,neckNode,d);
 }
 // Retained top-down features are separate inputs to bottom-up fusion.
 if(opened.has('neck')&&(opened.has('necktopdown')||opened.has('neckbottomup'))){
  const topNode=canvas.querySelector('[data-id="necktopdown"]'),bottomNode=canvas.querySelector('[data-id="neckbottomup"]');
  const top=box(topNode),bottom=box(bottomNode),expanded=opened.has('necktopdown'),bottomExpanded=opened.has('neckbottomup');
  for(const [id,above] of [['neckreduce',true],['neckreduce40',false]]){
   const sourceNode=expanded?ports(canvas.querySelector('[data-id="'+id+'"]'),'out')[0]:topNode;
   const target=box(bottomExpanded?canvas.querySelector('[data-id="neckbottomcat'+(above?'20':'40')+'"]'):bottomNode);
   const source=box(sourceNode),sx=source.l+source.w*.65,tx=target.l+target.w*.5;
   const sy=above?source.t+(expanded?0:source.h*.0875):source.b-(expanded?0:source.h*.0875);
   const ty=above?target.t+(bottomExpanded?0:target.h*.125):target.b-(bottomExpanded?0:target.h*.125);
   const y=above?Math.min(top.t,bottom.t)-45:Math.max(top.b,bottom.b)+45;
   if(expanded){const group=box(canvas.querySelector('[data-id="'+id+'"]')),rail=group.r+35,cy=source.t+source.h/2;edge('M '+source.r+' '+cy+' H '+rail+' V '+y+' H '+tx+' V '+ty);labelShape(index.get(id).shape,(rail+tx)/2,y);}
   else{edge('M '+sx+' '+sy+' V '+y+' H '+tx+' V '+ty);labelShape(index.get(id).shape,(sx+tx)/2,y);}
  }
 }
 canvas.append(svg);
 placeDimensionLabels(svg,box);
}
// Keep each dimension on its own horizontal segment, clear of frames and text.
function placeDimensionLabels(svg,box){
 const segments=[];
 for(const path of svg.querySelectorAll('path')){
  let x=0,y=0;for(const match of path.getAttribute('d').matchAll(/([MHVL])\s*([^MHVL]+)/g)){
   const values=match[2].trim().split(/[ ,]+/).map(Number),command=match[1];let nx=x,ny=y;
   if(command==='M'||command==='L'){nx=values[0];ny=values[1];}else if(command==='H')nx=values[0];else ny=values[0];
   if(command!=='M')segments.push({x1:x,y1:y,x2:nx,y2:ny});x=nx;y=ny;
  }
 }
 const frames=[...canvas.querySelectorAll('.node.open:not(.inline-branches)')].map(box);
 const blocks=[...canvas.querySelectorAll('.node>.label')].flatMap(e=>e.parentNode.classList.contains('open')?[...e.querySelectorAll('strong,.action')].map(box):[box(e)]);
 const placed=[];
 for(const text of svg.querySelectorAll('text')){
  const original=Number(text.getAttribute('x')),lineY=Number(text.dataset.edgeY),r=box(text),width=r.w,half=width/2+5;
  const candidates=segments.filter(s=>Math.abs(s.y1-lineY)<.5&&Math.abs(s.y2-lineY)<.5&&original>=Math.min(s.x1,s.x2)-1&&original<=Math.max(s.x1,s.x2)+1).sort((a,b)=>Math.abs(b.x2-b.x1)-Math.abs(a.x2-a.x1));
  let chosen=null;
  for(const segment of candidates){
   let intervals=[[Math.min(segment.x1,segment.x2)+half,Math.max(segment.x1,segment.x2)-half]];
   const forbidden=[];
   for(const b of [...blocks,...placed])if(r.b>b.t-4&&r.t<b.b+4)forbidden.push([b.l-half,b.r+half]);
   for(const f of frames){
    if(r.b>f.t-4&&r.t<f.b+4)forbidden.push([f.l-half-4,f.l+half+4],[f.r-half-4,f.r+half+4]);
    if(r.t<f.t+4&&r.b>f.t-4||r.t<f.b+4&&r.b>f.b-4)forbidden.push([f.l-half,f.r+half]);
   }
   for(const s of segments)if(Math.abs(s.x1-s.x2)<.5&&Math.max(s.y1,s.y2)>r.t-3&&Math.min(s.y1,s.y2)<r.b+3)forbidden.push([s.x1-half-3,s.x1+half+3]);
   for(const [l,h] of forbidden)intervals=intervals.flatMap(([a,b])=>h<a||l>b?[[a,b]]:[[a,Math.min(b,l)],[Math.max(a,h),b]].filter(([a,b])=>b>=a));
   const possible=intervals.filter(([a,b])=>b>=a).map(([a,b])=>Math.max(a,Math.min(b,original))).sort((a,b)=>Math.abs(a-original)-Math.abs(b-original));
   if(possible.length){chosen=possible[0];break;}
  }
  if(chosen!==null)text.setAttribute('x',chosen);
  placed.push(box(text));
 }
}
let connectionFrame=0;
function trackConnections(){cancelAnimationFrame(connectionFrame);const end=performance.now()+350;function tick(){drawConnections();if(performance.now()<end)connectionFrame=requestAnimationFrame(tick);}connectionFrame=requestAnimationFrame(tick);}
new ResizeObserver(()=>drawConnections()).observe(canvas);
window.addEventListener('resize',drawConnections);

function fitCurrentDiagram(){
 hideInputPopup();drawConnections();
 const connections=canvas.querySelector('.connections'),bounds=connections.getBBox();
 const left=Math.min(0,bounds.x),top=Math.min(0,bounds.y),right=Math.max(canvas.offsetWidth,bounds.x+bounds.width),bottom=Math.max(canvas.offsetHeight,bounds.y+bounds.height);
 const margin=24,controlBottom=document.getElementById('diagram-controls').getBoundingClientRect().bottom;
 const availableWidth=Math.max(1,viewport.clientWidth-margin*2),availableTop=controlBottom+20,availableHeight=Math.max(1,viewport.clientHeight-availableTop-margin);
 scale=Math.max(.001,Math.min(1,availableWidth/Math.max(1,right-left),availableHeight/Math.max(1,bottom-top)));
 panX=margin+(availableWidth-(right-left)*scale)/2-left*scale;
 panY=availableTop+(availableHeight-(bottom-top)*scale)/2-top*scale;updateCamera();
}
document.getElementById('diagram-home').onclick=fitCurrentDiagram;
document.getElementById('diagram-collapse').onclick=()=>{opened.clear();selected=null;render();fitCurrentDiagram();};
document.getElementById('diagram-expand').onclick=()=>{for(const node of index.values())if(node.children)opened.add(node.id);selected=null;render();fitCurrentDiagram();};

function centerInitialDiagram(){panX=(viewport.clientWidth-canvas.offsetWidth*scale)/2;panY=(viewport.clientHeight-canvas.offsetHeight*scale)/2;updateCamera();}
render();centerInitialDiagram();
// Recheck after fonts settle so the initial center matches the final text layout.
document.fonts.ready.then(centerInitialDiagram);
