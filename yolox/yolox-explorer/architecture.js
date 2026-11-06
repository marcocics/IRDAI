// YOLOX-S model hierarchy and tensor metadata.

const n=(id,title,shape,info,children=null,extra={})=>({id,title,shape,info,children,...extra});
const bn=(id,shape)=>n(id,'Batch normalization',shape,'Per-channel normalization. Training uses batch and spatial statistics; evaluation uses running statistics. Gamma and beta are learned. YOLOX uses ε = 0.001 and momentum = 0.03.');
const silu=(id,shape)=>n(id,'SiLU',shape,'Elementwise activation: f(x) = x / (1 + exp(−x)). Preserves shape; introduces a smooth nonlinearity.');
const conv=(id,cin,cout,size,k=1,s=1)=>{const block=n(id,'Conv → BN → SiLU',`${cout} × ${size} × ${size}`,`${k} × ${k} convolution, stride ${s}, padding ${(k-1)/2}. ${cin} input channels → ${cout} output channels. Bias disabled.`,[
 n(id+'c','Convolution',`${cout} × ${size} × ${size}`,`${cout} learned filters, each ${cin} × ${k} × ${k}; stride ${s}, zero padding ${(k-1)/2}, no bias. Each output filter combines all input channels.`),bn(id+'bn',`${cout} × ${size} × ${size}`),silu(id+'s',`${cout} × ${size} × ${size}`)]);block.convolution={cin,cout,k,s};block.children[0].convolution={cin,cout,k,s};return block;};
function bottleneck(id,c,size,res){return n(id,'Bottleneck',`${c} × ${size} × ${size}`,res?'Computes A + F(A). The residual addition is elementwise, with no extra activation after it.':'Computes F(A). Residual addition is disabled in this block.',res?[
 n(id+'routes','Residual paths',`${c} × ${size} × ${size}`,'Both paths receive the same A. The identity path preserves A.',[{name:'F(A)',nodes:[conv(id+'1',c,c,size),conv(id+'3',c,c,size,3)]},{name:'Identity A',nodes:[n(id+'identity','Identity',`${c} × ${size} × ${size}`,'Passes this bottleneck’s input unchanged to the addition.')]}],{parallel:true}),n(id+'add','Elementwise add',`${c} × ${size} × ${size}`,'A + F(A). Adds matching values; does not concatenate channels.')]:[conv(id+'1',c,c,size),conv(id+'3',c,c,size,3)]);}
function csp(id,c,size,count,res,cin=c){let half=c/2;return n(id,'CSP block',`${c} × ${size} × ${size}`,`Two learned projections receive the entire ${cin}-channel input. Each produces ${half} channels. The deeper path has ${count} independent bottleneck${count>1?'s':''}.`,[
 n(id+'branches','Two branches',`${half} channels each`,'This is not a literal split of input channels. Both projections see the full input.',[{name:'Deeper',nodes:[conv(id+'deep',cin,half,size),...Array.from({length:count},(_,i)=>bottleneck(id+'b'+i,half,size,res))]},{name:'Shorter',nodes:[conv(id+'short',cin,half,size)]}],{parallel:true}),n(id+'cat','Concatenate',`${c} × ${size} × ${size}`,'Append deeper-branch channels, then shorter-branch channels, along the channel dimension. No elementwise addition.'),conv(id+'mix',c,c,size)]);}
const spp=n('spp','Spatial pyramid pooling','512 × 20 × 20','Parallel pooling gathers context at different neighborhood sizes without changing spatial resolution.',[
 conv('reduce',512,256,20),n('pools','Parallel pooling','256 × 20 × 20 per path','All four paths receive the same reduced tensor X. Pooling is parallel, not sequential.',[{name:'Unpooled',nodes:[n('unpooled','Identity X','256 × 20 × 20','Retains the reduced tensor X.')]},...[5,9,13].map(k=>({name:`${k} × ${k}`,nodes:[n('pool'+k,`MaxPool(${k}×${k}, s=1)`, '256 × 20 × 20',`Kernel ${k} × ${k}, stride 1, padding ${(k-1)/2}. No learned weights; no channel mixing. Padding behaves as negative infinity.`,null,{pooling:{k,s:1,padding:(k-1)/2}})]}))],{parallel:true}),n('sppcat','Concatenate','1024 × 20 × 20','Channel order: X, pool5(X), pool9(X), pool13(X). Each contributes 256 channels.'),conv('sppmix',1024,512,20)]);
const focus=n('focus','Focus','32 × 320 × 320','Rearranges spatial values into channels, then applies convolution, BN and SiLU.',[
 n('rearrange','Spatial rearrangement','12 × 320 × 320','Extract four interleaved slices in order: even/even, odd/even, even/odd, odd/odd (row/column, zero-based). Concatenate along channels. All values are preserved; each slice retains BGR channel order.'),conv('focusconv',12,32,320,3,1)]);
