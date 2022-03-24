const assert = require('assert');
const crypto = require('crypto');
const { getTagDataFromPaymentRequest, generatePaymentRequest } = require('../../../lib');

describe('getTagDataFromPaymentRequest(pr, tagName)', function() {

	it('payment_hash', function() {
		const preimage = '12345';
		const pr = generatePaymentRequest(1000, { preimage });
		const result = getTagDataFromPaymentRequest(pr, 'payment_hash');
		assert.strictEqual(result, crypto.createHash('sha256').update(Buffer.from(preimage, 'utf8')).digest('hex'));
	});

	it('purpose_commit_hash', function() {
		const description = '12345';
		const pr = generatePaymentRequest(1000, { description });
		const result = getTagDataFromPaymentRequest(pr, 'purpose_commit_hash');
		assert.strictEqual(result, crypto.createHash('sha256').update(Buffer.from(description, 'utf8')).digest('hex'));
	});
});
