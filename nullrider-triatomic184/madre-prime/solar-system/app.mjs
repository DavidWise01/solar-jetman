import {createSolarMadre184} from './bridge.mjs';
const model=createSolarMadre184(), el=id=>document.getElementById(id);
const read=(id)=>+el(id).value;
let phase=0,group='ALL';
const phases=el('phases');for(let i=0;i<8;i++){const b=document.createElement('button');b.textContent=String(i+1);b.setAttribute('aria-label',`Solar phase bin ${i+1}`);b.addEventListener('click',()=>{phase=i;draw()});phases.append(b)}
const catalogResult=model.through184({via:184,op:'SOLAR_CATALOG'});
const check=model.through184({via:184,op:'AUDIT'});
el('gateway').textContent=catalogResult.accepted&&check.accepted&&check.bridge.base===366?'NODE 184 · READ-ONLY PASS':'NODE 184 · VERIFY FAILED';
const inventory=catalogResult.catalog;el('catalogCount').textContent=String(inventory.length);
el('summary').textContent=`${catalogResult.summary.major} major and ${catalogResult.summary.minor} minor entries across ${catalogResult.summary.groups.length} evidence categories. A label is a catalog tier—not a measured weight or effect size.`;
const tabs=['ALL',...catalogResult.summary.groups.map(x=>x.group)];const filterArea=el('filters');
for(const name of tabs){const b=document.createElement('button');b.textContent=name;b.addEventListener('click',()=>{group=name;drawCatalog()});filterArea.append(b)}
function drawCatalog(){filterArea.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.textContent===group));const container=el('catalog');container.replaceChildren();for(const row of inventory.filter(x=>group==='ALL'||x.group===group)){const item=document.createElement('div');item.className='item';const strong=document.createElement('strong');strong.textContent=row.name;const small=document.createElement('small');small.textContent=row.tier+' / '+row.scope;const p=document.createElement('p');p.textContent=row.notes;item.append(strong,small,p);container.append(item)}}
const ids=['phaseDistance','surface','depth','turbidity','uvTransmission','mature','material','nutrient'];ids.forEach(id=>el(id).addEventListener('input',draw));
const fmt=(v,n=1)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:n});
function draw(){phases.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===phase));
 const dist=read('phaseDistance'),surface=read('surface')/100,depth=read('depth'),atten=read('turbidity'),uv=read('uvTransmission')/100,mature=read('mature'),material=read('material'),nutrient=read('nutrient')/100;
 el('distanceV').textContent=fmt(dist,2)+' AU';el('surfaceV').textContent=fmt(surface*100,0)+'%';el('depthV').textContent=fmt(depth,0)+' m';el('turbidityV').textContent=fmt(atten,2)+' m⁻¹';el('uvTransmissionV').textContent=fmt(uv*100,0)+'%';el('matureV').textContent=fmt(mature,0);el('materialV').textContent=fmt(material,0);el('nutrientV').textContent=fmt(nutrient*100,0)+'%';
 const r=model.through184({via:184,op:'SOLAR_VIEW',phase,distanceAu:dist,depthMeters:depth,waterAttenuation:atten,lightTransmission:surface,uvbTransmission:uv,material,mature,nitrogen:nutrient,phosphorus:nutrient,silica:nutrient,iron:nutrient,carbon:nutrient});
 if(!r.accepted){el('gateway').textContent='NODE 184 · INVALID';return}
 el('flux').textContent=fmt(r.solar.topOfAtmosphereWm2,1);el('par').textContent=fmt(r.solar.illustrativeUnderwaterPARWm2,1);el('uv').textContent=fmt(r.solar.relativeUVBExposureProxy,3);
 el('fluxRatio').textContent=fmt(100*r.solar.topOfAtmosphereWm2/1361,1)+'%';el('fluxBar').style.width=Math.min(100,100*r.solar.topOfAtmosphereWm2/1600)+'%';el('parBar').style.width=Math.min(100,100*r.solar.illustrativeUnderwaterPARWm2/600)+'%';el('parStatus').textContent=r.solar.illustrativeUnderwaterPARWm2>=25?'Threshold met':'Below illustrative threshold';
 el('births').textContent=fmt(r.diatom.illustrativeDaughters,0);el('events').textContent=fmt(r.diatom.reproductionEvents,0);el('balance').textContent=fmt(r.diatom.remainingSymbolicMaterial,0);
 window.__SOLAR184__={phase,solar:r.solar,diatom:r.diatom,readOnly:r.readonly}; // inspectable only; no mutation permission
}
drawCatalog();draw();
