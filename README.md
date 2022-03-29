# lightning-backends

![Build Status](https://github.com/bleskomat/lightning-backends-node/actions/workflows/tests.yml/badge.svg)

Node.js module to integrate with various Lightning Network node software and service providers.

* [List of Backends](#list-of-backends)
* [Installation](#installation)
* [Usage](#usage)
	* [Backend Configuration Options](#backend-configuration-options)
	* [Custom Backend](#custom-backend)
* [Tests](#tests)
* [Changelog](#changelog)
* [License](#license)


## List of Backends

The following list includes all the Lightning Network node software and service providers which are supported:
* [Lightning Network Daemon (lnd)](https://github.com/LightningNetwork/lnd)
* [coinos](https://coinos.io/home)
* [lnbits](https://github.com/lnbits/lnbits-legend)
* [lndhub](https://github.com/BlueWallet/LndHub)
* [lnpay](https://lnpay.co/)
* [lntxbot](https://github.com/fiatjaf/lntxbot)
* [opennode](https://www.opennode.com/)


## Installation

Add to your application via `npm`:
```bash
npm install lightning-backends
```


## Usage

```js
const { checkBackend, prepareBackend } = require('lightning-backends');

const backend = 'lnd';
const config = {
	hostname: '127.0.0.1:8080',
	protocol: 'https',
	cert: '/path/to/lnd/tls.cert',
	macaroon: '/path/to/lnd/admin.macaroon',
};

const ln = prepareBackend(backend, config);

// Pay a Lightning invoice.
ln.payInvoice(invoice).then(() => {
	// `{ id: null }`
	// `{ id: 'custom-unique-identifier' }`
	console.log('payInvoice OK', { result });
}).catch(error => {
	console.error('payInvoice FAILED:', { error });
});

// Request a new Lightning invoice from the backend.
ln.addInvoice(21000/* msat */).then(() => {
	// `{ id: null, invoice: <bolt11-invoice> }`
	// `{ id: 'custom-unique-identifier', invoice: <bolt11-invoice> }`
	console.log('addInvoice OK', { result });
}).catch(error => {
	console.error('addInvoice FAILED:', { error });
});

// Get the current status of an invoice by its payment hash or unique identifier.
// Some backends require the use of a unique identifier instead of payment hash.
// If the `addInvoice` method returns an `id` then use tha instead of the payment hash here.
ln.getInvoiceStatus(paymentHash).then(() => {
	// `{ preimage: null, settled: false }`
	// `{ preimage: '23b1a130cdc61f869674fdc4a64e8de5da1d4666', settled: true }`
	console.log('getInvoiceStatus OK', { result });
}).catch(error => {
	console.error('getInvoiceStatus FAILED:', { error });
});

// Open a new channel.
// Most backends do not support this method.
ln.openChannel(remoteId, localAmt, pushAmt, makePrivate).then(() => {
	// `result` can vary depending upon the backend used.
	console.log('openChannel OK', { result });
}).catch(error => {
	console.error('openChannel FAILED:', { error });
});

// Attempt to pay a 1000 msat invoice for a randomly generated node private key.
// Since the node doesn't exist, it will always fail.
// If the error is "no_route" or some other similar error, then the check is passed.
// Failed authentication or any unexpected errors are considered a failed check.
checkBackend(backend, config, { method: 'payInvoice' }).then(result => {
	console.log('Backend configuration check', result.ok ? 'OK' : 'FAILED', { result });
});
```


### Backend Configuration Options

Lightning Network Daemon (lnd):
* __hostname__ - `String` - e.g. `'127.0.0.1:8080'` - onion addresses are supported
* __protocol__ - `String` - e.g. `'https'` - Protocol of HTTP request (can be "http" or "https").
* __baseUrl__ - `String` - e.g. `'https://127.0.0.1:8080/custom/path'` - Can be used instead of the hostname and protocol options above.
* __cert__ - `String`, `Object`, or `Buffer` - e.g. `'/path/to/lnd/tls.cert'` or `{ data: 'STRING_UTF8_ENCODED' }` or `{ data: Buffer.from('STRING_UTF8_ENCODED', 'utf8') }`
* __macaroon__ - `String`, `Object`, or `Buffer` - e.g. `'/path/to/lnd/admin.macaroon'` or `{ data: 'STRING_UTF8_ENCODED' }` or `{ data: Buffer.from('STRING_UTF8_ENCODED', 'utf8') }`
* __torSocksProxy__ - `String` - e.g. `'127.0.0.1:9050'` - If hostname contains an onion address, the backend will try to connect to it using the the TOR socks proxy.

coinos:
* __baseUrl__ - `String` - e.g. `'https://coinos.io'`
* __jwt__ - `String` - From your coinos wallet, go to "Settings" -> "Auth keys" to view the "JWT Auth Token".

lnbits:
* __baseUrl__ - `String` - e.g. `'https://legend.lnbits.com'`
* __adminKey__ - `String` - From an account page, open "API info" to view the "Admin key".

lndhub:
* __secret__ - `String` - e.g. `'lndhub://login:password@baseurl'` - If using BlueWallet, go to wallet then "Export/Backup" to view the secret.

lnpay:
* __apiKey__ - `String`
* __walletKey__ - `String`

lntxbot:
* __adminKey__ - `String` - Open Telegram, open the chat with LNTXBOT, send message to the bot "/api_full".

opennode:
* __apiKey__ - `String` - Open Telegram, open the chat with LNTXBOT, send message to the bot "/api_full".



#### Custom Backend

It is possible to define your own custom backend to use with this module. To do so, create a new file and save it in your project:
```js
// ./backends/custom.js

const { LightningBackend } = require('lightning-backends/lib');

class Backend extends LightningBackend {

	static name = 'custom';

	constructor(options) {
		super(Backend.name, options, {
			defaultOptions: {
				nodeUri: null,
			},
			requiredOptions: ['nodeUri'],
		});
	}

	checkOptions(options) {
		// This is called by the constructor.
		// Throw an error if any problems are found with the given options.
	}

	getNodeUri() {
		return Promise.resolve(this.options.nodeUri);
	}

	openChannel(remoteId, localAmt, pushAmt, makePrivate) {
		return Promise.reject('Not implemented');
	}

	payInvoice(invoice) {
		return Promise.reject('Not implemented');
	}

	addInvoice(amount, extra) {
		return Promise.reject('Not implemented');
	}

	getInvoiceStatus(paymentHash) {
		return Promise.reject('Not implemented');
	}
};

module.exports = Backend;
```
Then to use your custom backend:
```js
const { prepareBackend } = require('lightning-backends');

const backend = './backends/custom.js';
const config = {};

const ln = prepareBackend(backend, config);

ln.payInvoice(invoice).then(() => {
	console.log('payInvoice OK', { result });
}).catch(error => {
	console.error('payInvoice FAILED:', { error });
});
```


## Tests

Run automated tests as follows:
```bash
npm test
```


## Changelog

See [CHANGELOG.md](https://github.com/bleskomat/lightning-backends-node/blob/master/CHANGELOG.md)


## License

This software is [MIT licensed](https://tldrlegal.com/license/mit-license):
> A short, permissive software license. Basically, you can do whatever you want as long as you include the original copyright and license notice in any copy of the software/source.  There are many variations of this license in use.
