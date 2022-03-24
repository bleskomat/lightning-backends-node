const assert = require('assert');
const url = require('url');
const { ValidationError } = require('@bleskomat/form');
const tlsCheck = require('./tlsCheck');

module.exports = [
	{
		name: 'lnd',
		label: 'Lightning Network Daemon (lnd)',
		inputs: [
			{
				name: 'baseUrl',
				label: 'Base URL',
				help: 'Base URL of your lnd node\'s REST API. Onion addresses are supported.',
				type: 'text',
				placeholder: 'https://127.0.0.1:8080',
				default: '',
				required: true,
				validate: function(value) {
					if (value) {
						let parsedUrl;
						try { parsedUrl = url.parse(value); } catch (error) {
							throw new ValidationError('"Base URL" must be a valid URL - e.g. https://127.0.0.1:8080');
						}
						const { hostname, protocol } = parsedUrl;
						assert.ok(hostname.substr(-6) === '.onion' || protocol === 'https:', new ValidationError('Except in the case of onion addresses, "Base URL" must use the https protocol.'));
					}
				},
			},
			{
				name: 'cert',
				label: 'TLS Certificate',
				help: 'Automatically retrieved from service at the URL provided above. Please check this against your lnd\'s tls.cert file.',
				type: 'textarea',
				default: '',
				readonly: true,
				required: function(data) {
					const { baseUrl } = data;
					return baseUrl && baseUrl.split('://')[0] === 'https';
				},
				validate: function(value, data) {
					if (value) {
						const { baseUrl } = data;
						if (baseUrl) {
							let parsedUrl;
							try { parsedUrl = url.parse(value); } catch (error) {
								// Base URL not valid. Skip this check.
							}
							const { hostname } = parsedUrl;
							return tlsCheck(hostname, {
								requestCert: false,
								rejectUnauthorized: true,
							}).then(result => {
								assert.ok(result.authorized, new ValidationError(`Unable to establish secure connection to ${hostname} with the provided TLS certificate`));
							});
						}
					}
				},
				rows: 4,
			},
			{
				name: 'fingerprint',
				label: 'Fingerprint (sha1)',
				type: 'text',
				default: '',
				disabled: true,
			},
			{
				name: 'fingerprint256',
				label: 'Fingerprint (sha256)',
				type: 'text',
				default: '',
				disabled: true,
			},
			{
				name: 'macaroon',
				label: 'Macaroon (hex)',
				help: 'Use `xxd -c 10000 -p -u ./admin.macaroon` to print a macaroon file as hexadecimal. The macaroon provided must have permission to pay invoices.',
				type: 'textarea',
				placeholder: '02EF72..',
				default: '',
				rows: 4,
				required: true,
			},
		],
	},
	{
		name: 'coinos',
		inputs: [
			{
				name: 'baseUrl',
				label: 'Base URL',
				help: 'Keep the default value unless you are hosting your own instance.',
				type: 'text',
				placeholder: 'https://coinos.io',
				default: 'https://coinos.io',
				required: true,
			},
			{
				name: 'jwt',
				label: 'JWT Auth Token',
				help: 'From your coinos wallet, go to "Settings" then "Auth keys" to view the "JWT Auth Token"',
				type: 'text',
				placeholder: 'xxx',
				default: '',
				required: true,
			},
		],
	},
	{
		name: 'lnbits',
		inputs: [
			{
				name: 'baseUrl',
				label: 'Base URL',
				help: 'Keep the default value unless you are hosting your own instance.',
				type: 'text',
				placeholder: 'https://legend.lnbits.com',
				default: 'https://legend.lnbits.com',
				required: true,
			},
			{
				name: 'adminKey',
				label: 'Admin Key',
				help: 'From an account page, open "API info" to view the "Admin key"',
				type: 'text',
				placeholder: 'xxx',
				default: '',
				required: true,
			},
		],
	},
	{
		name: 'lndhub',
		inputs: [
			{
				name: 'secret',
				label: 'Secret',
				help: 'If using BlueWallet, go to wallet then "Export/Backup" to view the secret',
				type: 'text',
				placeholder: 'lndhub://xxx:xxx@@https://lndhub.io',
				default: '',
				required: true,
			},
		],
	},
	{
		name: 'lnpay',
		inputs: [
			{
				name: 'hostname',
				label: 'Hostname',
				type: 'text',
				default: 'lnpay.co',
				required: true,
			},
			{
				name: 'apiKey',
				label: 'API Key',
				type: 'text',
				placeholder: 'sak_xxx',
				default: '',
				required: true,
			},
			{
				name: 'walletKey',
				label: 'Wallet Key',
				type: 'text',
				placeholder: 'waka_xxx',
				default: '',
				required: true,
			},
		],
	},
	{
		name: 'lntxbot',
		inputs: [
			{
				name: 'hostname',
				label: 'Hostname',
				type: 'text',
				default: 'lntxbot.com',
				required: true,
			},
			{
				name: 'adminKey',
				label: 'Admin Key',
				help: 'Open Telegram, open the chat with LNTXBOT, send message to the bot "/api_full"',
				type: 'text',
				placeholder: 'xxx',
				default: '',
				required: true,
			},
		],
	},
	{
		name: 'opennode',
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
	},
];
