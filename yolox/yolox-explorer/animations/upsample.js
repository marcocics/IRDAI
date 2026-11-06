// One-channel illustrative example; the real operation repeats every channel.
function buildUpsampleAnimation(){
 cancelAnimationFrame(upsampleAnimationFrame);
 const svg=document.getElementById('upsample-animation');svg.replaceChildren();
 const add=(tag,attrs,parent=svg)=>{const e=svgElement(tag,attrs);parent.append(e);return e;};
 const text=(value,x,y,parent=svg)=>{const t=add('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle'},parent);t.textContent=value;return t;};
 const colors=['#4b9eaa','#d59a51','#8b80d6','#6fa68b'],input=[],output=[];
 function cell(x,y,size,value,color,parent=svg){
  const g=add('g',{},parent);add('rect',{x,y,width:size,height:size,rx:1,fill:color,'fill-opacity':.32,stroke:'var(--line)'},g);text(value,x+size/2,y+size/2,g);return g;
 }
 for(let i=0;i<4;i++)input.push(cell(35+i%2*44,70+Math.floor(i/2)*44,44,i+1,colors[i]));
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const i=Math.floor(row/2)*2+Math.floor(col/2),x=270+col*34,y=46+row*34;
  add('rect',{x,y,width:34,height:34,fill:'var(--panel)',stroke:'var(--line)'});
  output.push({i,g:cell(x,y,34,i+1,colors[i])});
 }
 text('2 × 2',79,207);text('4 × 4',338,207);
 add('path',{d:'M 153 114 H 240 m -7 -4 l 7 4 -7 4',fill:'none',stroke:'var(--muted)','stroke-width':1.5});text('×2',196,94);
 const moving=add('g',{'pointer-events':'none'});
 const movingRect=add('rect',{x:0,y:0,width:44,height:44,fill:colors[0],'fill-opacity':.5,stroke:'var(--accent)','stroke-width':1.5},moving);
 const numbers=Array.from({length:4},()=>text('',0,0,moving));
 const started=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){
  const t=reduced?6:Math.max(0,now-started)/1000%7;
  const index=Math.min(3,Math.floor(t/1.25)),local=t-index*1.25,p=Math.max(0,Math.min(1,(local-.2)/.8)),ease=(1-Math.cos(Math.PI*p))/2;
  const done=t>=5;
  input.forEach((g,i)=>g.setAttribute('opacity',done||i===index?1:.65));
  output.forEach(({i,g})=>g.setAttribute('opacity',done||i<index||i===index&&p>=1?1:0));
  moving.setAttribute('opacity',done||p>=1?0:1);
  const sx=35+index%2*44,sy=70+Math.floor(index/2)*44,tx=270+index%2*68,ty=46+Math.floor(index/2)*68;
  const x=sx+(tx-sx)*ease,y=sy+(ty-sy)*ease,size=44+24*ease;
  movingRect.setAttribute('x',x);movingRect.setAttribute('y',y);movingRect.setAttribute('width',size);movingRect.setAttribute('height',size);movingRect.setAttribute('fill',colors[index]);
  numbers.forEach((n,j)=>{n.textContent=index+1;n.setAttribute('x',x+size*(j%2===0?.25:.75));n.setAttribute('y',y+size*(j<2?.25:.75));n.setAttribute('opacity',ease);});
  if(!reduced)upsampleAnimationFrame=requestAnimationFrame(frame);
 }
 frame(started);
}
