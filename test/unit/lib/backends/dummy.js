const assert = require('assert');
const crypto = require('crypto');
const { generatePaymentRequest, getTagDataFromPaymentRequest } = require('../../../../lib');
const DummyLightningBackend = require('../../../../lib/backends/dummy');
const secp256k1 = require('secp256k1');

describe('backends', function() {

	describe('dummy', function() {

		describe('methods', function() {

			let ln;
			before(function() {
				ln = new DummyLightningBackend();
			});

			it('getNodeUri()', function() {
				return ln.getNodeUri().then(result => {
					assert.strictEqual(typeof result, 'string');
				});
			});

			it('openChannel(remoteId, localAmt, pushAmt, makePrivate)', function() {
				const nodePrivateKey = Buffer.from('4619651a34a875979ce5498968be9e0c048b36db4ab003eeddead0453d3fe214', 'hex');
				const remoteId = Buffer.from(secp256k1.publicKeyCreate(nodePrivateKey));
				const localAmt = 20000;
				const pushAmt = 0;
				const makePrivate = 0;
				return ln.openChannel(remoteId, localAmt, pushAmt, makePrivate);
			});

			it('payInvoice(invoice)', function() {
				const invoice = generatePaymentRequest(1000);
				return ln.payInvoice(invoice).then(result => {
					assert.strictEqual(typeof result, 'object');
					assert.notStrictEqual(typeof result.id, 'undefined');
				});
			});

			it('addInvoice(amount, extra)', function() {
				const amount = 5000;
				const extra = {
					description: 'test addInvoice',
				};
				return ln.addInvoice(amount, extra).then(result => {
					assert.strictEqual(typeof result, 'object');
					assert.notStrictEqual(typeof result.id, 'undefined');
				});
			});

			it('getInvoiceStatus(paymentHash)', function() {
				const preimage = Buffer.from('preimage test getInvoiceStatus', 'utf8');
				const paymentHash = crypto.createHash('sha256').update(preimage).digest('hex');
				return ln.getInvoiceStatus(paymentHash).then(result => {
					assert.strictEqual(typeof result, 'object');
					assert.ok(result.preimage);
					assert.ok(result.settled);
				});
			});
		});

		describe('options', function() {

			describe('{ alwaysFail: true }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ alwaysFail: true });
				});

				['getNodeUri', 'openChannel', 'payInvoice', 'addInvoice'].forEach(method => {
					it(`${method} should fail`, function() {
						assert.rejects(ln[method]());
					});
				});
			});

			describe('{ alwaysFail: false }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ alwaysFail: false });
				});

				['getNodeUri', 'openChannel', 'payInvoice', 'addInvoice'].forEach(method => {
					it(`${method} should not fail`, function() {
						assert.doesNotReject(ln[method]());
					});
				});
			});

			describe('{ preimage: "KNOWN_PREIMAGE" }', function() {

				let preimage;
				let ln;
				before(function() {
					preimage = crypto.randomBytes(20);
					ln = new DummyLightningBackend({ preimage });
				});

				it('addInvoice returns invoice with payment hash of preimage', function() {
					return ln.addInvoice(10000).then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.ok(result.invoice);
						const paymentHash = getTagDataFromPaymentRequest(result.invoice, 'payment_hash');
						assert.strictEqual(paymentHash, crypto.createHash('sha256').update(preimage).digest('hex'));
					});
				});

				it('getInvoiceStatus returns { preimage: "KNOWN_PREIMAGE" }', function() {
					return ln.getInvoiceStatus().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.preimage, preimage.toString('hex'));
					});
				});
			});

			describe('{ useIdentifier: true }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ useIdentifier: true });
				});

				it('payInvoice returns { id: "IDENTIFIER" }', function() {
					return ln.payInvoice().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.ok(result.id);
						assert.strictEqual(typeof result.id, 'string');
					});
				});

				it('addInvoice returns { id: "IDENTIFIER" }', function() {
					return ln.payInvoice().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.ok(result.id);
						assert.strictEqual(typeof result.id, 'string');
					});
				});
			});

			describe('{ useIdentifier: false }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ useIdentifier: false });
				});

				it('payInvoice returns { id: null }', function() {
					return ln.payInvoice().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.id, null);
					});
				});

				it('addInvoice returns { id: null }', function() {
					return ln.payInvoice().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.id, null);
					});
				});
			});

			describe('{ settled: true }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ settled: true });
				});

				it('getInvoiceStatus returns { settled: true }', function() {
					return ln.getInvoiceStatus().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.settled, true);
					});
				});
			});

			describe('{ settled: false }', function() {

				let ln;
				before(function() {
					ln = new DummyLightningBackend({ settled: false });
				});

				it('getInvoiceStatus returns { settled: false }', function() {
					return ln.getInvoiceStatus().then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.settled, false);
					});
				});
			});
		});
	});
});
