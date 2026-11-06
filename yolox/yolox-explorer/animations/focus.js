// Popup rendering and animation.

function focusCubeMapping(row,col,channel){return {row:Math.floor(row/2),col:Math.floor(col/2),channel:3*(2*(col%2)+(row%2))+channel};}
function buildFocusAnimation(){
 cancelAnimationFrame(focusAnimationFrame);
 const svg=document.getElementById('focus-animation');svg.replaceChildren();const cubes=[];

 for(let c=0;c<3;c++)for(let r=0;r<4;r++)for(let col=0;col<4;col++){
  const target=focusCubeMapping(r,col,c),step=(Math.floor(r/2)*2+Math.floor(col/2))*4+2*(col%2)+(r%2);
  const cube=svgElement('g',{class:'cube cube-'+['b','g','r'][c],style:'animation:none'});
  const title=svgElement('title',{});title.textContent='('+r+', '+col+', '+['B','G','R'][c]+') → ('+target.row+', '+target.col+', channel '+target.channel+')';cube.append(title);
  cube.append(svgElement('polygon',{points:'0,-8 7,-4 0,0 -7,-4'}),svgElement('polygon',{points:'-7,-4 0,0 0,8 -7,4',style:'filter:brightness(.8)'}),svgElement('polygon',{points:'0,0 7,-4 7,4 0,8',style:'filter:brightness(.65)'}));
  cubes.push({cube,r,col,c,target,step});
 }
 const started=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){
  const seconds=(Math.max(0,now-started)/1000)%14;
  for(const item of cubes){
   const {r,col,c,target,step}=item;
   const progress=reduced?1:Math.max(0,Math.min(1,(seconds-1-step*.6)/.6));
   const t=(1-Math.cos(Math.PI*progress))/2;
   const row=r+(target.row-r)*t,column=col+(target.col-col)*t,z=c+(target.channel-c)*t;
   const originX=110+(345-110)*t,originY=140+(240-140)*t;
   item.cube.style.transform='translate('+(originX+(column-row)*18)+'px,'+(originY+(column+row)*10-z*12)+'px)';
   // Paint back-to-front, including after channel layers change during rearrangement.
   item.depth=z*100+(row+column)*10+column;
  }
  cubes.sort((a,b)=>a.depth-b.depth).forEach(item=>svg.append(item.cube));
  if(!reduced)focusAnimationFrame=requestAnimationFrame(frame);
 }
 frame(started);
}
