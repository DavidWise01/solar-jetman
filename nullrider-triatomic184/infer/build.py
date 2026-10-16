from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent
ENGINE=(ROOT.parent/'engine.mjs').read_text(encoding='utf-8')
INFER=(ROOT/'infer.mjs').read_text(encoding='utf-8')
SYN=(ROOT/'synthetic.mjs').read_text(encoding='utf-8')
APP=(ROOT/'app.js').read_text(encoding='utf-8')
def strip(txt):
    return re.sub(r'^export ', '', re.sub(r'^import .*?;\s*$', '', txt, flags=re.M), flags=re.M)
parts=['const ENG=(()=>{'+strip(ENGINE)+'\nreturn {createTriatomic184};})();',
    'const INF=(()=>{'+strip(INFER)+'\nreturn {infer184,prior184,SENSOR_MODEL};})();',
    'const LAB=(()=>{const {createTriatomic184}=ENG;const {prior184,SENSOR_MODEL,infer184}=INF;'+strip(SYN)+'\nreturn {syntheticTrial,score184,syntheticBenchmark};})();',APP]
js='\n'.join(parts)
assert '</script>' not in js.lower()
page=(ROOT/'index.template.html').read_text(encoding='utf-8').replace('/* BUILD_INLINE */',js)
(ROOT/'index.html').write_text(page,encoding='utf-8')
print('Built standalone HTML', len(page),'characters')
