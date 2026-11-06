function buildSigmoidAnimation(){
 cancelAnimationFrame(sigmoidAnimationFrame);
 const svg=document.getElementById('sigmoid-animation');svg.replaceChildren();
 const add=(tag,attrs)=>{const e=svgElement(tag,attrs);svg.append(e);return e;};
 const text=(value,x,y,attrs={})=>{const t=add('text',{x,y,'text-anchor':'middle',...attrs});t.textContent=value;return t;};
 const px=x=>55+(x+7)*28,py=y=>215-y*160;
 add('path',{d:'M 55 215 H 447 M '+px(0)+' 38 V 225',fill:'none',stroke:'var(--line)'});
 add('path',{d:'M 55 55 H 447',fill:'none',stroke:'var(--line)','stroke-dasharray':'4 4'});
 for(const x of [-6,-3,0,3,6])text(x,px(x),238);
 for(const y of [0,.5,1])text(y,36,py(y)+4);
 text('logit x',462,259);text('σ(x)',px(0),25);
 let d='';for(let i=0;i<=280;i++){const x=-7+i*.05;d+=(i?' L ':'M ')+px(x)+' '+py(1/(1+Math.exp(-x)));}
 add('path',{d,fill:'none',stroke:'var(--accent)','stroke-width':2.5});
 const guides=add('path',{fill:'none',stroke:'var(--muted)','stroke-dasharray':'3 3'}),dot=add('circle',{r:4,fill:'var(--accent)'}),value=text('',370,25);
 const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){
  const seconds=Math.max(0,now-start)/1000,x=reduced?0:-6*Math.cos(seconds*Math.PI/5),y=1/(1+Math.exp(-x));
  dot.setAttribute('cx',px(x));dot.setAttribute('cy',py(y));guides.setAttribute('d','M '+px(x)+' 215 V '+py(y)+' H 55');value.textContent='x = '+x.toFixed(2)+' → '+y.toFixed(3);
  if(!reduced)sigmoidAnimationFrame=requestAnimationFrame(frame);
 }
 frame(start);
}
