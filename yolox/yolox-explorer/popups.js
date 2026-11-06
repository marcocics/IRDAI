// Shared click-to-open information buttons and animation cancellation.

let activePopupButton=null;
const neckPopup=document.getElementById('neck-popup');
const backbonePopup=document.getElementById('backbone-popup');
const headsPopup=document.getElementById('heads-popup');
const filterOverviewPopup=document.getElementById('filter-overview-popup'),outputPopup=document.getElementById('output-popup');
const filterInfoPopup=document.getElementById('filter-info-popup');
const sigmoidPopup=document.getElementById('sigmoid-popup'),bottomupPopup=document.getElementById('bottomup-popup');
const upsamplePopup=document.getElementById('upsample-popup');
const topdownPopup=document.getElementById('topdown-popup');
const inputPopup=document.getElementById('input-popup'),focusPopup=document.getElementById('focus-popup'),convPopup=document.getElementById('conv-popup'),bnPopup=document.getElementById('bn-popup'),siluPopup=document.getElementById('silu-popup'),addPopup=document.getElementById('add-popup'),concatPopup=document.getElementById('concat-popup'),maxpoolPopup=document.getElementById('maxpool-popup');let inputHoverTimer,focusAnimationFrame=0,convAnimationFrame=0,bnAnimationFrame=0,siluAnimationFrame=0,concatAnimationFrame=0,maxpoolAnimationFrame=0,topdownAnimationFrame=0,upsampleAnimationFrame=0,sigmoidAnimationFrame=0,bottomupAnimationFrame=0;let popupCloseTimer;const popupOpeners=new WeakMap();
function hideInputPopup(){if(activePopupButton){activePopupButton.setAttribute('aria-expanded','false');activePopupButton=null;}clearTimeout(popupCloseTimer);cancelAnimationFrame(focusAnimationFrame);cancelAnimationFrame(convAnimationFrame);cancelAnimationFrame(bnAnimationFrame);cancelAnimationFrame(siluAnimationFrame);cancelAnimationFrame(concatAnimationFrame);cancelAnimationFrame(maxpoolAnimationFrame);cancelAnimationFrame(topdownAnimationFrame);cancelAnimationFrame(upsampleAnimationFrame);cancelAnimationFrame(sigmoidAnimationFrame);cancelAnimationFrame(bottomupAnimationFrame);clearTimeout(inputHoverTimer);filterOverviewPopup.hidden=true;outputPopup.hidden=true;headsPopup.hidden=true;backbonePopup.hidden=true;neckPopup.hidden=true;inputPopup.hidden=true;focusPopup.hidden=true;convPopup.hidden=true;bnPopup.hidden=true;siluPopup.hidden=true;addPopup.hidden=true;concatPopup.hidden=true;maxpoolPopup.hidden=true;topdownPopup.hidden=true;upsamplePopup.hidden=true;sigmoidPopup.hidden=true;bottomupPopup.hidden=true;filterInfoPopup.hidden=true;}
function schedulePopupClose(popup){clearTimeout(popupCloseTimer);popupCloseTimer=setTimeout(()=>{if(popup.matches(':hover')||popup.contains(document.activeElement))return;hideInputPopup();},250);}

