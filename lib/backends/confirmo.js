const assert = require('assert');
const bolt11 = require('bolt11');
const HttpLightningBackend = require('../HttpLightningBackend');

class Backend extends HttpLightningBackend {

	// https://confirmo.net/docs/api-reference/
	// https://confirmocrypto.docs.apiary.io
	static name = 'confirmo';

	constructor(options) {
		options = options || {};
		super(Backend.name, options, {
			defaultOptions: {
				apiKey: null,
				baseUrl: null,
				hostname: 'confirmo.net',
				settlementCurrency: null,// EUR/BTC/etc..
				protocol: 'https',
				requestContentType: 'json',
			},
			requiredOptions: ['apiKey'],
		});
		const { apiKey } = this.options;
		this.options.headers['Authorization'] = `Bearer ${apiKey}`;
	}

	checkOptions(options) {
		assert.strictEqual(typeof options.apiKey, 'string', 'Invalid option ("apiKey"): String expected');
		HttpLightningBackend.prototype.checkOptions.call(this, options);
	}

	// https://confirmocrypto.docs.apiary.io/#reference/0/payouts/create-payout
	// https://confirmocrypto.docs.apiary.io/#introduction/entity-states/payout-in-bitcoin-lightning
	payInvoice(invoice, extra) {
		extra = extra || {};
		const decoded = bolt11.decode(invoice);
		console.log({decoded, 'tags': decoded.tags});
		let postData = {
			amountFrom: 10,
			currencyFrom: 'EUR',
			paymentMethodId: 'BITCOIN_LIGHTNING_BTC',
		};
		console.log('payInvoice', {postData});
		return this.request('post', '/api/v3/payouts', postData).then(result => {
			console.log('payInvoice', {result});
			assert.ok(result.id, 'Unexpected response from LN Backend [POST /api/v3/payouts]: Missing "id"');
			// Return the identifier instead of the payment hash.
			// We will use this identifier to check payment status later.
			const { id } = result;
			const preimage = null;// Confirmo never returns a preimage for this request.
			return { id, preimage };
		});
	}

	// !!! TODO
	// Confirmo doesn't allow to simply pay a bolt11 invoice. It is necessary to request an lnurl-withdraw URL.
	// This requires having the fiatcurrency symbol + amount.
	// Then when the "payout" is created, an LNURL is provided which allows getting the number of sats that can be paid.

	getLnurlWithdraw(amount, fiatCurrency) {
		return this.request('post', '/api/v3/payouts', postData).then(result => {
			console.log('payInvoice', {result});
			assert.ok(result.id, 'Unexpected response from LN Backend [POST /api/v3/payouts]: Missing "id"');
			// Return the identifier instead of the payment hash.
			// We will use this identifier to check payment status later.
			const { id } = result;
			const preimage = null;// Confirmo never returns a preimage for this request.
			return { id, preimage };
		});
	}

	// https://confirmocrypto.docs.apiary.io/#reference/0/invoice/create-new-invoice
	addInvoice(amount, extra) {
		const { settlementCurrency } = this.options;
		let postData = {
			invoice: {
				amount: (amount / 1e11).toFixed(8),
				currencyFrom: 'BTC',
				currencyTo: null,
			},
			settlement: {
				currency: settlementCurrency,
			},
			reference: extra.description,
			paymentMethodId: 'BITCOIN_LIGHTNING_BTC',
		};
		return this.request('post', '/api/v3/invoices', postData).then(result => {
			assert.ok(result.id, 'Unexpected response from LN Backend [POST /api/v3/invoices]: Missing "id"');
			const invoiceId = encodeURIComponent(result.id);
			// !! UNDOCUMENTED WORK-AROUND !!
			// Send a PATCH request to explicitly choose the Bitcoin Lightning payment method.
			return this.request('patch', `/api/invoices/${invoiceId}/currency`, { paymentMethodId: 'BITCOIN_LIGHTNING_BTC' }).then(() => {
				return this.request('get', `/api/v3/invoices/${invoiceId}`).then(result2 => {
					assert.ok(result2.layer2Attributes && result2.layer2Attributes.bolt, 'Unexpected response from LN Backend [POST /api/v3/invoices]: Missing "layer2Attributes.bolt"');
					return {
						id: result.id,
						invoice: result2.layer2Attributes.bolt,
					};
				});
			});
		});
	}

	// https://confirmocrypto.docs.apiary.io/#reference/0/invoice/invoice-detail
	getInvoiceStatus(id) {
		const invoiceId = encodeURIComponent(id);
		return this.request('get', `/api/v3/invoices/${invoiceId}`).then(result => {
			assert.ok(result.status, 'Unexpected response from LN Backend [GET /api/v3/invoices/:id]: Missing "status"');
			return {
				preimage: null,
				settled: result.status === 'paid',
			};
		});
	}

	getBalance() {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	getNodeUri() {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	openChannel(remoteId, localAmt, pushAmt, makePrivate) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	validateResponseBody(body) {}
};

Backend.prototype.checkMethodErrorMessages = {
	payInvoice: {
		ok: [],
		notOk: [
			'Socks5 proxy rejected connection - Failure',
			'Invalid API key for request',
		],
	},
};

Backend.form = {
	label: '',
	inputs: [
		{
			name: 'hostname',
			label: 'Hostname',
			type: 'text',
			default: 'confirmo.net',
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
