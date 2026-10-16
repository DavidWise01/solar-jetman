from pathlib import Path
import asyncio, json
from playwright.async_api import async_playwright
ROOT=Path(__file__).parent
async def main():
    checks=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for name,size in [('desktop',{'width':1366,'height':990}),('mobile',{'width':390,'height':844})]:
            page=await browser.new_page(viewport=size)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.set_content((ROOT/'standalone.html').read_text(),wait_until='domcontentloaded')
            await page.wait_for_function('window.__MADRE_RED184__ !== undefined',timeout=18000)
            async def chk(label,value): checks.append({'view':name,'check':label,'pass':bool(value)})
            await chk('no JS errors',len(errors)==0)
            await chk('gateway', 'READ-ONLY' in await page.locator('#gateway').inner_text())
            await chk('14 Colors',await page.locator('.caste').count()==14)
            await chk('8 planets',await page.locator('#worldButtons button').count()==8)
            await chk('default Mars', (await page.evaluate('window.__MADRE_RED184__.planet'))=='mars')
            await chk('Read only',await page.evaluate('window.__MADRE_RED184__.readonly') is True)
            await chk('Daughters default',await page.locator('#daughters').inner_text()=='16')
            flux=await page.evaluate('window.__MADRE_RED184__.physicalSolar.topOfAtmosphereWm2')
            await page.locator('[data-planet="venus"]').click()
            await chk('Venus select',(await page.evaluate('window.__MADRE_RED184__.planet'))=='venus')
            await chk('Venus faction', 'SOCIETY' in await page.locator('#faction').inner_text())
            await chk('Fiction does not change flux',abs(flux-await page.evaluate('window.__MADRE_RED184__.physicalSolar.topOfAtmosphereWm2'))<1e-9)
            await page.locator('[data-mode="science"]').click()
            await chk('Science mode hides fiction',await page.locator('#fictionpanel').is_hidden())
            await page.locator('[data-mode="fiction"]').click()
            await chk('Fiction mode hides science',await page.locator('#sciencepanel').is_hidden())
            await page.locator('[data-mode="both"]').click()
            await chk('Both layers restored',await page.locator('#sciencepanel').is_visible() and await page.locator('#fictionpanel').is_visible())
            await page.locator('#distance').fill('2')
            flux2=await page.evaluate('window.__MADRE_RED184__.physicalSolar.topOfAtmosphereWm2')
            await chk('Inverse square distance slider',abs(flux/flux2-4)<1e-8)
            await page.locator('#material').fill('0')
            await chk('Empty resource reservoir',await page.locator('#daughters').inner_text()=='0')
            await page.locator('#material').fill('5832')
            await page.locator('#distance').fill('1')
            await page.locator('#phase').fill('4')
            await chk('Phase input updates',(await page.evaluate('window.__MADRE_RED184__.phase'))==4)
            await chk('No core write',await page.evaluate('window.__MADRE_RED184__.coreWrite') is False)
            await chk('Canvas SVG eight selectable planets',await page.locator('#orbitSvg g[data-world]').count()==8)
            await chk('No horizontal clipping',await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'))
            await page.screenshot(path=str(ROOT/(name+'.png')),full_page=True)
            await page.close()
        await browser.close()
    (ROOT/'browser_results.json').write_text(json.dumps({'passed':sum(x['pass'] for x in checks),'total':len(checks),'checks':checks},indent=2))
    print('BROWSER:',sum(x['pass'] for x in checks),'/',len(checks));
    for x in checks:
        if not x['pass']: print('FAILED',x)
    assert all(x['pass'] for x in checks)
asyncio.run(main())