function attachPopup(button,popup,convolution=null){
 const info=document.createElement('button');info.type='button';info.className='popup-info';info.textContent='i';
 info.title='Explanation';info.setAttribute('aria-label','Information about '+button.querySelector('strong').textContent);
 info.setAttribute('aria-controls',popup.id);info.setAttribute('aria-expanded','false');
 button.popupInfo=info;
 info.addEventListener('click',e=>{
  e.stopPropagation();const closing=activePopupButton===info&&!popup.hidden;hideInputPopup();if(closing)return;
  activePopupButton=info;info.setAttribute('aria-expanded','true');popup.hidden=false;
  if(popup===filterInfoPopup){document.getElementById('filter-info-title').textContent=convolution.title;const content=document.getElementById('filter-info-content');content.replaceChildren();filterInfoPopup.classList.toggle('nms-comparison',convolution.id==='nms');if(convolution.id==='nms')buildNMSComparison(content);else{for(const paragraph of convolution.filterHelp){const p=document.createElement('p');p.textContent=paragraph;content.append(p);}if(convolution.confidenceExample)appendConfidenceExample(content,convolution.confidenceExample);}}if(popup===neckPopup)showNeckExample();if(popup===sigmoidPopup)buildSigmoidAnimation();if(popup===bottomupPopup)buildBottomUpAnimation();if(popup===upsamplePopup)buildUpsampleAnimation();if(popup===topdownPopup)buildTopDownAnimation();if(popup===focusPopup)buildFocusAnimation();if(popup===convPopup)buildConvAnimation(convolution);if(popup===maxpoolPopup)buildMaxPoolAnimation(convolution);if(popup===bnPopup)buildBNAnimation();if(popup===concatPopup)buildConcatAnimation(convolution);if(popup===siluPopup){siluStep=0;showSiLUStep();}
  const r=info.getBoundingClientRect(),gap=10,pad=12;let left=r.right-popup.offsetWidth,top=r.bottom+gap;
  left=Math.max(pad,Math.min(left,window.innerWidth-popup.offsetWidth-pad));if(top+popup.offsetHeight>window.innerHeight-pad)top=Math.max(pad,r.top-popup.offsetHeight-gap);
  top=Math.max(pad,Math.min(top,window.innerHeight-popup.offsetHeight-pad));
  popup.style.left=left+'px';popup.style.top=top+'px';
 });
}
window.addEventListener('blur',hideInputPopup);
document.addEventListener('visibilitychange',hideInputPopup);
document.addEventListener('pointerdown',e=>{if(e.target.closest('.popup-info')||e.target.closest('#filter-overview-popup,#output-popup,#heads-popup,#backbone-popup,#neck-popup,#input-popup,#focus-popup,#conv-popup,#bn-popup,#silu-popup,#add-popup,#concat-popup,#maxpool-popup,#topdown-popup,#upsample-popup,#sigmoid-popup,#bottomup-popup,#filter-info-popup'))return;hideInputPopup();});

viewport.addEventListener('wheel',hideInputPopup,{passive:true});window.addEventListener('resize',hideInputPopup);window.addEventListener('keydown',e=>{if(e.key==='Escape')hideInputPopup();});

function appendConfidenceExample(content,example){
 const svg=svgElement('svg',{viewBox:'0 0 420 225',class:'confidence-example',role:'img','aria-label':'Example with threshold '+example.threshold.toFixed(2)+': Box A confidence 0.72 is kept; Box B confidence 0.19 is discarded.'});
 const text=(value,x,y,extra={})=>{const t=svgElement('text',{x,y,'text-anchor':'middle',...extra});t.textContent=value;svg.append(t);};
 text('Example · threshold '+example.threshold.toFixed(2),210,24);
 example.boxes.forEach((box,i)=>{
  const x=20+i*210,cx=x+85,score=box.classScore*box.objectness,keep=score>=example.threshold;
  svg.append(svgElement('rect',{x:x+15,y:44,width:140,height:66,rx:3,fill:'var(--soft)',stroke:keep?'var(--accent)':'var(--muted)','stroke-width':2,...(keep?{}:{'stroke-dasharray':'5 4'})}));
  text(box.name,cx,82);
  text('Class score: '+box.classScore.toFixed(2),cx,136);
  text('Objectness: '+box.objectness.toFixed(2),cx,156);
  text(box.classScore.toFixed(2)+' × '+box.objectness.toFixed(2)+' = '+score.toFixed(2),cx,180);
  text((keep?'Keep':'Discard')+' · '+score.toFixed(2)+(keep?' ≥ ':' < ')+example.threshold.toFixed(2),cx,208,{'font-weight':600});
 });
 content.append(svg);
}
