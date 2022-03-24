const assert = require('assert');
const HttpLightningBackend = require('../HttpLightningBackend');

class Backend extends HttpLightningBackend {

	constructor(options) {
		options = options || {};
		super('coinos', options, {
			defaultOptions: {
				baseUrl: null,
				hostname: 'coinos.io',
				protocol: 'https',
				responseType: null,
				requestContentType: 'json',
				jwt: null,
			},
			requiredOptions: ['jwt'],
		});
		const { jwt } = this.options;
		this.options.headers['Authorization'] = `Bearer ${jwt}`;
	}

	checkOptions(options) {
		assert.strictEqual(typeof options.jwt, 'string', 'Invalid option ("jwt"): String expected');
		HttpLightningBackend.prototype.checkOptions.call(this, options);
	}

	payInvoice(invoice) {
		return this.request('post', '/api/lightning/send', {
			payreq: invoice,
		}).then(result => {
			assert.ok(result.hash, 'Unexpected response from LN Backend [POST /api/lightning/send]: Missing "hash"');
			return { id: null };
		});
	}

	addInvoice(amount, extra) {
		return this.request('post', '/api/lightning/invoice', {
			amount: Math.floor(amount / 1000),// convert to sats
			memo: extra.description,
		}).then(result => {
			return {
				id: null,
				invoice: result,
			};
		});
	}

	getInvoiceStatus(paymentHash) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	getNodeUri() {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	openChannel(remoteId, localAmt, pushAmt, makePrivate) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}
};

Backend.prototype.checkMethodErrorMessages.payInvoice.ok.push.apply(Backend.prototype.checkMethodErrorMessages.payInvoice.ok, [
	'no_route',
]);

Backend.prototype.checkMethodErrorMessages.payInvoice.notOk.push.apply(Backend.prototype.checkMethodErrorMessages.payInvoice.notOk, [
	'Unauthorized',
]);

module.exports = Backend;
