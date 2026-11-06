// Popup rendering and animation.

let siluStep=0;
const siluValue=x=>x/(1+Math.exp(-x));
const siluSlope=x=>{const sigmoid=1/(1+Math.exp(-x));return sigmoid+x*sigmoid*(1-sigmoid);};
function showSiLUStep(){
 cancelAnimationFrame(siluAnimationFrame);
 document.getElementById('silu-stage').textContent=(siluStep+1)+' / 2';
 const content=document.getElementById('silu-content');content.replaceChildren();
 const math=body=>'<div class="silu-formula-slot"><math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow>'+body+'</mrow></math></div>';
 if(siluStep===0)content.innerHTML=math('<mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mi>x</mi><mrow><mn>1</mn><mo>+</mo><msup><mi>e</mi><mrow><mo>−</mo><mi>x</mi></mrow></msup></mrow></mfrac>');
 else content.innerHTML=math('<mfrac><mrow><mi>d</mi><mi>L</mi></mrow><mrow><mi>d</mi><mi>w</mi></mrow></mfrac><mo>=</mo><mfrac><mrow><mi>d</mi><mi>L</mi></mrow><mrow><mi>d</mi><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow></mfrac><mo>·</mo><msup><mi>f</mi><mo>′</mo></msup><mo>(</mo><mi>x</mi><mo>)</mo><mo>·</mo><mfrac><mrow><mi>d</mi><mi>x</mi></mrow><mrow><mi>d</mi><mi>w</mi></mrow></mfrac>');
 const svg=svgElement('svg',{viewBox:'0 0 510 270',role:'img','aria-label':siluStep===0?'SiLU activation curve':'SiLU curve with a moving tangent showing its derivative'});content.append(svg);
 function text(value,x,y,attrs={}){const e=svgElement('text',{x,y,'text-anchor':'middle',...attrs});e.textContent=value;svg.append(e);return e;}
 let update=()=>{};
  const px=x=>45+(x+5)*42,py=y=>224-(y+1)*31;
  svg.append(svgElement('path',{d:'M 45 '+py(0)+' H 465 M '+px(0)+' 38 V 224',class:'silu-axis'}));
  for(const x of [-4,-2,0,2,4])text(x,px(x),246);
  for(const y of [0,2,4])text(y,28,py(y)+4);
  text('x',484,py(0)+4);text('f(x)',px(0),24);
  let d='';for(let i=0;i<=200;i++){const x=-5+i*.05;d+=(i?' L ':'M ')+px(x)+' '+py(siluValue(x));}svg.append(svgElement('path',{d,class:'silu-curve'}));
 if(siluStep===0){const p=document.createElement('p');p.textContent='Applied elementwise: positive values mostly pass through; negative values are smoothly suppressed. Tensor shape stays unchanged.';content.append(p);}else{
  const tangent=svgElement('path',{class:'silu-tangent'}),dot=svgElement('circle',{r:4,fill:'var(--accent)'});svg.append(tangent,dot);
  const slope=text('',370,24);
  update=seconds=>{const x=-4+8*(.5-.5*Math.cos(seconds*Math.PI/6)),y=siluValue(x),derivative=siluSlope(x),a=Math.max(-5,x-.9),b=Math.min(5,x+.9);dot.setAttribute('cx',px(x));dot.setAttribute('cy',py(y));tangent.setAttribute('d','M '+px(a)+' '+py(y+derivative*(a-x))+' L '+px(b)+' '+py(y+derivative*(b-x)));slope.textContent='f′(x) = '+derivative.toFixed(3);};
  const p=document.createElement('p');p.innerHTML='To minimize the loss <span class="inline-math">L</span>, YOLOX-S computes gradients such as <span class="inline-math">dL/dw</span>, which describe how changing a weight <span class="inline-math">w</span> affects the loss <span class="inline-math">L(w)</span>. It then updates weights in the direction that reduces <span class="inline-math">L</span>.';content.append(p);
  const note=document.createElement('p');note.innerHTML='Because SiLU lies along the path from <span class="inline-math">w</span> to <span class="inline-math">L(w)</span>, the chain rule includes its derivative <span class="inline-math">f′(x)</span> in the gradient. SiLU’s continuous derivative makes this multiplier change smoothly with its input, avoiding abrupt jumps.';content.append(note);
 }
 const started=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(now){update(Math.max(0,now-started)/1000);if(!reduced&&siluStep===1)siluAnimationFrame=requestAnimationFrame(frame);}frame(started);
 if(!siluPopup.hidden){const r=siluPopup.getBoundingClientRect();siluPopup.style.left=Math.max(12,Math.min(r.left,window.innerWidth-siluPopup.offsetWidth-12))+'px';siluPopup.style.top=Math.max(12,Math.min(r.top,window.innerHeight-siluPopup.offsetHeight-12))+'px';}
}
document.getElementById('silu-previous').onclick=()=>{siluStep=1-siluStep;showSiLUStep();};
document.getElementById('silu-next').onclick=()=>{siluStep=1-siluStep;showSiLUStep();};
