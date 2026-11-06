// Popup rendering and animation.

let bnStep=0;
function showBNStep(){
 const numerator='<mrow><mi>x</mi><mo>−</mo><mi>μ</mi></mrow>',variance='<msup><mi>σ</mi><mn>2</mn></msup>';
 const fraction=epsilon=>'<mfrac>'+numerator+'<msqrt><mrow>'+variance+(epsilon?'<mo>+</mo><mi>ε</mi>':'')+'</mrow></msqrt></mfrac>';
 const stages=[
  {formula:fraction(false),text:'Subtract the channel mean, then divide by its standard deviation. For nonzero variance, this gives zero mean and unit variance.'},
  {formula:fraction(true),text:'Add ε inside the square root to avoid division by zero and improve numerical stability when the variance is very small.'},
  {formula:'<mi>γ</mi><mo>·</mo>'+fraction(true)+'<mo>+</mo><mi>β</mi>',text:'Restricting every channel to zero mean and unit variance can be suboptimal. Learned γ and β let each channel choose a useful scale and offset.'},
  {formula:'<msub><mi>μ</mi><mtext>run</mtext></msub><mo>←</mo><mn>0.97</mn><msub><mi>μ</mi><mtext>run</mtext></msub><mo>+</mo><mn>0.03</mn><msub><mi>μ</mi><mtext>batch</mtext></msub>',text:'During training, μ and σ² come from the current batch and spatial positions, separately for each channel. Running mean and variance are updated using moving averages. Inference uses these stored running statistics. They are not learned by gradient descent.'}
 ];
 const step=stages[bnStep];
 bnPopup.classList.toggle('bn-comparison',bnStep===3);
 if(bnStep===3){
  const stat=(symbol,suffix)=>'<msub><mi>'+symbol+'</mi><mtext>'+suffix+'</mtext></msub>';
  const varianceFor=suffix=>'<msubsup><mi>σ</mi><mtext>'+suffix+'</mtext><mn>2</mn></msubsup>';
  const math=body=>'<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow>'+body+'</mrow></math>';
  const normalization=suffix=>math('<mi>y</mi><mo>=</mo><mi>γ</mi><mo>·</mo><mfrac><mrow><mi>x</mi><mo>−</mo>'+stat('μ',suffix)+'</mrow><msqrt><mrow>'+varianceFor(suffix)+'<mo>+</mo><mi>ε</mi></mrow></msqrt></mfrac><mo>+</mo><mi>β</mi>');
  const meanUpdate=math(stat('μ','run')+'<mo>←</mo><mn>0.97</mn>'+stat('μ','run')+'<mo>+</mo><mn>0.03</mn>'+stat('μ','batch'));
  const varianceUpdate=math(varianceFor('run')+'<mo>←</mo><mn>0.97</mn>'+varianceFor('run')+'<mo>+</mo><mn>0.03</mn>'+varianceFor('batch'));
  document.getElementById('bn-formula').innerHTML='<div class="bn-columns"><section class="bn-column"><h3>Training</h3>'+normalization('batch')+'<p>Update the stored running statistics:</p><div class="bn-updates">'+meanUpdate+varianceUpdate+'</div></section><section class="bn-column"><h3>Inference</h3>'+normalization('run')+'<p>Use the stored running statistics from training.</p><p><strong>Running mean and variance are NOT updated during inference.</strong></p></section></div>';
  document.getElementById('bn-description').textContent='';
 }else{
  document.getElementById('bn-formula').innerHTML='<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow><mi>y</mi><mo>=</mo>'+step.formula+'</mrow></math>';
  document.getElementById('bn-description').textContent=step.text;
 }
 document.getElementById('bn-stage').textContent=(bnStep+1)+' / 4';if(!bnPopup.hidden){const r=bnPopup.getBoundingClientRect();bnPopup.style.left=Math.max(12,Math.min(r.left,window.innerWidth-bnPopup.offsetWidth-12))+'px';bnPopup.style.top=Math.max(12,Math.min(r.top,window.innerHeight-bnPopup.offsetHeight-12))+'px';}
}

function buildBNAnimation(){cancelAnimationFrame(bnAnimationFrame);bnStep=0;showBNStep();}
document.getElementById('bn-previous').onclick=()=>{bnStep=(bnStep+3)%4;showBNStep();};
document.getElementById('bn-next').onclick=()=>{bnStep=(bnStep+1)%4;showBNStep();};
