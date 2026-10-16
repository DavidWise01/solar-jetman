"""Test actual browser modules with no external network using Playwright request interception."""
from pathlib import Path
from urllib.parse import urlparse
import base64
import re
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
checks=[]
def check(name,ok,detail=None):
 checks.append({'test':name,'passed':bool(ok),'detail':detail})
 if not ok: print('FAIL',name,detail)
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  for width,height,label in [(1440,980,'desktop'),(390,844,'mobile')]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
   def url_of(rel):
    src=(root/rel).read_text(encoding='utf-8')
    return 'data:text/javascript;base64,'+base64.b64encode(src.encode()).decode()
   imports={
    "../engine.mjs":url_of('engine.mjs'),
    "../mobius8x8/engine.mjs":url_of('mobius8x8/engine.mjs'),
    "../infer/infer.mjs":url_of('infer/infer.mjs'),
   }
   madre=(root/'madre-prime/madre.mjs').read_text(encoding='utf-8')
   for name,u in imports.items():madre=madre.replace("from '"+name+"'","from '"+u+"'")
   madre_url='data:text/javascript;base64,'+base64.b64encode(madre.encode()).decode()
   app=(root/'madre-prime/app.mjs').read_text(encoding='utf-8')
   app=app.replace("from './madre.mjs'","from '"+madre_url+"'")
   app_url='data:text/javascript;base64,'+base64.b64encode(app.encode()).decode()
   html=(root/'madre-prime/index.html').read_text(encoding='utf-8')
   html=html.replace('<script type="module" src="./app.mjs"></script>',f'<script type="module">import "{app_url}";</script>')
   page.set_content(html,wait_until='load',timeout=20000)
   page.wait_for_timeout(500)
   check(label+' script errors absent',not errors,str(errors[:3]))
   check(label+' 366 shown',page.locator('#m-base').inner_text()=='366')
   check(label+' 365 shown',page.locator('#m-full').inner_text()=='365/365')
   check(label+' canvas exists',page.locator('#tower-view').count()==1)
   check(label+' no forced crossing on page load','No crossings yet' in page.locator('#ledger').inner_text())
   check(label+' 64 A cells',page.locator('#matrixA span').count()==64)
   check(label+' 64 B cells',page.locator('#matrixB span').count()==64)
   page.locator('#pause').click()
   page.locator('#turn360').click()
   check(label+' 360 negative frame','−1' in page.locator('#angle-caption').inner_text())
   page.locator('#turn720').click()
   check(label+' 720 positive frame','+1' in page.locator('#angle-caption').inner_text())
   page.locator('#swap').click()
   check(label+' preservation ACCEPT','ACCEPT' in page.locator('#swap-status').inner_text())
   page.locator('#fault-swap').click()
   check(label+' fault REJECT','REJECT' in page.locator('#swap-status').inner_text())
   page.locator('#inspect-184').click()
   check(label+' address inspection','core cell 180' in page.locator('#infer-status').inner_text())
   page.locator('#inspect-zero').click()
   check(label+' zero anchor','SCALAR_ZERO' in page.locator('#infer-status').inner_text())
   page.locator('#infer').click()
   check(label+' inference core untouched','core unchanged true' in page.locator('#infer-status').inner_text())
   page.locator('#fault-cell').click()
   check(label+' fault injected','1'==page.locator('#m-faults').inner_text())
   page.locator('#renew10').click()
   check(label+' renewal population','365/365'==page.locator('#m-full').inner_text())
   check(label+' 10 cycle renewal','10'==page.locator('#m-cycle').inner_text())
   check(label+' all repairs',page.locator('#m-faults').inner_text()=='0')
   page.screenshot(path=str(root/'madre-prime'/f'{label}.png'),full_page=True)
   page.close()
  browser.close()
 return checks
if __name__=='__main__':
 data=run();(root/'madre-prime'/'browser_results.json').write_text(json.dumps({'checks':data,'passed':sum(x['passed'] for x in data),'total':len(data)},indent=2))
 print(json.dumps({'passed':sum(x['passed'] for x in data),'total':len(data)}))
