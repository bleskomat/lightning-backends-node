const assert = require('assert');
const HttpLightningBackend = require('../HttpLightningBackend');

// https://dev.blink.sv/

class Backend extends HttpLightningBackend {

	static name = 'blink';

	constructor(options) {
		options = options || {};
		super(Backend.name, options, {
			defaultOptions: {
				baseUrl: null,
				hostname: null,
				protocol: 'https',
				requestContentType: 'json',
			},
			requiredOptions: ['connectionString'],
		});
		Object.assign(this.options, this.parseConnectionString(this.options.connectionString));
		this.options.headers['X-API-KEY'] = encodeURIComponent(this.options.apiKey);
	}

	checkOptions(options) {
		assert.strictEqual(typeof options.connectionString, 'string', 'Invalid option ("connectionString"): String expected');
		Object.assign(options, this.parseConnectionString(options.connectionString));
		HttpLightningBackend.prototype.checkOptions.call(this, options);
	}

	parseConnectionString(connectionString) {
		let values = {};
		connectionString.split(';').forEach(line => {
			const [ key, value ] = line.split('=');
			values[key] = value;
		});
		const baseUrl = values['server'] || null;
		const apiKey = values['api-key'] || null;
		const walletId = values['wallet-id'] || null;
		try {
			assert.ok(values['type'], 'Missing "type"');
			assert.strictEqual(values['type'], 'blink', 'Invalid type: Expected "blink"');
			assert.ok(baseUrl, 'Missing "server"');
			assert.ok(apiKey, 'Missing "api-key"');
			assert.ok(walletId, 'Missing "wallet-id"');
		} catch (error) {
			throw new Error(`Invalid option ("connectionString"): ${error.message}`);
		}
		return { baseUrl, apiKey, walletId };
	}

	payInvoice(invoice) {
		const query = 'mutation LnInvoicePaymentSend($input: LnInvoicePaymentInput!) {\n  lnInvoicePaymentSend(input: $input) {\n    status\n    errors {\n      message\n      path\n      code\n    }\n  }\n}';
		const variables = {
			input: {
				paymentRequest: invoice,
				walletId: this.options.walletId,
			},
		};
		return this.doGraphQLQuery(query, variables).then(result => {
			const { preimage } = Object.values(result.data)[0].blah || {};
			return { id: null, preimage };
		});
	}

	addInvoice(amount, extra) {
		const query = 'mutation LnInvoiceCreate($input: LnInvoiceCreateInput!) {\n  lnInvoiceCreate(input: $input) {\n    invoice {\n      paymentRequest\n      paymentHash\n      paymentSecret\n      satoshis\n    }\n    errors {\n      message\n    }\n  }\n}';
		const variables = {
			input: {
				amount: Math.floor(amount / 1000).toString(),// sats
				walletId: this.options.walletId,
			},
		};
		return this.doGraphQLQuery(query, variables).then(result => {
			const { paymentRequest } = Object.values(result.data)[0].invoice || {};
			return { id: null, invoice: paymentRequest };
		});
	}

	getInvoiceStatus(paymentHash) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	getBalance() {
		const query = 'query me { me { defaultAccount { wallets { id walletCurrency balance }}}}';
		const variables = {};
		return this.doGraphQLQuery(query, variables).then(result => {
			const wallets = result.data.me && result.data.me.defaultAccount && result.data.me.defaultAccount.wallets || [];
			assert.ok(wallets, 'Unexpected JSON response');
			const wallet = wallets.find(_wallet => _wallet.id === this.options.walletId);
			assert.ok(wallet, 'Wallet info not found');
			return parseInt(wallet.balance) * 1000;// msat
		});
	}

	getNodeUri() {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	openChannel(remoteId, localAmt, pushAmt, makePrivate) {
		return Promise.reject(new Error('Not supported by this LN service.'));
	}

	doGraphQLQuery(query, variables) {
		console.log('doGraphQLQuery', {query, variables});
		return this.request('post', '', { query, variables }).then(result => {
			console.log(JSON.stringify({result}, null, 2));
			assert.ok(result && result.data, 'Unexpected JSON response: ' + JSON.stringify(result));
			const { errors } = Object.values(result.data)[0] || {};
			assert.ok(!errors || errors.length === 0, JSON.stringify(errors));
			return result;
		});
	}
};

Backend.prototype.checkMethodErrorMessages = {
	payInvoice: {
		ok: [
			'Unable to find a route for payment.',
			'ROUTE_FINDING_ERROR',
		],
		notOk: [
			'INSUFFICIENT_BALANCE',
			'Authorization Required',
		],
	},
};

Backend.form = {
	label: 'Blink',
	inputs: [
		{
			name: 'connectionString',
			label: 'BTCPay Connection String',
			help: 'Sign-in to your Blink account in a browser. Go to API Keys. Click the plus symbol (+) in the upper right corner to create a new API key. Copy the BTCPay connection string for your wallet.',
			type: 'password',
			placeholder: 'xxx',
			default: '',
			required: true,
		},
	],
};

module.exports = Backend;
