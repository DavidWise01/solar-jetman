from pathlib import Path
root=Path(__file__).parent
html=(root/'index.template.html').read_text()
engine=(root/'engine.mjs').read_text().replace('export const ', 'const ').replace('export function ', 'function ')
app=(root/'app.js').read_text()
html=html.replace('/* ENGINE_INLINE */',engine).replace('/* APP_INLINE */',app)
(root/'index.html').write_text(html)
print('Wrote',root/'index.html',len(html.encode('utf-8')),'bytes')
