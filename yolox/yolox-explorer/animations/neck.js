// General neck explanation, independent of the detailed path popups.
function showNeckExample(){
 const content=document.getElementById('neck-content');content.replaceChildren();
 const intro=document.createElement('p');intro.textContent='The neck combines the backbone’s three feature grids, so detection at each scale can use both spatial detail and broader context.';content.append(intro);
 for(const [title,text] of [
  ['Three complementary views','The 80 × 80 grid preserves finer spatial detail, the 20 × 20 grid captures broader context, and the 40 × 40 grid provides an intermediate view. These grids contain learned features, not miniature pictures.'],
  ['Top-down · context helps interpret detail','The top-down path brings broader context into the finer grids. For example, local features might capture a small silhouette; broader information can help interpret those patterns as part of a person.'],
  ['Bottom-up · fine detail enriches coarser features','The bottom-up path then combines these enriched fine features with coarser features. This lets detection at coarser scales also benefit from fine spatial detail.']
 ]){
  const heading=document.createElement('h3');heading.textContent=title;const p=document.createElement('p');p.textContent=text;content.append(heading,p);
 }
}
