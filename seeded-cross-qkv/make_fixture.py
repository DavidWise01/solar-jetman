"""Small explicitly synthetic Q/K/V data for local/offline parser tests only."""
import json,numpy as np
from pathlib import Path
rng=np.random.default_rng(16356)
H,N,D=12,8,64
q=rng.normal(0,.4,(H,N,D)); k=rng.normal(0,.4,(H,N,D));v=rng.normal(0,.4,(H,N,D))
a=np.zeros((H,N,N))
for h in range(H):
 for i in range(N):
  scores=q[h,i]@k[h,:i+1].T/np.sqrt(D)
  scores=np.exp(scores-np.max(scores));a[h,i,:i+1]=scores/scores.sum()
record={'format':'seeded-cross-qkv-v1','origin':'synthetic_test_only','model':'NONE_SYNTHETIC_DATA','revision':None,'layer':0,'prompt':'SYNTHETIC TOKEN VECTORS NOT A PRETRAINED MODEL', 'token_ids':list(range(N)),'tokens':[f'TEST_{i}' for i in range(N)],'shape':{'heads':H,'tokens':N,'head_dim':D},'attention_kind':'synthetic_causal_softmax', 'q':q.tolist(),'k':k.tolist(),'v':v.tolist(),'attention':a.tolist()}
Path(__file__).with_name('synthetic_qkv_fixture.json').write_text(json.dumps(record,separators=(',',':'))+'\n')