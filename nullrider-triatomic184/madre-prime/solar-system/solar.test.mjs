import test from 'node:test';import assert from 'node:assert/strict';
import {CATALOG,GROUPS,MATTER_COST,PER_BRANCH,readSolar184,catalogSummary} from './solar.mjs';
import {createSolarMadre184} from './bridge.mjs';
const request=(changes={})=>({via:184,op:'SOLAR_VIEW',...changes});
test('one Sun, eight planets and five named dwarfs represented',()=>{
 assert.deepEqual(CATALOG.filter(x=>x.group==='PLANETS').map(x=>x.name),['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']);
 assert.deepEqual(CATALOG.filter(x=>x.group==='DWARF PLANETS').map(x=>x.name),['Ceres','Pluto','Haumea','Makemake','Eris']);
 assert.ok(GROUPS.includes('DIATOM'));assert.equal(catalogSummary().major+catalogSummary().minor,CATALOG.length);
});
test('physical fusion and negligible fission explicitly separated',()=>{
 assert.equal(CATALOG.find(x=>x.name==='Core proton–proton fusion').tier,'major');
 assert.equal(CATALOG.find(x=>x.name==='Sustained nuclear fission').scope,'negligible');
});
test('366/3=122, 365 operational plus zero, and 729 symbolic',()=>{
 assert.equal(PER_BRANCH,122);assert.equal(MATTER_COST,729);
 const r=readSolar184(request());assert.equal(r.torre.base,366);assert.equal(r.torre.coreCells+r.torre.structuralAnchor,366);
});
test('wrong gate and unexpected operations rejected',()=>{
 assert.equal(readSolar184({...request(),via:183}).accepted,false);
 assert.equal(readSolar184({...request(),op:'RENEW'}).accepted,false);
});
test('inverse-square solar irradiance',()=>{
 const earth=readSolar184(request({phase:2,distanceAu:1}));const far=readSolar184(request({phase:2,distanceAu:2}));
 assert.ok(Math.abs(earth.solar.topOfAtmosphereWm2/4-far.solar.topOfAtmosphereWm2)<1e-8);
});
test('eight phase bins span 0.1% modeled irradiance range',()=>{
 const a=readSolar184(request({phase:0})).solar.cycleTotalMultiplier;
 const b=readSolar184(request({phase:4})).solar.cycleTotalMultiplier;
 assert.ok(Math.abs((a-b)-.001)<1e-12);
});
test('underwater light decreases with depth and turbidity',()=>{
 const top=readSolar184(request({depthMeters:0})).solar.illustrativeUnderwaterPARWm2;
 const deep=readSolar184(request({depthMeters:20})).solar.illustrativeUnderwaterPARWm2;
 assert.ok(top>deep);
});
test('UVB shielding affects only UVB proxy, not DNA mutations',()=>{
 const exposed=readSolar184(request({uvbTransmission:1}));const shielded=readSolar184(request({uvbTransmission:0.01}));
 assert.ok(exposed.solar.relativeUVBExposureProxy>shielded.solar.relativeUVBExposureProxy);
 assert.equal(exposed.diatom.biologicalPrediction,false);
 assert.equal(exposed.diatom.reproductionEvents,shielded.diatom.reproductionEvents);
});
test('resource quota caps division and two daughters per event',()=>{
 const r=readSolar184(request({material:5832,mature:11,depthMeters:0,lightTransmission:1}));
 assert.equal(r.diatom.reproductionEvents,8);assert.equal(r.diatom.illustrativeDaughters,16);assert.equal(r.diatom.remainingSymbolicMaterial,0);
});
test('limited nutrients and darkness prevent hypothetical divisions',()=>{
 assert.equal(readSolar184(request({nitrogen:0})).diatom.reproductionEvents,0);
 assert.equal(readSolar184(request({depthMeters:200,waterAttenuation:1})).diatom.reproductionEvents,0);
});
test('bad parameters refused, no NaN or destructive calls',()=>{
 for(const arg of [{distanceAu:0},{phase:8},{material:-1},{uvbTransmission:1.1},{nitrogen:NaN}])assert.equal(readSolar184(request(arg)).accepted,false);
});
test('Node184 wrapper bridges actual Madre 366 map',()=>{
 const engine=createSolarMadre184();const audit=engine.through184({via:184,op:'AUDIT'});
 assert.equal(audit.accepted,true);assert.equal(audit.bridge.base,366);assert.equal(audit.mapping.length,366);
 const initial=audit.stats.fingerprint;
 const v=engine.through184(request({phase:7}));assert.equal(v.accepted,true);assert.equal(v.readonly,true);
 const after=engine.through184({via:184,op:'VIEW'});assert.equal(after.stats.fingerprint,initial);
 assert.equal(engine.through184({via:184,op:'SOLAR_CATALOG'}).catalog.length,CATALOG.length);
 assert.equal(engine.through184({via:183,op:'SOLAR_VIEW'}).accepted,false);
});
test('other original gateway operations remain available unchanged',()=>{
 const e=createSolarMadre184(),a=e.through184({via:184,op:'LOCATE',address:366});
 assert.equal(a.kind,'SCALAR_ZERO');assert.equal(a.cellId,null);
 const x=e.through184({via:184,op:'SWAP',tx:'solar-integration-one',cargo:'☀ HONEY 366/3',turns:2});
 assert.equal(x.accepted,true);assert.equal(x.receipt.coreWrite,false);
});
