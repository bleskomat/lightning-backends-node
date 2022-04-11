const assert = require('assert');
const bolt11 = require('bolt11');
const crypto = require('crypto');
const { checkBackend, getBackends, getTagDataFromPaymentRequest } = require('../../../../lib');

describe('backends', function() {

	getBackends().forEach(Backend => {

		const { name } = Backend;
		const NAME = name.replace(/-/g, '').toUpperCase();

		describe(name, function() {

			let ln, config, network;
			let tests = {};
			before(function() {
				// Must be one level above other hooks/tests, to skip all hooks and tests in this suite.
				if (typeof process.env[`TEST_${NAME}_CONFIG`] === 'undefined') {
					return this.skip();
				}
				config = JSON.parse(process.env[`TEST_${NAME}_CONFIG`]);
				ln = new Backend(config);
				tests.getNodeUri = JSON.parse(process.env[`TEST_${NAME}_GETNODEURI`] || '{"skip":true}');
				tests.openChannel = JSON.parse(process.env[`TEST_${NAME}_OPENCHANNEL`] || '{"skip":true}');
				tests.payInvoice = JSON.parse(process.env[`TEST_${NAME}_PAYINVOICE`] || '{"skip":true}');
				tests.addInvoice = JSON.parse(process.env[`TEST_${NAME}_ADDINVOICE`] || '{"skip":true}');
				tests.getInvoiceStatus = JSON.parse(process.env[`TEST_${NAME}_GETINVOICESTATUS`] || '{"skip":true}');
				network = process.env[`TEST_${NAME}_NETWORK`] || 'bitcoin';
			});

			describe('checkBackend', function() {

				it('payInvoice', function() {
					this.timeout(30000);
					return checkBackend(name, config, { method: 'payInvoice', network }).then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.strictEqual(result.ok, true);
						assert.strictEqual(typeof result.message, 'undefined');
					});
				});
			});

			describe('methods', function() {

				it('getNodeUri()', function() {
					if (tests.getNodeUri.skip) return this.skip();
					return ln.getNodeUri().then(result => {
						if (typeof tests.getNodeUri.result !== 'undefined') {
							assert.strictEqual(result, tests.getNodeUri.result);
						} else {
							assert.strictEqual(typeof result, 'string');
						}
					});
				});

				it('openChannel(remoteId, localAmt, pushAmt, makePrivate)', function() {
					if (tests.openChannel.skip) return this.skip();
					this.timeout(60000);
					let { remoteId, localAmt, pushAmt, makePrivate } = tests.openChannel;
					assert.ok(remoteId, 'Missing required "remoteId" test parameter');
					if (typeof localAmt === 'undefined') {
						localAmt = 20000;
					}
					if (typeof pushAmt === 'undefined') {
						pushAmt = 0;
					}
					if (typeof makePrivate === 'undefined') {
						makePrivate = 0;
					}
					return ln.openChannel(remoteId, localAmt, pushAmt, makePrivate);
				});

				it('payInvoice(invoice)', function() {
					if (tests.payInvoice.skip) return this.skip();
					this.timeout(20000);
					let { invoice } = tests.payInvoice;
					assert.ok(invoice, 'Missing required "invoice" test parameter');
					return ln.payInvoice(invoice).then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.notStrictEqual(typeof result.id, 'undefined');
					});
				});

				it('addInvoice(amount, extra)', function() {
					if (tests.addInvoice.skip) return this.skip();
					let { amount } = tests.addInvoice;
					if (typeof amount === 'undefined') {
						amount = 50000;// msats
					}
					const description = 'test addInvoice';
					const extra = {
						description,
						descriptionHash: crypto.createHash('sha256').update(Buffer.from(description, 'utf8')).digest('hex'),
					};
					return ln.addInvoice(amount, extra).then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.notStrictEqual(typeof result.id, 'undefined');
						assert.ok(result.invoice);
						const { invoice } = result;
						const decoded = bolt11.decode(invoice);
						const sats = Math.floor(amount / 1000);
						assert.strictEqual(decoded.satoshis, sats);
						assert.strictEqual(decoded.millisatoshis, (sats * 1000).toString());
						let tags = {};
						decoded.tags.forEach(tag => {
							const { tagName, data } = tag;
							tags[tagName] = data;
						});
						if (typeof tags.description !== 'undefined') {
							assert.strictEqual(tags.description, description);
						}
						if (typeof tags.description_hash !== 'undefined') {
							assert.strictEqual(tags.description_hash, description_hash);
						}
					});
				});

				it('getInvoiceStatus(paymentHash)', function() {
					if (tests.getInvoiceStatus.skip) return this.skip();
					let { paymentHash, preimage, settled } = tests.getInvoiceStatus;
					assert.ok(paymentHash, 'Missing required "paymentHash" test parameter');
					return ln.getInvoiceStatus(paymentHash).then(result => {
						assert.strictEqual(typeof result, 'object');
						assert.notStrictEqual(typeof result.preimage, 'undefined');
						assert.notStrictEqual(typeof result.settled, 'undefined');
						assert.strictEqual(typeof result.settled, 'boolean');
						if (typeof preimage !== 'undefined') {
							assert.strictEqual(result.preimage, preimage);
						}
						if (typeof settled !== 'undefined') {
							assert.strictEqual(result.settled, settled);
						}
					});
				});

				it('getBalance()', function() {
					return ln.getBalance().then(result => {
						assert.ok(Number.isInteger(result));
					});
				});
			});
		});
	});
});
