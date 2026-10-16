# NULLRIDER Dual Solar Three.js Page — Test Report

- **Node engine:** 23 passed / 0 failed.
- **Desktop Chromium UI:** 1440 × 960; accepted original payload; one seam crossing; rejected corrupted B payload; zero seam crossings; reset restored IDLE; no JS errors or horizontal overflow.
- **Mobile Chromium UI:** 390 × 844; same tests passed; no horizontal overflow.
- **SHA-256:** standard `abc` known-answer vector passed.
- **Nested shells:** both A and B exactly restore binary byte arrays at lengths 0, 1, 3, 15, 16, 1024 and 4096; bad shell order rejected.
- **180°:** twice applying `(x,y) → (-x,-y)` returns original point.
- **Fallback:** browser policy prevents CDN loading during headless offline checks. Canvas fallback rendered. Actual Three.js WebGL scene code passes static syntax check but WebGL runtime itself has **not** been exercised in this environment.
- **Secure-context note:** offline browser harness uses a Python SHA-256 bridge because browser `about:blank` lacks native Web Crypto. In Node the browser engine uses native Web Crypto. In normal HTTPS deployment, browsers use native Web Crypto.
- **Prior signed receiver:** unchanged; this site does not claim to issue signed receipts or contact `0root.ai`.
