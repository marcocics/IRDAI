function nmsExampleIoU(a,b){
 const intersection=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return intersection/(a.w*a.h+b.w*b.h-intersection);
}
function buildNMSComparison(content){
 const boxes=[{name:'A',className:'cat',score:.90,x:55,y:35,w:185,h:125},{name:'B',className:'cat',score:.75,x:65,y:45,w:185,h:125},{name:'C',className:'dog',score:.60,x:75,y:55,w:185,h:125}],threshold=.5;
 let step=0;
 const controls=document.createElement('div');controls.className='nms-controls';
 const previous=document.createElement('button'),counter=document.createElement('span'),next=document.createElement('button');
 previous.type=next.type='button';previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','Previous NMS step');next.setAttribute('aria-label','Next NMS step');controls.append(previous,counter,next);content.append(controls);
 const note=document.createElement('p');note.textContent='Same candidates · confidence scores shown · IoU threshold '+threshold.toFixed(2);content.append(note);
 const columns=document.createElement('div');columns.className='nms-columns';content.append(columns);
 const panels=[false,true].map(agnostic=>{
  const panel=document.createElement('section');panel.className='nms-panel';panel.dataset.mode=agnostic?'agnostic':'per-class';
  const heading=document.createElement('h3');heading.textContent=agnostic?'Class-agnostic NMS':'Per-class NMS';panel.append(heading);
  const svg=svgElement('svg',{viewBox:'0 0 340 215',role:'img','aria-label':'Three overlapping predictions: A cat 0.90, B cat 0.75, C dog 0.60.'});panel.append(svg);
  const shapes=boxes.map((box,i)=>{
   const g=svgElement('g',{class:'nms-box'}),color=i===2?'#ad78c2':'var(--accent)';
   g.append(svgElement('rect',{x:box.x,y:box.y,width:box.w,height:box.h,rx:2,fill:'none',stroke:color,'stroke-width':2,...(i===1?{'stroke-dasharray':'6 4'}:{})}));
   const label=svgElement('text',{x:box.x+6,y:box.y+16});label.textContent=box.name;g.append(label);svg.append(g);return g;
  });
  const legend=document.createElement('div');legend.className='nms-legend';boxes.forEach(box=>{const label=document.createElement('span');label.textContent=box.name+' · '+box.className+' · '+box.score.toFixed(2);legend.append(label);});panel.append(legend);
  const status=document.createElement('p');status.className='nms-status';status.setAttribute('aria-live','polite');panel.append(status);columns.append(panel);
  return {agnostic,shapes,status,panel};
 });
 function update(){
  counter.textContent=(step+1)+' / 4';
  for(const {agnostic,shapes,status,panel} of panels){
   shapes.forEach((g,i)=>{const suppressed=i===1&&step>=2||i===2&&step>=3&&agnostic;g.style.opacity=suppressed?'.12':'1';g.querySelector('rect').setAttribute('stroke-width',i===0&&step>=1||i===2&&step===3&&!agnostic?3.5:2);});
   const overlapB=nmsExampleIoU(boxes[0],boxes[1]).toFixed(2),overlapC=nmsExampleIoU(boxes[0],boxes[2]).toFixed(2);
   if(step===0)status.textContent='All three candidates have already passed confidence thresholding.';
   if(step===1)status.textContent='Keep A: it has the highest confidence, 0.90.';
   if(step===2)status.textContent='Suppress B: same class as A; IoU(A, B) = '+overlapB+' > '+threshold.toFixed(2)+'.';
   if(step===3)status.textContent=agnostic?'Suppress C: classes are ignored; IoU(A, C) = '+overlapC+' > '+threshold.toFixed(2)+'. Result: keep A.':'Keep C: dog and cat are different classes, so A cannot suppress C—even though IoU(A, C) = '+overlapC+'. Result: keep A and C.';
   panel.dataset.step=step;panel.dataset.kept=step===3?(agnostic?'A':'A,C'):'';
  }
 }
 previous.onclick=()=>{step=(step+3)%4;update();};next.onclick=()=>{step=(step+1)%4;update();};update();
}
