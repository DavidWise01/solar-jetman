import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMadrePrimeAdaptiveNode} from './node-adaptive.mjs';
import {newWorld} from '../phase/benchmark.mjs';

test('adaptive calibration is gated and never changes parent core',()=>{
 const x=createMadrePrimeAdaptiveNode();
 assert.equal(x.through184({via:183,op:'CALIBRATE_ADAPTIVE'}).error,'GATE_184_REQUIRED');
 assert.equal(x.through184({via:184,op:'INFER_ADAPTIVE',observations:[]}).error,'CALIBRATION_REQUIRED');
 const before=x.through184({via:184,op:'VIEW'}).stats.fingerprint;
 const refs=Array.from({length:12},(_,i)=>newWorld(710000+i,0.6,true));
 const cal=x.through184({via:184,op:'CALIBRATE_ADAPTIVE',referenceWorlds:refs});assert.equal(cal.accepted,true);
 const world=newWorld(720001,0.6,true);
 const result=x.through184({via:184,op:'INFER_ADAPTIVE',observations:world.rotating});
 assert.equal(result.accepted,true);assert.equal(result.readonly,true);assert.equal(result.rows.length,365);
 assert.equal(x.through184({via:184,op:'VIEW'}).stats.fingerprint,before);
});
