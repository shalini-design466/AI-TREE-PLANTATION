/* AranyaAI — Growth Requirements driven by Selected Commercial Trees. */
(function(){
'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function G(){return window.Grid4x4||null;}
function selected(){const s=$('calcSpecies');return s?Array.from(s.selectedOptions).map(o=>o.value).filter(Boolean):[];}
function catalog(n){return (window.commercialSpecies||[]).find(s=>s.name===n)||null;}
function num(v,d){const n=parseFloat(v);return Number.isFinite(n)?n:d;}
function rangeText(v){return Array.isArray(v)&&v.length===2?v[0]+'–'+v[1]:null;}
function spacingText(k){return k.spacing||'Check species-specific spacing before planting';}
function compute(){
 const names=selected(); if(!names.length)return {error:'Select commercial species above to see their growth requirements.'};
 const rain=num($('rainInput')?.value,1200), temp=num($('tempInput')?.value,27), sun=num($('gpSunlight')?.value,6), mode=$('gpWaterMode')?.value||'Medium';
 const rows=names.map((name,i)=>{const s=catalog(name)||{},k=s.knowledge||window.speciesKnowledge?.[name]||{},mp=s.modelProfile||{};let score=100,notes=[];
  if(Array.isArray(mp.rainfall_mm_range)&&(rain<mp.rainfall_mm_range[0]*.7||rain>mp.rainfall_mm_range[1]*1.3)){score-=10;notes.push('rainfall is outside the catalog range');}
  if(Array.isArray(mp.temperature_c_range)&&(temp<mp.temperature_c_range[0]-5||temp>mp.temperature_c_range[1]+5)){score-=10;notes.push('temperature is outside the catalog range');}
  const lightNeed=/Coconut|Teak|Eucalyptus|Sandalwood|Mahogany|Rosewood|Red Sanders/i.test(name)?6:5;
  if(sun<lightNeed){score-=10;notes.push('needs about '+lightNeed+' hours of sunlight');}
  const water=/Coconut|Arecanut/i.test(name)?'High':/Banana|Papaya|Sugarcane|Mango/i.test(name)?'Medium–High':'Moderate';
  return {name,k,s,score:Math.max(40,score),lightNeed,water,soil:(s.soil||[]).join(', '),ph:rangeText(s.soil_ph_range||mp.pH_range),rain:rangeText(s.rainfall_mm_range||mp.rainfall_mm_range),tempRange:rangeText(s.temperature_c_range||mp.temperature_c_range),spacing:spacingText(k),notes};
 });
 return {rows,rain,temp,sun,mode};
}
function render(r){const out=$('growthPanelOutput');if(!out)return;if(r.error){out.innerHTML=`<div class="lf-empty">${esc(r.error)}</div>`;return;}
 out.innerHTML=`<div class="selected-species-banner"><strong>Growth requirements for your selected commercial trees</strong><span>${r.rows.map(x=>esc(x.name)).join(' • ')}</span></div><div class="gp-species-cards">${r.rows.map((x,i)=>`<article class="gp-species-card"><div class="gp-species-head"><img data-tree-name="${esc(x.name)}" alt="Real photograph of ${esc(x.name)}" loading="lazy"><div><h4>${esc(x.name)}</h4><span class="sp-score sp-good">${x.score}% site-fit</span></div></div><div class="gp-facts"><div><b>🌱 Soil</b><span>${esc(x.soil||'Catalog data unavailable')}</span></div><div><b>🧪 pH</b><span>${esc(x.ph||'See soil test')}</span></div><div><b>💧 Rainfall</b><span>${esc(x.rain||'Catalog range unavailable')}</span></div><div><b>🌡️ Temperature</b><span>${esc(x.tempRange||'Catalog range unavailable')}</span></div><div><b>☀️ Sunlight</b><span>About ${x.lightNeed} h/day or more</span></div><div><b>↔️ Spacing</b><span>${esc(x.spacing)}</span></div><div><b>💦 Water</b><span>${esc(x.water)}; adjust to soil, season and plant age</span></div></div>${x.notes.length?`<p class="gp-warning">⚠️ ${esc(x.notes.join('; '))}</p>`:''}<div class="gp-real-care"><strong>Real care points</strong><ul>${(x.k.irrigation||[]).slice(0,2).map(v=>`<li>💧 ${esc(v)}</li>`).join('')}${(x.k.maintenance||[]).slice(0,2).map(v=>`<li>🌿 ${esc(v)}</li>`).join('')}${(x.k.precautions?[x.k.precautions]:[]).slice(0,1).map(v=>`<li>⚠️ ${esc(v)}</li>`).join('')}</ul></div></article>`).join('')}</div><p class="sp-disclaimer">These are species-specific catalog/knowledge details for the trees you selected. Actual irrigation and spacing depend on variety, soil, age, local climate and farm practice.</p>`;
 if(typeof hydrateSpeciesImages==='function')hydrateSpeciesImages(out);
}
function update(){render(compute());}
function init(){const sun=$('gpSunlight');if(!sun||sun.dataset.wired)return;sun.dataset.wired='1';const label=$('gpSunlightLabel');sun.addEventListener('input',()=>{if(label)label.textContent=sun.value+' h/day';update();});['gpWaterMode','gpWaterOverride','rainInput','tempInput','regionSelect','calcSpecies'].forEach(id=>{const e=$(id);if(e){e.addEventListener('input',update);e.addEventListener('change',update);}});document.addEventListener('grid4:changed',update);update();}
window.GrowthPanel={init,update,compute};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
