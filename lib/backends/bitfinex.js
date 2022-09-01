const assert = require('assert');
const crypto = require('crypto');
const HttpLightningBackend = require('../HttpLightningBackend');

class Backend extends HttpLightningBackend {

    static name = 'bitfinex';

    constructor(options) {
        options = options || {};
        super(Backend.name, options, {
            defaultOptions: {
                apiKey: null,
                apiSecret: null,
                baseUrl: null,
                callbackUrl: null,
                // Production => api.bitfinex.com
                hostname: 'api.bitfinex.com',
                protocol: 'https',
                requestContentType: 'json',
            },
            requiredOptions: ['apiKey', 'apiSecret'],
        });
        // Headers bfx-nonce and bfx-signature are also required, but must be added individually on each request.
        this.options.headers['bfx-apikey'] = this.options.apiKey;

        // Bitfinex requires that this must be called once on the account before invoices can be generated.
        const path = 'v2/auth/w/deposit/address';
        let postData = {
            wallet: 'exchange',
            method: 'LNX',
        };
        const extraHeaders = this.generateAuthHeaders(path, postData, this.options.apiSecret)
        this.request('post', `/${path}`, postData, extraHeaders).then(result => {
            assert.ok(result && result.length === 8, `Unexpected response from LN Backend [POST ${path}]: data length should be 8 but is ${result.length}`);
            const status = result[6];
            assert.ok(status === 'SUCCESS')
        });
    }

    checkOptions(options) {
        assert.strictEqual(typeof options.apiKey, 'string', 'Invalid option ("apiKey"): String expected');
        assert.strictEqual(typeof options.apiSecret, 'string', 'Invalid option ("apiSecret"): String expected');
        HttpLightningBackend.prototype.checkOptions.call(this, options);
    }

    // https://docs.bitfinex.com/reference/rest-auth-deposit-invoice
    payInvoice(invoice) {
        return Promise.reject(new Error('Not supported by this LN service.'));
    }

    // https://docs.bitfinex.com/reference/rest-auth-deposit-invoice
    addInvoice(amount, extra) {
        const path = 'v2/auth/w/deposit/invoice';
        let postData = {
            wallet: 'exchange',
            currency: 'LNX',
            amount: (amount * 1.0 / 100000000000).toFixed(8) // Convert msats to BTC.
        };
        const extraHeaders = this.generateAuthHeaders(path, postData, this.options.apiSecret)
        return this.request('post', `/${path}`, postData, extraHeaders).then(result => {
            assert.ok(result && result.length === 5, `Unexpected response from LN Backend [POST ${path}]: data length should be 5 but is ${result.length}`);
            const [invoiceHash, invoice, placeholder1, placeholder2, amount] = result;
            return {
                id: invoiceHash,
                invoice: invoice,
            };
        });
    }

    getInvoiceStatus(id) {
        return Promise.reject(new Error('Not supported by this LN service.'));
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

    validateResponseBody(body) {
        assert.ok(body.success !== false, body.message);
    }
};

Backend.prototype.generateAuthHeaders = function (path, body, apiSecret) {
    const nonce = (Date.now() * 1000).toString();
    let payload = `/api/${path}${nonce}${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha384', apiSecret).update(payload).digest('hex');
    return {
        'bfx-nonce': nonce,
        'bfx-signature': signature,
        // bfx-apikey is already set in the constructor.
    };
}

Backend.prototype.checkMethodErrorMessages = {
    payInvoice: {
        ok: [
            'Invalid payment request',
        ],
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
            default: 'api.bitfinex.com',
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
        {
            name: 'apiSecret',
            label: 'API Secret',
            type: 'text',
            placeholder: 'xxx',
            default: '',
            required: true,
        },
    ],
};

module.exports = Backend;
