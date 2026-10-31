/* AranyaAI — Smart Plantation Layout driven ONLY by Selected Commercial Trees. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SQFT_ACRE = 43560;
  function cellFt(){ // one grid cell = one planting position, sized from the tree / row spacing (feet)
    const ts=parseFloat(($('treeSpacing')||{}).value), rs=parseFloat(($('rowSpacing')||{}).value);
    return {w:isFinite(ts)&&ts>0?ts:10, h:isFinite(rs)&&rs>0?rs:10};
  }
  const palette = ['#1f7a4d','#f08a24','#2f6fdc','#9b59b6','#00897b','#c0392b','#6c5ce7','#16a085'];

  function selected() {
    const sel = $('calcSpecies');
    return sel ? Array.from(sel.selectedOptions).map(o => o.value).filter(Boolean) : [];
  }
  function catalog(name) {
    return (window.commercialSpecies || []).find(s => s.name === name) || null;
  }
  function shared() {
    const L = parseFloat(($('landLength')||{}).value) || 0;
    const W = parseFloat(($('landWidth')||{}).value) || 0;
    const gap = parseFloat(($('boundaryGap')||{}).value);
    return {length:L,width:W,gap:isFinite(gap)?gap:0,soil:($('soilSelect')||{}).value||''};
  }
  function geometry() {
    const species = selected(), s = shared();
    if (!species.length) return {error:'Select at least one commercial species above, then click Calculate Plantation.'};
    if (!(s.length>0 && s.width>0)) return {error:'Enter your land length and width (in feet) first.'};
    const CELL=cellFt(), usableL=s.length-2*s.gap, usableW=s.width-2*s.gap;
    if (usableL < CELL.w || usableW < CELL.h) return {error:'This plot is too small for even one planting cell ('+CELL.w+' × '+CELL.h+' ft) after the boundary gap. Reduce the gap or the spacing.'};
    const cols=Math.max(1,Math.floor(usableL/CELL.w)), rows=Math.max(1,Math.floor(usableW/CELL.h));
    const counts=Object.fromEntries(species.map(n=>[n,0]));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) counts[species[(r*cols+c)%species.length]]++;
    return {species,s,cols,rows,counts,usableL,usableW,CELL,areaAcres:s.length*s.width/SQFT_ACRE};
  }
  function avg(range){ return Array.isArray(range)&&range.length===2 ? (range[0]+range[1])/2 : null; }
  function compute(){
    const g=geometry(); if(g.error)return g;
    const tiers=g.species.map((name,i)=>{
      const cat=catalog(name)||{}, cp=cat.commercialProfile||{}, cells=g.counts[name];
      const pr=avg(cp.profit_per_acre_inr_range), ir=avg(cp.investment_per_acre_inr_range), acres=cells*g.CELL.w*g.CELL.h/SQFT_ACRE;
      const knowledge=cat.knowledge||window.speciesKnowledge?.[name]||{};
      const spacing=knowledge.spacing||'Use species-specific spacing';
      const plants=cells;
      const waterBase=/Coconut|Arecanut/i.test(name)?35:/Banana|Papaya|Sugarcane/i.test(name)?18:12;
      return {name,cells,plants,spacing,water:waterBase*plants,revenue:pr==null?null:pr*acres,investment:ir==null?null:ir*acres,index:i};
    });
    const totalWater=tiers.reduce((a,x)=>a+x.water,0), revenue=tiers.reduce((a,x)=>a+(x.revenue||0),0), investment=tiers.reduce((a,x)=>a+(x.investment||0),0);
    return {...g,tiers,totalWater:Math.round(totalWater),totalRevenue:revenue,profit:revenue-investment};
  }
  function photoGrid(r){
    const maxC=12,maxR=10, cols=Math.min(r.cols,maxC), rows=Math.min(r.rows,maxR);
    let h=`<div class="g4-photo-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">`;
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
      const name=r.species[(row*r.cols+col)%r.species.length], i=r.species.indexOf(name), color=palette[i%palette.length];
      h+=`<div class="g4-tile" style="border-color:${color}" title="${esc(name)}"><img data-tree-name="${esc(name)}" alt="Real photograph of ${esc(name)}" loading="lazy"><span class="g4-badge" style="background:${color}">${i+1}</span><small class="g4-tile-name">${esc(name)}</small></div>`;
    }
    h+='</div>';
    if(cols<r.cols||rows<r.rows) h+=`<p class="g4-preview-note">Preview shows ${cols}×${rows} cells; counts use the full ${r.cols}×${r.rows} grid.</p>`;
    return h;
  }
  function render(container,r){
    if(!container)return;
    if(r.error){container.innerHTML=`<div class="lf-empty">${esc(r.error)}</div>`;return;}
    const legend=r.tiers.map((x,i)=>`<div class="g4-legend-item"><span class="g4-num" style="background:${palette[i%palette.length]}">${i+1}</span><div><strong>${esc(x.name)}</strong><br><span>${x.cells} cells · ${x.plants.toLocaleString('en-IN')} planting positions · ~${Math.round(x.water).toLocaleString('en-IN')} L/day</span><br><span>${esc(x.spacing)}</span></div></div>`).join('');
    const money=n=>Number.isFinite(n)?'₹ '+Math.round(n).toLocaleString('en-IN'):'—';
    container.innerHTML=`<div class="g4-stats"><div class="g4-stat"><span>${r.cols} × ${r.rows}</span><small>${r.CELL.w}×${r.CELL.h} ft cells</small></div><div class="g4-stat"><span>${r.totalWater.toLocaleString('en-IN')} L/day</span><small>Indicative water need</small></div><div class="g4-stat"><span>${money(r.totalRevenue)}</span><small>Estimated revenue/yr</small></div><div class="g4-stat"><span>${money(r.profit)}</span><small>Estimated profit/yr*</small></div></div><div class="g4-body"><div class="g4-grid-wrap">${photoGrid(r)}</div><div class="g4-legend">${legend}</div></div><p class="g4-note"><strong>AI-recommended + your selected species:</strong> every cell cycles through the AI-recommended trees (★ AI) and the commercial trees you selected above. Cell size follows your tree and row spacing in feet.</p><p class="sp-disclaimer">*Financial values are indicative estimates from this project's catalog data, not guaranteed returns. Confirm species-specific spacing and field suitability locally.</p>`;
    if(typeof hydrateSpeciesImages==='function')hydrateSpeciesImages(container);
  }
  function buildSteps(){
    const box=$('grid4Steps'); if(!box)return;
    const names=selected();
    box.innerHTML=names.length?`<div class="g4-selected-summary"><strong>Selected Commercial Trees</strong><div class="g4-selected-chips">${names.map((n,i)=>`<span><b style="background:${palette[i%palette.length]}">${i+1}</b>${esc(n)}</span>`).join('')}</div><p>These AI-recommended (★ AI) and selected species are used in the grid.</p></div>`:'<div class="lf-empty">Select commercial trees in the Location & Soil Analysis section first.</div>';
  }
  function changed(){buildSteps();render($('grid4Output'),compute());document.dispatchEvent(new CustomEvent('grid4:changed'));}
  function init(){
    const btn=$('grid4GenerateBtn'); if(!btn||btn.dataset.wired)return; btn.dataset.wired='1';
    btn.addEventListener('click',changed);
    const sel=$('calcSpecies'); if(sel)sel.addEventListener('change',changed);
    ['landLength','landWidth','boundaryGap','soilSelect','treeSpacing','rowSpacing'].forEach(id=>{const e=$(id);if(e){e.addEventListener('input',changed);e.addEventListener('change',changed);}});
    changed();
  }
  window.Grid4x4={init,refresh:changed,compute,geometry,CELL:cellFt,palette};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
