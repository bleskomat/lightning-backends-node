const assert = require('assert');
const HttpLightningBackend = require('../HttpLightningBackend');

class Backend extends HttpLightningBackend {

	static name = 'opennode';

	constructor(options) {
		options = options || {};
		super(Backend.name, options, {
			defaultOptions: {
				apiKey: null,
				baseUrl: null,
				callbackUrl: null,
				// Development => dev-api.opennode.co
				// Production => api.opennode.co
				hostname: 'api.opennode.co',
				protocol: 'https',
				requestContentType: 'json',
			},
			requiredOptions: ['apiKey'],
		});
		this.options.headers['Authorization'] = this.options.apiKey;
	}

	checkOptions(options) {
		assert.strictEqual(typeof options.apiKey, 'string', 'Invalid option ("apiKey"): String expected');
		HttpLightningBackend.prototype.checkOptions.call(this, options);
	}

	// https://developers.opennode.com/reference#initiate-withdrawal
	payInvoice(invoice) {
		let postData = {
			type: 'ln',
			address: invoice,
		};
		if (this.options.callbackUrl) {
			postData.callback_url = this.options.callbackUrl;
		}
		return this.request('post', '/v2/withdrawals', postData).then(result => {
			assert.ok(result.data && result.data.id, 'Unexpected response from LN Backend [POST /v2/withdrawals]: Missing "data.id"');
			// Return the identifier instead of the payment hash.
			// We will use this identifier to check payment status later.
			return { id: result.data.id };
		});
	}

	addInvoice(amount, extra) {
		let postData = {
			amount: Math.floor(amount / 1000),// convert to sats
			currency: 'BTC',
			description: extra.description,
		};
		if (this.options.callbackUrl) {
			postData.callback_url = this.options.callbackUrl;
		}
		return this.request('post', '/v1/charges', postData).then(result => {
			assert.ok(result.data && result.data.id, 'Unexpected response from LN Backend [POST /v1/charges]: Missing "data.id"');
			assert.ok(result.data && result.data.lightning_invoice && result.data.lightning_invoice.payreq, 'Unexpected response from LN Backend [POST /v1/charges]: Missing "data.lightning_invoice.payreq"');
			return {
				id: result.data.id,
				invoice: result.data.lightning_invoice.payreq,
			};
		});
	}

	getInvoiceStatus(id) {
		const withdrawalId = encodeURIComponent(id);
		return this.request('get', `/v1/withdrawal/${withdrawalId}`).then(result => {
			assert.ok(result.data && result.data.status, 'Unexpected response from LN Backend [GET /v1/withdrawal/:id]: Missing "data.status"');
			return {
				preimage: null,
				settled: result.data.status === 'confirmed',
			};
		});
	}

	getNodeUri() {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	openChannel(remoteId, localAmt, pushAmt, makePrivate) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	validateResponseBody(body) {
		assert.ok(body.success !== false, body.message);
	}
};

Backend.prototype.checkMethodErrorMessages.payInvoice.ok.push.apply(Backend.prototype.checkMethodErrorMessages.payInvoice.ok, [
	'Invalid payment request',
]);

Backend.prototype.checkMethodErrorMessages.payInvoice.notOk.push.apply(Backend.prototype.checkMethodErrorMessages.payInvoice.notOk, [
	'Invalid API key for request',
]);

Backend.form = {
	label: '',
	inputs: [
		{
			name: 'hostname',
			label: 'Hostname',
			type: 'text',
			default: 'api.opennode.co',
			required: true,
		},
		{
			name: 'apiKey',
			label: 'API Key',
			type: 'text',
			placeholder: 'xxx',
			default: '',
			required: true,
		},
	],
};

module.exports = Backend;
