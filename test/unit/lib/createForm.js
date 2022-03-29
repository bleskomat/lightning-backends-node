const assert = require('assert');
const { createForm } = require('../../../lib');
const Form = require('@bleskomat/form');
const https = require('https');
const pem = require('pem')

describe('createForm', function() {

	let exampleCert;
	before(function(done) {
		pem.createCertificate({
			selfSigned: true,
			days: 30,
		}, (error, result) => {
			if (error) return done(error);
			exampleCert = result.certificate;
			done();
		});
	})


	it('sanity check', function() {
		const form = createForm();
		assert.ok(form instanceof Form);
	});

	it('process', function() {
		const form = createForm();
		const data = {
			backend: 'lnd',
			'lnd[baseUrl]': 'https://127.0.0.1:8080',
			'lnd[cert]': exampleCert,
			'lnd[macaroon]': 'XXX',
		};
		const values = form.process(data);
		assert.strictEqual(values['backend'], data.backend);
		assert.strictEqual(values['lnd[baseUrl]'], data['lnd[baseUrl]']);
		assert.strictEqual(values['lnd[cert]'], data['lnd[cert]']);
		assert.strictEqual(values['lnd[macaroon]'], data['lnd[macaroon]']);
		assert.deepStrictEqual(values.lightning, {
			backend: data.backend,
			config: {
				baseUrl: data['lnd[baseUrl]'],
				cert: { data: data['lnd[cert]'] },
				macaroon: { data: data['lnd[macaroon]'] },
			},
		});
	})

	describe('validation', function() {

		it('backend required', function() {
			const form = createForm();
			const data = {};
			return assert.rejects(() => form.validate(data), {
				message: '"Lightning Backend Type" is required',
			});
		});

		describe('lnd', function() {

			let form;
			before(function() {
				form = createForm();
			});

			let httpsServer;
			before(function(done) {
				const host = '127.0.0.1';
				const port = 18080;
				const hostname = `${host}:${port}`;
				pem.createCertificate({
					selfSigned: true,
					days: 30,
					altNames: [ host ],
				}, (error, result) => {
					if (error) return done(error);
					const key = result.serviceKey;
					const cert = result.certificate;
					httpsServer = https.createServer({ key, cert }, (req, res) => {
						res.end('\n{"payment_error":"no_route"}');
					}).listen(port, host, () => done());
					httpsServer.hostname = hostname;
					httpsServer.cert = cert;
				});
			});

			after(function(done) {
				if (httpsServer) return httpsServer.close(done);
				done();
			});

			it('https required', function() {
				const data = {
					backend: 'lnd',
					'lnd[baseUrl]': `http://${httpsServer.hostname}`,
				};
				return assert.rejects(() => form.validate(data), {
					message: 'Except in the case of onion addresses, \"Base URL\" must use the https protocol.',
				});
			});

			it('cert required when Base URL uses https', function() {
				const data = {
					backend: 'lnd',
					'lnd[baseUrl]': `https://${httpsServer.hostname}`,
					'lnd[macaroon]': 'XXX',
				};
				return assert.rejects(() => form.validate(data), {
					message: '"TLS Certificate" is required',
				});
			});

			it('onion address', function() {
				const data = {
					backend: 'lnd',
					'lnd[baseUrl]': 'http://esdlkvxdkwxz6yqs6rquapg4xxt4pt4guj24k75pdnquo5nau135ugyd.onion',
					'lnd[macaroon]': 'XXX',
				};
				return assert.rejects(() => form.validate(data), {
					message: 'Failed test of Lightning configurations: "Socks5 proxy rejected connection - Failure"',
				});
			});

			it('tls connection failure', function() {
				const data = {
					backend: 'lnd',
					'lnd[baseUrl]': `https://${httpsServer.hostname}`,
					'lnd[cert]': exampleCert,
					'lnd[macaroon]': 'XXX',
				};
				return assert.rejects(() => form.validate(data), {
					message: `Unable to establish secure connection to ${httpsServer.hostname} with the provided TLS certificate`,
				});
			});

			it('tls connection OK', function() {
				const data = {
					backend: 'lnd',
					'lnd[baseUrl]': `https://${httpsServer.hostname}`,
					'lnd[cert]': httpsServer.cert,
					'lnd[macaroon]': 'XXX',
				};
				return form.validate(data);
			});
		});
	});
});
