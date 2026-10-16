#!/usr/bin/env python3
"""Export ACTUAL pretrained DistilGPT2 layer-0 Q/K/V and causal softmax attention.
Requires internet *on first use* to download distilbert/distilgpt2 weights.
No weights are bundled. Fails rather than claiming a measurement without weights.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path


def export(prompt, output, model_name, revision=None):
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
    except ImportError as exc:
        raise SystemExit('Missing dependency. Run: pip install torch transformers') from exc
    kw = {'revision': revision} if revision else {}
    tokenizer = AutoTokenizer.from_pretrained(model_name, **kw)
    model = AutoModelForCausalLM.from_pretrained(model_name, attn_implementation='eager', **kw)
    model.eval()
    enc = tokenizer(prompt, return_tensors='pt', add_special_tokens=False)
    ids = enc['input_ids']
    n = ids.shape[1]
    if not (2 <= n <= 64):
        raise SystemExit(f'Expected 2–64 token IDs, got {n}. Shorten/lengthen --prompt.')
    if not hasattr(model, 'transformer') or not hasattr(model.transformer.h[0].attn, 'c_attn'):
        raise SystemExit('Expected GPT2-compatible c_attn projection; model architecture not supported')
    with torch.no_grad():
        outputs = model(**enc, use_cache=False, output_attentions=True, output_hidden_states=True, return_dict=True)
        x = model.transformer.h[0].ln_1(outputs.hidden_states[0])
        packed = model.transformer.h[0].attn.c_attn(x)
        C = model.config.n_embd
        H = model.config.n_head
        if H != 12 or C//H != 64:
            raise SystemExit(f'Expected DistilGPT2 heads=12, dim=64, got H={H}, D={C//H}')
        q, k, v = packed.split(C, dim=-1)
        def heads(t):
            return t.reshape(1, n, H, C//H).permute(0, 2, 1, 3).float()
        q, k, v = (heads(z) for z in [q,k,v])
        mask = torch.triu(torch.ones(n,n,device=q.device,dtype=torch.bool),diagonal=1)
        logits = torch.matmul(q,k.transpose(-2,-1)) / math.sqrt(C//H)
        att = logits.masked_fill(mask,float('-inf')).softmax(dim=-1)
        original = outputs.attentions[0].float()
        delta = (att-original).abs().max().item()
        if delta > 2e-4:
            raise SystemExit(f'Q/K attention disagrees with forward attention: max diff {delta:.8g}; refusing export')
        def nested(t):
            return t[0].cpu().tolist()
        data = {
            'format':'seeded-cross-qkv-v1',
            'origin':'pretrained_model_qkv',
            'model':model_name,
            'revision':revision or getattr(model.config,'_commit_hash',None),
            'layer':0,
            'prompt':prompt,
            'token_ids':ids[0].tolist(),
            'tokens':tokenizer.convert_ids_to_tokens(ids[0].tolist()),
            'shape':{'heads':H,'tokens':n,'head_dim':C//H},
            'attention_kind':'causal_softmax_from_QK_checked_against_model_output',
            'forward_max_abs_error':delta,
            'q':nested(q), 'k':nested(k), 'v':nested(v), 'attention':nested(original)
        }
    data_path=Path(output)
    data_path.parent.mkdir(parents=True,exist_ok=True)
    raw=(json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=False)+'\n').encode('utf-8')
    data_path.write_bytes(raw)
    digest=hashlib.sha256(raw).hexdigest()
    data_path.with_suffix(data_path.suffix+'.sha256').write_text(f'{digest}  {data_path.name}\n')
    print(f'EXPORTED: {data_path} | {len(raw)} bytes | {n} tokens | {H} heads')
    print(f'Q/K forward attention check: max absolute difference {delta:.3g}')
    print(f'SHA256: {digest}')
    print('NOTE: This records normal softmax attention. It does NOT measure Seeded Cross attention.')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt',default='The cat sat on the mat because it was tired')
    parser.add_argument('--model',default='distilbert/distilgpt2')
    parser.add_argument('--revision',default=None)
    parser.add_argument('--output',default='distilgpt2-layer0-qkv.json')
    args=parser.parse_args()
    export(args.prompt,args.output,args.model,args.revision)