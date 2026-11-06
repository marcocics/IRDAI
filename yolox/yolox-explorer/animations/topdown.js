// Neck overviews share drawing; shapes omit the batch dimension.
const neckSlides={
 "topdown": [
  {
   "title": "Carry context toward finer grids",
   "text": "Dark5 captures broad context; dark4 and dark3 preserve progressively finer detail. The top-down path combines them, bringing context into higher-resolution grids.",
   "overview": [
    [
     "dark5",
     "512 × 20 × 20"
    ],
    [
     "Fuse dark4",
     "256 × 40 × 40"
    ],
    [
     "Fuse dark3",
     "128 × 80 × 80"
    ]
   ]
  }
 ],
 "bottomup": [
  {
   "title": "Carry fine features toward coarser grids",
   "text": "The bottom-up path carries fine detail back toward coarser grids, enriching the features used for detection at each scale.",
   "overview": [
    [
     "Fine output",
     "128 × 80 × 80"
    ],
    [
     "Middle output",
     "256 × 40 × 40"
    ],
    [
     "Coarse output",
     "512 × 20 × 20"
    ]
   ]
  }
 ]
};
neckSlides.topdown.push({title:'Keep features for the bottom-up path',text:'The top-down path keeps the reduced features before each upsampling step: 256 × 20 × 20 and 128 × 40 × 40.',retention:true});
neckSlides.bottomup.push({title:'Combine detail with retained context',text:'At each coarser grid, the incoming features are combined with features retained during top-down. This brings fine detail together with the context already gathered at that scale.',fusion:true});
const neckSlideIndex={topdown:0,bottomup:0};
function buildTopDownAnimation(){neckSlideIndex.topdown=0;showNeckSlide('topdown');}
function showNeckSlide(kind){
 if(kind==='topdown')cancelAnimationFrame(topdownAnimationFrame);else cancelAnimationFrame(bottomupAnimationFrame);
 const step=neckSlideIndex[kind],slide=neckSlides[kind][step];
 document.getElementById(kind+'-stage').textContent=(step+1)+' / '+neckSlides[kind].length;
 document.getElementById(kind+'-title').textContent=slide.title;
 document.getElementById(kind+'-explanation').textContent=slide.text;
 const path=document.getElementById(kind+'-path');path.replaceChildren();
 const sizes=kind==='topdown'?['20 × 20','40 × 40','80 × 80']:['80 × 80','40 × 40','20 × 20'];
 sizes.forEach((size,i)=>{const item=document.createElement('span');item.textContent=size;item.className=(slide.fusion?i>0:!slide.retention||i<2)?'current':'';if(slide.fusion?i>0:!slide.retention||i<2)item.setAttribute('aria-current','step');path.append(item);if(i<2){const arrow=svgElement('svg',{viewBox:'0 0 40 12','aria-hidden':'true'});arrow.append(svgElement('path',{d:'M 1 6 H 38 M 33 1 L 38 6 L 33 11',fill:'none',stroke:'currentColor'}));path.append(arrow);}});
 const svg=document.getElementById(kind+'-animation');svg.setAttribute('viewBox',slide.fusion?'0 0 660 340':slide.retention?'0 0 660 330':'0 0 660 165');svg.replaceChildren();svg.setAttribute('aria-label',slide.title+'. '+slide.text);
 const add=(tag,attrs,parent=svg)=>{const e=svgElement(tag,attrs);parent.append(e);return e;};
 const label=(value,x,y,parent=svg)=>{const e=add('text',{x,y,'text-anchor':'middle'},parent);e.textContent=value;};
 const groups=[];
 const box=(x,y,w,title,shape)=>{const g=add('g',{});groups.push(g);add('rect',{x,y,width:w,height:62,rx:6,fill:'var(--soft)',stroke:'var(--line)'},g);label(title,x+w/2,y+25,g);label(shape,x+w/2,y+46,g);return g;};
 if(slide.fusion){
  for(const [i,channels,size] of [[0,128,40],[1,256,20]]){
   const y=70+i*170;
   label('Retained during top-down',330,y-47);
   label(channels+' × '+size+' × '+size,330,y-27);
   box(10,y,190,'Downsampled features',channels+' × '+size+' × '+size);
   box(265,y,130,'Concatenate',(channels*2)+' × '+size+' × '+size);
   box(460,y,190,'CSP · '+(i===0?'middle':'coarse')+' output',(channels*2)+' × '+size+' × '+size);
   add('path',{d:`M 200 ${y+31} H 265 m -6 -4 l 6 4 -6 4 M 330 ${y-20} V ${y} m -4 -6 l 4 6 4 -6 M 395 ${y+31} H 460 m -6 -4 l 6 4 -6 4`,fill:'none',stroke:'var(--muted)','stroke-width':1.5});
  }
 }else if(slide.retention){
  for(const [i,channels,size] of [[0,256,20],[1,128,40]]){
   const y=20+i*155,shape=channels+' × '+size+' × '+size;
   box(15,y,190,'1 × 1 conv, s=1',shape);
   box(255,y,175,'Upsample ×2',channels+' × '+(size*2)+' × '+(size*2));
   box(465,y+65,190,'To bottom-up '+size+' × '+size,shape);
   add('path',{d:`M 205 ${y+31} H 255 m -6 -4 l 6 4 -6 4 M 230 ${y+31} V ${y+96} H 465 m -6 -4 l 6 4 -6 4`,fill:'none',stroke:'var(--muted)','stroke-width':1.5});
   add('circle',{cx:230,cy:y+31,r:3,fill:'var(--muted)'});
   label('Retain',345,y+85);
  }
 }else if(slide.overview){
  slide.overview.forEach(([title,shape],i)=>{const x=15+i*225;box(x,78,180,title,shape);if(i<2)add('path',{d:`M ${x+180} 109 h 43 m -6 -4 l 6 4 -6 4`,fill:'none',stroke:'var(--muted)'},svg);});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,started=performance.now();
 function frame(now){const elapsed=Math.max(0,now-started);groups.forEach((g,i)=>g.setAttribute('opacity',reduced?1:Math.max(.18,Math.min(1,(elapsed-i*650)/450))));if(!reduced&&elapsed<groups.length*650+450){const id=requestAnimationFrame(frame);if(kind==='topdown')topdownAnimationFrame=id;else bottomupAnimationFrame=id;}}
 frame(started);
 const popup=document.getElementById(kind+'-popup');
 if(!popup.hidden){const top=popup.getBoundingClientRect().top;popup.style.top=Math.max(12,Math.min(top,innerHeight-popup.offsetHeight-12))+'px';}
}

for(const kind of ['topdown','bottomup'])for(const [name,delta] of [['previous',-1],['next',1]])document.getElementById(kind+'-'+name).addEventListener('click',()=>{const count=neckSlides[kind].length;neckSlideIndex[kind]=(neckSlideIndex[kind]+delta+count)%count;showNeckSlide(kind);});