const stages=[focus,...[[2,32,64,160,1],[3,64,128,80,3],[4,128,256,40,3],[5,256,512,20,1]].map(([d,cin,c,size,count])=>n('dark'+d,'dark'+d,`${c} × ${size} × ${size}`,`Downsampling followed by ${d===5?'SPP and ':''}a CSP block. ${d>=3?`Output also feeds the neck at stride ${2**d}.`:''}`,[conv('d'+d+'down',cin,c,size,3,2),...(d===5?[spp]:[]),csp('csp'+d,c,size,count,d!==5)],d>=3?{tap:`To neck · stride ${2**d}`} : {}))];
const neckReduction=conv('neckreduce',512,256,20,1,1);
neckReduction.info+=' Receives dark5: 512 × 20 × 20. Learns channel mixing at each position while keeping the 20 × 20 spatial grid. Its output will next be upsampled to 40 × 40 and combined with dark4.';
const neckTopDown=n('necktopdown','Top-down','128 × 80 × 80','Coarse-to-fine fusion: 20 × 20 → 40 × 40 → 80 × 80. The widening shape represents spatial resolution, not channel count.',[
 neckReduction,
 n('neckup40','Upsample ×2','256 × 40 × 40','Nearest-neighbor upsampling. Copies each value into a 2 × 2 area independently per channel. No learned parameters.'),
 n('neckcat40','Concatenate','512 × 40 × 40','Append dark4 after the upsampled features along channels: (256+256) × 40 × 40 → 512 × 40 × 40. No addition or averaging.',null,{concatNames:['Upsampled features','dark4']}),
 csp('cspneck40',256,40,1,false,512),
 conv('neckreduce40',256,128,40),
 n('neckup80','Upsample ×2','128 × 80 × 80','Nearest-neighbor upsampling from 40 × 40 to 80 × 80. Retain the 128 × 40 × 40 input for later bottom-up fusion. No learned parameters.'),
 n('neckcat80','Concatenate','256 × 80 × 80','Append dark3 after the upsampled features along channels: (128+128) × 80 × 80 → 256 × 80 × 80. No addition or averaging.',null,{concatNames:['Upsampled features','dark3']}),
 csp('cspneck80',128,80,1,false,256)
],{taper:'widen'});
const neckBottomUp=n('neckbottomup','Bottom-up','512 × 20 × 20','Fine-to-coarse fusion: learned stride-2 convolutions downsample the 80 × 80 features, then concatenate retained top-down features and process them with CSP blocks. Produces the middle and coarse neck outputs. The 128 × 80 × 80 input also passes through unchanged to the fine-scale detection head.',[
 conv('neckdown40',128,128,40,3,2),
 n('neckbottomcat40','Concatenate','256 × 40 × 40','Downsampled features first, then retained top-down features: (128+128) × 40 × 40 → 256 × 40 × 40.',null,{concatNames:['Downsampled features','Retained top-down features']}),
 csp('cspneckbottom40',256,40,1,false),
 conv('neckdown20',256,256,20,3,2),
 n('neckbottomcat20','Concatenate','512 × 20 × 20','Downsampled features first, then retained top-down features: (256+256) × 20 × 20 → 512 × 20 × 20.',null,{concatNames:['Downsampled features','Retained top-down features']}),
 csp('cspneckbottom20',512,20,1,false)
],{taper:'narrow'});
const neckSteps=[neckTopDown,neckBottomUp];
// Three independent detection scales, shown as inference graphs (COCO: K = 80).
function predictionConv(id,cout,size){return n(id,'Convolution',cout+' × '+size+' × '+size,'128 input channels → '+cout+' output channels. Learned 1 × 1 filters and biases; stride 1, padding 0. No BatchNorm or activation.',null,{convolution:{cin:128,cout,k:1,s:1,bias:true}});}
function headSigmoid(id,channels,size){return n(id,'Sigmoid',channels+' × '+size+' × '+size,'Converts each logit independently to a score in [0,1]. Inference only; training sends logits to BCEWithLogitsLoss. No softmax and no channel mixing.');}
function detectionHead(size,cin,title){const id='head'+size;return n(id,title,'85 × '+size+' × '+size,'Independent scale head. Inference view, with 80 COCO classes: 4 box values + 1 objectness + 80 class scores per location. All hidden features have 128 channels. Separate learned weights from the other scales.',[
 conv(id+'stem',cin,128,size),
 n(id+'branches','Classification and regression','Two independent branches','Both branches receive the entire stem output. They have independent weights.',[
  {name:'',nodes:[n(id+'cls','Classification','80 × '+size+' × '+size,'Two 3 × 3 feature convolutions, followed by a biased 1 × 1 prediction convolution and inference sigmoid. K = 80 classes for this COCO reference.',[conv(id+'cls1',128,128,size,3),conv(id+'cls2',128,128,size,3),predictionConv(id+'clspred',80,size),headSigmoid(id+'clssigmoid',80,size)])]},
  {name:'',nodes:[n(id+'reg','Regression','Box values · objectness','Two shared regression-feature convolutions feed separate box and objectness predictors. Only objectness uses sigmoid.',[
   conv(id+'reg1',128,128,size,3),conv(id+'reg2',128,128,size,3),
   n(id+'predictions','Box and objectness predictions','Two outputs','Both predictors receive the same regression features.',[
    {name:'',nodes:[predictionConv(id+'boxpred',4,size)]},
    {name:'',nodes:[predictionConv(id+'objpred',1,size),headSigmoid(id+'objsigmoid',1,size)]}
   ],{parallel:true})
  ])]}
 ],{parallel:true}),
 n(id+'pack','Assemble predictions','85 × '+size+' × '+size,'Concatenates outputs along channels in order: 4 raw box values, 1 objectness score, then 80 class scores. This is concatenation, not addition. The '+size+' × '+size+' grid has '+(size*size)+' predictions. Flattening and coordinate decoding follow before filtering; raw box values do not use sigmoid.',null,{predictionAssembly:true,concatParts:[{name:'Box values',count:4},{name:'Objectness',count:1},{name:'Class scores',count:80}]})
]);}
const head80=detectionHead(80,128,'Small-scale detection head');
const head40=detectionHead(40,256,'Medium-scale detection head');
const head20=detectionHead(20,512,'Large-scale detection head');
const headScales=[head80,head40,head20].map(head=>({name:'',nodes:[head]}));
const filterSteps=[
 n('confidencefilter','Confidence thresholding','N candidates','For each candidate, choose its highest class score and multiply it by objectness. Keep candidates whose confidence meets the threshold. Reference input: 8400 decoded candidates per image, from 6400 + 1600 + 400 grid positions.',null,{filterHelp:[
 'Each candidate box has an objectness score and a class score—the highest score among its classes.',
 'Confidence score = class score × objectness score',
 'Confidence thresholding discards candidate boxes whose confidence is below the chosen threshold.'
 ],confidenceExample:{threshold:0.50,boxes:[{name:'Box A',classScore:0.80,objectness:0.90},{name:'Box B',classScore:0.95,objectness:0.20}]}}),
 n('nms','Non-maximum suppression','M detections','Select the highest-confidence box, then suppress strongly overlapping lower-confidence boxes. Per-class NMS compares only the same class; class-agnostic NMS compares all classes.',null,{filterHelp:[
 'Several candidates may describe the same object. Within each class, select the highest-confidence remaining box and keep it.',
 'IoU = intersection area / union area. Suppress lower-confidence boxes whose IoU with the selected box exceeds the NMS threshold; repeat for the remaining boxes.',
 'Confidence thresholding removes weak predictions. NMS removes overlapping duplicates. The final count M depends on the image and thresholds.'
 ]})
];
const pipeline=[n('input','Input','3 × 640 × 640','Reference input: B × 3 × 640 × 640. Default preprocessing preserves BGR order, resizes and pads with 114, transposes to CHW and converts to float32 without dividing by 255.'),n('backbone','Backbone','CSPDarknet','Extracts features sequentially. The neck receives dark3, dark4 and dark5 outputs, not just the final tensor.',stages),n('neck','Neck','3 feature scales','Combines features across resolutions. Receives dark3: B × 128 × 80 × 80, dark4: B × 256 × 40 × 40, dark5: B × 512 × 20 × 20. The top-down path reduces and upsamples dark5, fuses with dark4, then reduces and upsamples again to fuse with dark3. The bottom-up path downsamples and fuses retained top-down features. Outputs: 128 × 80 × 80, 256 × 40 × 40 and 512 × 20 × 20.',neckSteps),n('heads','Detection heads','Boxes · objectness · classes','Three independent scale heads. Each scale has its own stem, classification branch, regression branch, and prediction assembly. Inference graph; sigmoid is applied to class and objectness logits. Flattening and box decoding precede filtering.',headScales,{parallel:true}),n('filter','Filter','Thresholding · NMS','Inference postprocessing on decoded predictions: confidence = objectness × highest class score, followed by non-maximum suppression. Per-class and class-agnostic modes are illustrated.',filterSteps),n('output','Output','Final detections','Final bounding boxes with class labels and scores.')];
