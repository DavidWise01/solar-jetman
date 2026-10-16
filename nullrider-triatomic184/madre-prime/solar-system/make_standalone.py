"""Create one dependency-free HTML for offline browser preview and test."""
from pathlib import Path
import re,base64
root=Path(__file__).parent
cache={}
def bundle(path):
 path=path.resolve()
 if path in cache:return cache[path]
 text=path.read_text()
 def repl(m):
  mod=(path.parent/m.group(2)).resolve()
  if not mod.is_file():raise FileNotFoundError(mod)
  return m.group(1)+bundle(mod)+m.group(3)
 text=re.sub(r'''(from\s*['"])(\.{1,2}/[^'"\n]+)(['"])''',repl,text)
 uri='data:text/javascript;base64,'+base64.b64encode(text.encode()).decode()
 cache[path]=uri
 return uri
html=(root/'index.html').read_text()
entry=bundle(root/'app.mjs')
html=html.replace('<script type="module" src="./app.mjs"></script>',f'<script type="module">import "{entry}";</script>')
assert '<script type="module">import "data:text/javascript;base64,' in html
(root/'standalone.html').write_text(html)
print(f"Wrote standalone.html ({len(html):,} characters), {len(cache)} module imports")
