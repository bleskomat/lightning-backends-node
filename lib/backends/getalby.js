const LndHubBackend = require('./lndhub');

class Backend extends LndHubBackend {
	static name = 'getalby';
};

Backend.form = {
	label: 'GetAlby',
	inputs: [
		{
			name: 'secret',
			label: 'Connection Credentials',
			help: 'Go to the GetAlby website, login to your account (link in top-right corner), then go to "Wallet" page (top-center), then scroll down until you see "Show your connection credentials". Click that button to reveal your lndhub secret. Copy and paste it here.',
			type: 'password',
			placeholder: 'lndhub://xxx:xxx@https://ln.getalby.com',
			default: '',
			required: true,
		},
	],
};

Backend.prototype.checkMethodErrorMessages = {
	payInvoice: {
		ok: [
			'Payment failed',
		],
		notOk: [
			'Socks5 proxy rejected connection - Failure',
			'bad auth',
			'Invalid option',
		],
	},
};

module.exports = Backend;
