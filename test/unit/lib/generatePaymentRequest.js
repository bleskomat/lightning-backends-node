const assert = require('assert');
const bolt11 = require('bolt11');
const crypto = require('crypto');
const { generatePaymentRequest } = require('../../../lib');
const secp256k1 = require('secp256k1');

describe('generatePaymentRequest(millisatoshis[, options])', function() {

	it('creates a valid bolt11 invoice', function() {
		const millisatoshis = 1;
		const result = generatePaymentRequest(millisatoshis);
		assert.strictEqual(typeof result, 'string');
		assert.strictEqual(result.substr(0, 'lnbc'.length), 'lnbc');
		const decoded = bolt11.decode(result);
		assert.strictEqual(decoded.millisatoshis, '1');
	});

	it('testnet network', function() {
		const millisatoshis = 7000;
		const result = generatePaymentRequest(millisatoshis, { network: 'testnet' });
		assert.strictEqual(typeof result, 'string');
		assert.strictEqual(result.substr(0, 'lntb'.length), 'lntb');
		const decoded = bolt11.decode(result);
		assert.strictEqual(decoded.millisatoshis, '7000');
	});

	it('custom preimage', function() {
		const millisatoshis = 20000;
		const preimage = Buffer.from('ed2088cfa529cf0539b486882caa08269203ac86', 'hex');
		const result = generatePaymentRequest(millisatoshis, { preimage });
		assert.strictEqual(typeof result, 'string');
		assert.strictEqual(result.substr(0, 'lnbc'.length), 'lnbc');
		const decoded = bolt11.decode(result);
		assert.strictEqual(decoded.millisatoshis, '20000');
		const paymentHash = decoded.tags.find(tag => {
			return tag.tagName === 'payment_hash';
		}).data;
		assert.strictEqual(paymentHash, crypto.createHash('sha256').update(preimage).digest('hex'));
	});

	it('custom node private key', function() {
		const millisatoshis = 42000;
		const nodePrivateKey = '4619651a34a875979ce5498968be9e0c048b36db4ab003eeddead0453d3fe214';
		const result = generatePaymentRequest(millisatoshis, { nodePrivateKey });
		assert.strictEqual(typeof result, 'string');
		assert.strictEqual(result.substr(0, 'lnbc'.length), 'lnbc');
		const decoded = bolt11.decode(result);
		assert.strictEqual(decoded.millisatoshis, '42000');
		const nodePublicKey = Buffer.from(secp256k1.publicKeyCreate(Buffer.from(nodePrivateKey, 'hex'))).toString('hex');
		assert.strictEqual(decoded.payeeNodeKey, nodePublicKey);
	});
});

