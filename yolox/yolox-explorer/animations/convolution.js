// Popup rendering and animation.

function buildConvAnimation({cin,cout,k,s,bias=false}){
 cancelAnimationFrame(convAnimationFrame);
 const svg=document.getElementById('conv-animation');svg.replaceChildren();
 const padding=(k-1)/2,size=4,extent=size+2*padding,out=Math.floor((size+2*padding-k)/s)+1,cell=28,left=235,top=65,right=540,outTop=90;
 document.getElementById('conv-popup-title').textContent=cout+'×Conv('+k+'×'+k+', s='+s+')';
 document.getElementById('conv-caption').textContent='Kernel '+k+' × '+k+' · stride '+s+' · zero padding '+padding;
 document.getElementById('conv-channel-explanation').textContent='Each of the '+cout+' filters is '+cin+' × '+k+' × '+k+'. At each position, it computes a weighted sum over the '+k+' × '+k+' window across all '+cin+' input channels, producing one output value.'+(bias?' A learned bias is then added. This illustration shows the weighted-sum contribution before bias.':'');
 function text(value,x,y,attrs={}){const e=svgElement('text',{x,y,'text-anchor':'middle',...attrs});e.textContent=value;svg.append(e);return e;}
 text('Kernel weights',85,40);text('Input + padding',left+extent*cell/2,40);text('Output',right+out*cell/2,65);
 const weights=k===1?[[2]]:[[1,0,-1],[2,0,-2],[1,0,-1]];
 const kernelLeft=85-k*cell/2,kernelTop=95;
 for(let r=0;r<k;r++)for(let c=0;c<k;c++){svg.append(svgElement('rect',{x:kernelLeft+c*cell,y:kernelTop+r*cell,width:cell,height:cell,class:'pixel output-written'}));text(weights[r][c],kernelLeft+(c+.5)*cell,kernelTop+(r+.5)*cell+4);}
 const valueAt=(r,c)=>r<0||c<0||r>=size||c>=size?0:r*size+c+1;
 for(let r=0;r<extent;r++)for(let c=0;c<extent;c++){const isPad=r<padding||c<padding||r>=size+padding||c>=size+padding;svg.append(svgElement('rect',{x:left+c*cell,y:top+r*cell,width:cell,height:cell,class:isPad?'padding-pixel':'pixel'}));text(valueAt(r-padding,c-padding),left+(c+.5)*cell,top+(r+.5)*cell+4);}
 const results=[];
 for(let r=0;r<out;r++)for(let c=0;c<out;c++){const rect=svgElement('rect',{x:right+c*cell,y:outTop+r*cell,width:cell,height:cell,class:'pixel'});svg.append(rect);const label=text('',right+(c+.5)*cell,outTop+(r+.5)*cell+4);let sum=0;for(let kr=0;kr<k;kr++)for(let kc=0;kc<k;kc++)sum+=valueAt(r*s+kr-padding,c*s+kc-padding)*weights[kr][kc];results.push({rect,label,sum,r,c});}
 const kernel=svgElement('rect',{width:k*cell,height:k*cell,class:'kernel-window'});svg.append(kernel);
 const connector=svgElement('path',{fill:'none',stroke:'var(--accent)','stroke-width':1.5});svg.append(connector);
 const calculation=text('',345,282);
 const started=performance.now();let previous=-1;
 function frame(now){const elapsed=(Math.max(0,now-started)/1000)%(results.length*.65+1.8);const current=Math.min(results.length-1,Math.floor(elapsed/.65));if(current!==previous){previous=current;results.forEach((result,i)=>{result.label.textContent=i<=current?result.sum:'';result.rect.setAttribute('class','pixel'+(i<=current?' output-written':'')+(i===current?' active-result':''));});const result=results[current],x=left+result.c*s*cell,y=top+result.r*s*cell;kernel.setAttribute('x',x);kernel.setAttribute('y',y);connector.setAttribute('d','M '+(x+k*cell)+' '+(y+k*cell/2)+' L '+(right+result.c*cell)+' '+(outTop+(result.r+.5)*cell));calculation.textContent='Weighted sum = '+result.sum;}
 convAnimationFrame=requestAnimationFrame(frame);}
 frame(started);
}
