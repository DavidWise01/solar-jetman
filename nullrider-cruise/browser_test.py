from pathlib import Path
import base64, re
from playwright.sync_api import sync_playwright
import json, traceback, hashlib
P=Path(__file__).resolve().parent
files={name:(P/name).read_bytes() for name in ['index.html','cruise.css','app.mjs','engine.mjs','scene.mjs','cruise.mjs']}
results=[]
def check(label,cond):
    results.append((label, bool(cond)))
    if not cond: print('FAIL', label)
with sync_playwright() as p:
    for viewport in [{'width':1440,'height':960},{'width':390,'height':844}]:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security','--use-gl=angle','--use-angle=swiftshader'])
        context=browser.new_context(viewport=viewport,device_scale_factor=1,ignore_https_errors=True)
        page=context.new_page();errors=[]
        page.expose_function('sha256Proxy',lambda arr:hashlib.sha256(bytes(arr)).hexdigest())
        page.on('pageerror',lambda error:errors.append(str(error)))
        # In-memory test document: the browser's network navigation is blocked by policy.
        # Keep real SHA-256 via Python hashlib bridge; test the native Node crypto separately.
        engine=(P/'engine.mjs').read_text()
        engine=re.sub(r"export async function sha256\(bytes\)\{[\s\S]*?\n\}","export async function sha256(bytes){return await window.sha256Proxy(Array.from(bytes));}",engine,count=1)
        def as_uri(code):return 'data:text/javascript;base64,'+base64.b64encode(code.encode('utf-8')).decode('ascii')
        engine=engine.replace('txId||crypto.randomUUID()',"txId||'in-memory-test-tx'")
        engine_uri=as_uri(engine)
        cruise_uri=as_uri((P/'cruise.mjs').read_text())
        scene_uri=as_uri((P/'scene.mjs').read_text())
        app=(P/'app.mjs').read_text().replace("'./engine.mjs'",repr(engine_uri)).replace("'./cruise.mjs'",repr(cruise_uri)).replace("'./scene.mjs'",repr(scene_uri))
        html=(P/'index.html').read_text().replace('<link rel="stylesheet" href="./cruise.css">','<style>'+ (P/'cruise.css').read_text()+'</style>')
        html=html.replace('<script type="module" src="./app.mjs"></script>','<script type="module">'+app+'</script>')
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function('!!window.NULLRIDER_CRUISE_TEST',timeout=15000)
        pref='mobile' if viewport['width']<500 else 'desktop'
        check(pref+' title',page.title().startswith('NULLRIDER'))
        check(pref+' zero pinned',page.locator('#frameLabel').inner_text()=='PRESENT / 0')
        check(pref+' shell31 +',page.locator('#topAngle').inner_text()=='310°')
        check(pref+' shell31 -',page.locator('#bottomAngle').inner_text()=='50°')
        check(pref+' 8 lanes',page.locator('#lanes .miniBar').count()==8)
        page.locator('#past').click();check(pref+' past tach',page.locator('#engineLabel').inner_text()=='TACH / -2')
        page.locator('#future').click();check(pref+' future posi',page.locator('#engineLabel').inner_text()=='POSI / +3')
        page.locator('#present').click();check(pref+' present gyro',page.locator('#engineLabel').inner_text()=='GYRO / 0')
        page.locator('#shell').fill('104');check(pref+' shell max allowed',page.locator('#shellIndex').inner_text()=='104')
        page.locator('#shell').fill('31')
        page.locator('#head').fill('11');check(pref+' head11',page.locator('#layerAddress').inner_text()=='H11 / 1,363 cells')
        page.locator('#speed').fill('3');check(pref+' 3x',page.locator('#speedValue').inner_text()=='3.00×')
        page.locator('#cargo').fill('🛰️ cruise test\nbytes 𐌰 ± 0')
        check(pref+' bytes',page.locator('#byteCount').inner_text().endswith(' BYTES'))
        page.locator('#launch').click()
        try: page.wait_for_function("window.NULLRIDER_CRUISE_TEST.getState().lastReceipt !== null",timeout=10000)
        except: print("TRACE",page.locator("#status").inner_text(),page.locator("#receipt").inner_text(),errors,page.evaluate("window.NULLRIDER_CRUISE_TEST.getState()"));raise
        rec=page.evaluate('window.NULLRIDER_CRUISE_TEST.getState().lastReceipt')
        check(pref+' ACCEPT',rec['status']=='ACCEPT')
        check(pref+' one seam',rec['seam_crossings']==1)
        check(pref+' shell attested',rec['cruise']['shell_index']==31)
        check(pref+' head attested',rec['cruise']['head']==11)
        check(pref+' original SHA',rec['source_sha256']==hashlib.sha256('🛰️ cruise test\nbytes 𐌰 ± 0'.encode()).hexdigest())
        page.locator('#fault').click()
        page.wait_for_function("window.NULLRIDER_CRUISE_TEST.getState().lastReceipt !== null && window.NULLRIDER_CRUISE_TEST.getState().lastReceipt.status === 'REJECT'",timeout=12000)
        rec=page.evaluate('window.NULLRIDER_CRUISE_TEST.getState().lastReceipt')
        check(pref+' fault REJECT',rec['status']=='REJECT')
        check(pref+' zero crossing on fault',rec['seam_crossings']==0)
        page.locator('#reset').click();check(pref+' reset',page.locator('#status').get_attribute('data-status')=='IDLE')
        check(pref+' no page JS errors',len(errors)==0)
        page.screenshot(path=str(P/(pref+'.png')),full_page=True,animations='disabled')
        print(pref, 'browser checks',sum(x[1] for x in results if x[0].startswith(pref)),'/',sum(1 for x in results if x[0].startswith(pref)),'errors',errors[:3])
        browser.close()
Path(P/'BROWSER_RESULTS.json').write_text(json.dumps({'passed':sum(x[1] for x in results),'total':len(results),'checks':[{'name':n,'ok':v} for n,v in results]},indent=2))
print('FINAL',sum(x[1] for x in results),'/',len(results))
raise SystemExit(0 if all(x[1] for x in results) else 1)
