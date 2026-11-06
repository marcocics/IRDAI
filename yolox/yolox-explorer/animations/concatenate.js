// Popup rendering and animation.

function concatBranches(node){
 const channels=Number(node.shape.split(' × ')[0]);
 if(node.concatParts){let start=0;return node.concatParts.map(part=>{const branch={...part,start};start+=part.count;return branch;});}
 if(node.concatNames)return node.concatNames.map((name,i)=>({name,count:channels/2,start:i*channels/2}));
 return node.id==='sppcat'?['Unpooled X','5 × 5 pooled X','9 × 9 pooled X','13 × 13 pooled X'].map((name,i)=>({name,count:channels/4,start:i*channels/4})):['Bottleneck branch','Bypass branch'].map((name,i)=>({name,count:channels/2,start:i*channels/2}));
}
function buildConcatAnimation(node){
 cancelAnimationFrame(concatAnimationFrame);
 const svg=document.getElementById('concat-animation'),ranges=document.getElementById('concat-ranges');svg.replaceChildren();ranges.replaceChildren();
 document.getElementById('concat-title').textContent=node.title;

 const branches=concatBranches(node);svg.setAttribute('viewBox',branches.length===2?'0 72 500 173':'0 15 500 230');const colors=['#8b80d6','#d59a51','#4b9eaa','#b66d91'],slices=[];
 const channels=Number(node.shape.split(' × ')[0]),spatial=node.shape.split(' × ').slice(1).join(' × ');
 document.getElementById('concat-shape').textContent='('+branches.map(b=>b.count).join('+')+') × '+spatial+' → '+node.shape;
 let displayStart=0;
 branches.forEach((branch,i)=>{
  const line=document.createElement('p');line.className='concat-range';const swatch=document.createElement('span');swatch.className='branch-swatch';swatch.style.background=colors[i];const label=document.createElement('span');label.textContent=branch.name+' → '+(branch.count===1?'channel '+branch.start:'channels '+branch.start+'–'+(branch.start+branch.count-1));line.append(swatch,label);ranges.append(line);
  const x=branches.length===2?75+i*135:40+i*72;
  for(let j=0;j<Math.min(3,branch.count);j++){
   const slice=svgElement('g',{});slice.append(svgElement('polygon',{points:'0,0 36,-18 68,0 32,18',fill:colors[i],stroke:'var(--panel)','stroke-width':1}),svgElement('polygon',{points:'0,0 32,18 32,22 0,4',fill:colors[i],style:'filter:brightness(.8)'}),svgElement('polygon',{points:'32,18 68,0 68,4 32,22',fill:colors[i],style:'filter:brightness(.65)'}));
   // Lower-index channels occupy the base; subsequent branches append above them.
   slices.push({slice,i,j,sx:x,sy:150-j*15,tx:385,ty:200-(displayStart+j)*13});
  }
  displayStart+=Math.min(3,branch.count);
 });
 const text=(value,x,y)=>{const t=svgElement('text',{x,y,'text-anchor':'middle'});t.textContent=value;svg.append(t);};
 text('Separate branches',branches.length===2?175:160,90);text('Concatenated',420,branches.length===2?100:35);text('Representative channel slices',250,235);
 const started=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){const seconds=(Math.max(0,now-started)/1000)%(branches.length*1.1+3);
  for(const item of slices){const t=reduced?1:Math.max(0,Math.min(1,(seconds-.8-item.i*1.1)/.9)),ease=(1-Math.cos(Math.PI*t))/2;item.slice.style.transform='translate('+(item.sx+(item.tx-item.sx)*ease)+'px,'+(item.sy+(item.ty-item.sy)*ease)+'px)';item.depth=item.sy+(item.ty-item.sy)*ease;}
  // Draw base channels first, then the slices stacked above them.
  slices.sort((a,b)=>b.depth-a.depth).forEach(item=>svg.append(item.slice));
  if(!reduced)concatAnimationFrame=requestAnimationFrame(frame);
 }
 frame(started);
}
