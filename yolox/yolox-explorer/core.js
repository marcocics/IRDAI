// Shared diagram state, DOM references, and SVG helpers.

const opened=new Set();let selected=null,scale=1;const index=new Map();function collect(nodes){nodes.forEach(x=>{index.set(x.id,x);if(x.children){if(x.parallel)x.children.forEach(l=>collect(l.nodes));else collect(x.children);}})}collect(pipeline);
const canvas=document.getElementById('canvas'),details=document.createElement('section'),viewport=document.getElementById('viewport');

const svgNS='http://www.w3.org/2000/svg';
function svgElement(tag,attrs){const e=document.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,value);return e;}
