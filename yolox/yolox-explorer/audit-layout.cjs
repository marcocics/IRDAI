const path=require('path');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(require('os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const {chromium}=playwright;
const fs=require('fs');
const output=path.join(__dirname,'../output/layout-audit');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:2000,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+__dirname.replaceAll('\\','/')+'/index.html');
 await page.evaluate(()=>document.fonts.ready);
 const states=await page.evaluate(()=>{
  const result=[{name:'collapsed',ids:[]},{name:'neck overview',ids:['neck']},{name:'top-down',ids:['neck','necktopdown']},{name:'bottom-up',ids:['neck','neckbottomup']},{name:'both paths',ids:['neck','necktopdown','neckbottomup']},{name:'all',ids:[...index.values()].filter(x=>x.children).map(x=>x.id)}];
  function visit(xs,parents=[]){for(const x of xs)if(x.children){result.push({name:x.id,ids:[...parents,x.id]});if(x.parallel)x.children.forEach(l=>visit(l.nodes,[...parents,x.id]));else visit(x.children,[...parents,x.id]);}}
  visit(pipeline);
  const detailedHead=[...index.values()].filter(x=>x.children&&(x.id==='heads'||x.id.startsWith('head80'))).map(x=>x.id);
  for(const neck of [[],['neck'],['neck','necktopdown'],['neck','neckbottomup'],['neck','necktopdown','neckbottomup']])result.push({name:'detailed first head + '+neck.join('+'),ids:[...neck,...detailedHead]});
  const allHeads=[...index.values()].filter(x=>x.children&&(x.id==='heads'||/^head(?:80|40|20)/.test(x.id))).map(x=>x.id);
  for(const neck of [[],['neck'],['neck','necktopdown'],['neck','neckbottomup'],['neck','necktopdown','neckbottomup']])result.push({name:'all detailed heads + '+neck.join('+'),ids:[...neck,...allHeads]});
  for(const head of [[],['heads'],['heads','head80'],allHeads])for(const neck of [[],['neck']])result.push({name:'filter + '+head.join('+')+' + '+neck.join('+'),ids:['filter',...head,...neck]});
  for(let mask=0;mask<8;mask++)result.push({name:'head expansion combination '+mask,ids:['heads',...[80,40,20].filter((_,i)=>mask&(1<<i)).map(size=>'head'+size)]});
  for(const ids of [['backbone','neck'],['backbone','neck','necktopdown'],['backbone','neck','neckbottomup'],['backbone','neck','necktopdown','neckbottomup']])result.push({name:ids.join('+'),ids});
  result.push({name:'full neck',ids:[...index.values()].filter(x=>x.children&&(x.id==='neck'||x.id.startsWith('neck')||x.id.startsWith('cspneck'))).map(x=>x.id)});return result;
 });
 const reports=[];
 for(const state of states){
  const report=await page.evaluate(state=>{
   opened.clear();state.ids.forEach(id=>opened.add(id));scale=state.zoom;panX=0;panY=0;render();updateCamera();
   const origin=canvas.getBoundingClientRect();const rect=e=>{const r=e.getBoundingClientRect();return {l:(r.left-origin.left)/scale,r:(r.right-origin.left)/scale,t:(r.top-origin.top)/scale,b:(r.bottom-origin.top)/scale};};
   const blocks=[...canvas.querySelectorAll('.node>.label')].flatMap(e=>e.parentNode.classList.contains('open')?[...e.querySelectorAll('strong,.action')].map(t=>({id:e.parentNode.dataset.id,r:rect(t)})):[{id:e.parentNode.dataset.id,r:rect(e),taper:e.parentNode.classList.contains('taper-widen')?'widen':e.parentNode.classList.contains('taper-narrow')?'narrow':null}]);
   const labels=[...canvas.querySelectorAll('.connections text')].map(e=>({text:e.textContent,r:rect(e)}));
   const overlap=(a,b,pad=0)=>a.l<b.r-pad&&a.r>b.l+pad&&a.t<b.b-pad&&a.b>b.t+pad;
   const textBlocks=[];for(const l of labels)for(const b of blocks)if(overlap(l.r,b.r,2))textBlocks.push([l.text,b.id]);
   const textText=[];for(let i=0;i<labels.length;i++)for(let j=0;j<i;j++)if(overlap(labels[i].r,labels[j].r,1))textText.push([labels[i].text,labels[j].text]);
   const through=new Set(),onFrames=new Set(),arrowText=new Set(),textFrames=[],throughPaths={};
   const frames=[...canvas.querySelectorAll('.node.open:not(.inline-branches)')].map(e=>({id:e.dataset.id,r:rect(e)}));
   for(const l of labels)for(const f of frames){const a=l.r,b=f.r;if((a.l<b.l&&a.r>b.l||a.l<b.r&&a.r>b.r)&&a.b>b.t&&a.t<b.b||(a.t<b.t&&a.b>b.t||a.t<b.b&&a.b>b.b)&&a.r>b.l&&a.l<b.r)textFrames.push([l.text,f.id]);}
   for(const p of canvas.querySelectorAll('.connections path')){
    const len=p.getTotalLength();for(let d=3;d<len-3;d+=5){const point=p.getPointAtLength(d),next=p.getPointAtLength(Math.min(d+2,len));
     for(const l of labels)if(point.x>l.r.l+1&&point.x<l.r.r-1&&point.y>l.r.t+1&&point.y<l.r.b-1)arrowText.add(l.text);
     for(const b of blocks)if(point.x>b.r.l+3&&point.x<b.r.r-3&&point.y>b.r.t+3&&point.y<b.r.b-3&&(!b.taper||(()=>{const u=(point.x-b.r.l)/(b.r.r-b.r.l),v=(point.y-b.r.t)/(b.r.b-b.r.t),margin=b.taper==='widen'?.25*(1-u):.25*u;return v>margin+.025&&v<1-margin-.025;})())){through.add(b.id);throughPaths[b.id]=p.getAttribute('d');}
     for(const f of frames)if(Math.abs(next.y-point.y)<.1&&point.x>f.r.l+5&&point.x<f.r.r-5&&(Math.abs(point.y-f.r.t)<4||Math.abs(point.y-f.r.b)<4))onFrames.add(f.id);
    }
   }
   return {name:state.name,textBlocks,textText,through:[...through],throughPaths,arrowText:[...arrowText],textFrames,onFrames:[...onFrames]};
  },{...state,zoom:Number(process.env.AUDIT_ZOOM||1)});
  if(report.arrowText.length||report.textFrames.length||report.textBlocks.length||report.textText.length||report.through.length||report.onFrames.length)reports.push(report);
 }
 fs.writeFileSync(path.join(output,'layout-audit.json'),JSON.stringify({states:states.length,errors,reports},null,2));console.log(JSON.stringify({states:states.length,errors,issues:reports.map(r=>({name:r.name,arrowText:r.arrowText,textFrames:r.textFrames,textBlocks:r.textBlocks,textText:r.textText,through:r.through,throughPaths:r.throughPaths,onFrames:r.onFrames}))}));
 if(process.argv.includes('--screenshot')){await page.evaluate(()=>{opened.clear();['neck','necktopdown','neckbottomup'].forEach(id=>opened.add(id));render();fitCurrentDiagram();});await page.screenshot({path:path.join(output,'layout-review.png')});await page.evaluate(()=>{const node=canvas.querySelector('[data-id="neckbottomup"]');const r=node.getBoundingClientRect(),c=canvas.getBoundingClientRect(),l=(r.left-c.left)/scale,t=(r.top-c.top)/scale;scale=.65;panX=80-l*scale;panY=220-t*scale;updateCamera();});await page.screenshot({path:path.join(output,'layout-detail.png')});}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
