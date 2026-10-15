/* NULLRIDER V2: signed, byte-preserving handoff protocol (Node >= 20, no dependencies). */
import { createHash, sign, verify, randomUUID } from 'node:crypto';
export const VERSION = 'NULLRIDER-V2';
export const ENGINE = "{{ space cowboy v4 :: jit :: `'0'` sjm/|\\mjs }}";
export const HANDOFF = "-'smj`0`mjs +'";
export const SEAM = '{{ A ---> S <--- A }}';
export const SHELLS = Object.freeze(['sol:a', 'jet:b', 'man:c', 'man:d']);
export const ZIP = Object.freeze([...SHELLS].reverse());
export const RIDER = 'i{sjm}';
export const SOURCE = 'https://github.com/DavidWise01/solar-jetman';
export const DESTINATION = 'https://0root.ai';
export const MAX_PAYLOAD_BYTES = 65536;

export function assert(condition, code) { if (!condition) throw new Error(code); }
export function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+stable(value[k])).join(',') + '}';
}
export function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
export function signObject(value, privateKey) { return sign(null, Buffer.from(stable(value)), privateKey).toString('base64'); }
export function verifyObject(value, signature, publicKey) {
  try { return typeof signature === 'string' && verify(null, Buffer.from(stable(value)), publicKey, Buffer.from(signature,'base64')); }
  catch { return false; }
}
export function decodePayload(base64) {
  assert(typeof base64 === 'string' && base64.length <= Math.ceil(MAX_PAYLOAD_BYTES / 3) * 4 + 4,'INVALID_ENCODING');
  const bytes = Buffer.from(base64, 'base64');
  assert(bytes.toString('base64') === base64 && bytes.length <= MAX_PAYLOAD_BYTES, 'INVALID_ENCODING');
  return bytes;
}
export function createEnvelope(payloadBytes, name, privateKey, overrides = {}) {
  const bytes = Buffer.from(payloadBytes);
  assert(bytes.length > 0 && bytes.length <= MAX_PAYLOAD_BYTES, 'PAYLOAD_SIZE');
  assert(typeof name === 'string' && name.length >= 1 && name.length <= 160, 'INVALID_NAME');
  const manifest = {
    protocol:VERSION, engine_literal:ENGINE, signed_handoff_literal:HANDOFF, dual_screw:SEAM,
    tx_id:randomUUID(), created_at:new Date().toISOString(), artifact_name:name,
    source:SOURCE, destination:DESTINATION, rider_id:RIDER,
    payload_sha256:sha256(bytes), payload_bytes:bytes.length,
    zip_operations:[...ZIP], unzip_operations:[...SHELLS], seam_events:['CROSS_0'],
    ...overrides,
  };
  const unsigned = {manifest, payload_b64:bytes.toString('base64')};
  return {...unsigned, signature:signObject(unsigned, privateKey)};
}
export function validateEnvelope(envelope, trustedSenderPublicKey) {
  assert(envelope && typeof envelope === 'object' && !Array.isArray(envelope), 'INVALID_ENVELOPE');
  const {manifest:m, payload_b64, signature} = envelope;
  assert(m && typeof m === 'object', 'INVALID_MANIFEST');
  assert(verifyObject({manifest:m,payload_b64},signature,trustedSenderPublicKey),'BAD_SIGNATURE');
  assert(m.protocol === VERSION && m.engine_literal === ENGINE && m.signed_handoff_literal === HANDOFF && m.dual_screw === SEAM,'GLYPH_MISMATCH');
  assert(m.source === SOURCE && m.destination === DESTINATION, 'ENDPOINT_MISMATCH');
  assert(m.rider_id === RIDER,'RIDER_MISMATCH');
  assert(JSON.stringify(m.zip_operations) === JSON.stringify(ZIP) && JSON.stringify(m.unzip_operations) === JSON.stringify(SHELLS),'ZIP_ORDER_MISMATCH');
  assert(JSON.stringify(m.seam_events) === '["CROSS_0"]','SEAM_CARDINALITY');
  assert(typeof m.tx_id === 'string' && /^[a-f0-9-]{36}$/.test(m.tx_id),'INVALID_TRANSACTION');
  assert(typeof m.artifact_name === 'string' && m.artifact_name.length > 0 && m.artifact_name.length <= 160, 'INVALID_NAME');
  const bytes = decodePayload(payload_b64);
  assert(bytes.length === m.payload_bytes && sha256(bytes) === m.payload_sha256, 'PAYLOAD_DIGEST_MISMATCH');
  return {manifest:m,bytes};
}
export function createReceipt(manifest, receiverPrivateKey) {
  const receipt = {
    protocol:VERSION, tx_id:manifest.tx_id, status:'ACCEPT', source:manifest.source, destination:manifest.destination,
    artifact_name:manifest.artifact_name, rider_id:manifest.rider_id, payload_sha256:manifest.payload_sha256,
    zip_operations:[...ZIP], unzip_operations:[...SHELLS], seam_crossings:1,
    witnessed_at:new Date().toISOString(), witness:'NULLRIDER V2 LOCAL RECEIVER',
    declaration:'MOON SIMULATION; signed cross-process handoff, not hardware air gap',
  };
  return {receipt,signature:signObject(receipt,receiverPrivateKey)};
}
export function verifyReceipt(signedReceipt, manifest, receiverPublicKey) {
  assert(signedReceipt?.receipt && verifyObject(signedReceipt.receipt,signedReceipt.signature,receiverPublicKey),'BAD_RECEIPT_SIGNATURE');
  const r=signedReceipt.receipt;
  assert(r.status === 'ACCEPT' && r.tx_id === manifest.tx_id && r.rider_id === manifest.rider_id && r.payload_sha256 === manifest.payload_sha256 && r.destination === DESTINATION && r.seam_crossings === 1,'RECEIPT_MISMATCH');
  return true;
}
