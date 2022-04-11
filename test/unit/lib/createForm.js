const assert = require('assert');
const { createForm } = require('../../../lib');
const Form = require('@bleskomat/form');
const https = require('https');
const pem = require('pem')

describe('createForm(formOptions[, options])', function() {

	const exampleCert = '-----BEGIN CERTIFICATE-----\nMIICrzCCAZcCFFDhPp3zDg5GRAjhp6KQ81C2MrnrMA0GCSqGSIb3DQEBCwUAMBQx\nEjAQBgNVBAMMCWxvY2FsaG9zdDAeFw0yMjA0MTExMjQyMjdaFw0yMjA1MTExMjQy\nMjdaMBQxEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEP\nADCCAQoCggEBAOV4yJ5i4hkWH/R7ODV66LWq9ftQ2UXrc1GNUZZtrAlUzOxaB25T\nwkcnjFMT4WYVlw09oOZL/5+4mvajuhW0oN4LFrnZ87ZMT5SRV58sUAVLZSrd+bMD\nCwZrqOXfl2BxPFg8Ya3S4wT+bqCU+0Z4TvyjLBqyaRBPYvyb2iR5tY7ZNZgRv2Od\nfUk8CGjrRS6SZNOMY8EhaSy2tgqmr7j6nmrTj4Ybbe2LrupwfyHvsCJMfZopUEaA\n1TiwXL7gINx4nW0T9pLR3dy1DrEcXHO0z3Rh+caO2HYvXn2C15CPgWrO0crjrekH\nOyndLo0m8kqR/WC+BsZilFsdXRSzugmQpgkCAwEAATANBgkqhkiG9w0BAQsFAAOC\nAQEAwZcB3whFk28SlIdim2I2CUSWpMwodtDRZEGFE5Kt0NftxS+ZO91a8ZSKelir\njQ77YblnAu5w351N7Cu0X77mJpawoCcx6qjbJBsuyMXA38UOnzcKZwdmni9WJYn5\nPoRszIfCGB4KIHZeuxFjR5Za6FM7gRlqa1PwoytKiQ1Dlt9aDgzKPocFHjCieoh2\n4OL0aXtl2y9LYRDNPFftsMPvd3duROzD+xFOKkTcztG+gSa496VDgzSd3EpASNln\nTVI7izt6KvWGGk2EYLXZ5JVuGxSBaUOHN+Xmod2yqRE6IvgDswZe9zl2OIMTj0Ga\ngvg/oDvZxopLoLKnwZBl7xc1tg==\n-----END CERTIFICATE-----';;

	it('sanity check', function() {
		const form = createForm();
		assert.ok(form instanceof Form);
	});

	describe('process', function() {

		[
			{
				backend: 'lnd',
				formData: {
					'lnd[baseUrl]': 'https://127.0.0.1:8080',
					'lnd[cert]': exampleCert,
					'lnd[macaroon]': 'XXX',
				},
				expectedLightningObject: {
					backend: 'lnd',
					config: {
						baseUrl: 'https://127.0.0.1:8080',
						cert: { data: exampleCert },
						macaroon: { data: 'XXX' },
					},
				},
			},
			{
				backend: 'c-lightning-sparko',
				formData: {
					'c-lightning-sparko[baseUrl]': 'https://127.0.0.1:8080',
					'c-lightning-sparko[cert]': exampleCert,
					'c-lightning-sparko[accessKey]': 'XXX',
				},
				expectedLightningObject: {
					backend: 'c-lightning-sparko',
					config: {
						baseUrl: 'https://127.0.0.1:8080',
						cert: exampleCert,
						accessKey: 'XXX',
					},
				},
			},
		].forEach(test => {

			const { backend, expectedLightningObject, formData } = test;

			it('returns expected values object', function() {
				const form = createForm();
				const data = Object.assign({ backend }, formData);
				const values = form.process(data);
				Object.entries(data).forEach(([key, value], index) => {
					assert.strictEqual(values[key], data[key], `Expected values['${key}'] to equal data['${key}']`);
				});
				assert.deepStrictEqual(values.lightning, expectedLightningObject);
			});;
		});
	});

	describe('validation', function() {

		it('backend required', function() {
			const form = createForm();
			const data = {};
			return assert.rejects(() => form.validate(data), {
				message: '"Lightning Backend Type" is required',
			});
		});

		[
			{
				backend: 'lnd',
				host: '127.0.0.1',
				port: 18080,
				sampleFailureResponse: '{"payment_error":"no_route"}',
				requiredFormData: {
					'lnd[macaroon]': 'XXX',
				},
			},
			{
				backend: 'c-lightning-sparko',
				host: '127.0.0.1',
				port: 19737,
				sampleFailureResponse: '{"code":-1,"message":"not reachable directly and all routehints were unusable"}',
				requiredFormData: {
					'c-lightning-sparko[accessKey]': 'XXX',
				},
			},
		].forEach(test => {

			const { backend, host, port, sampleFailureResponse, requiredFormData } = test;

			describe(backend, function() {

				let form;
				before(function() {
					form = createForm();
				});

				let httpsServer;
				before(function(done) {
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
							res.end(`\n${sampleFailureResponse}`);
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
					let data = Object.assign({ backend }, requiredFormData);
					data[`${backend}[baseUrl]`] = `http://${httpsServer.hostname}`;
					return assert.rejects(() => form.validate(data), {
						message: 'Except in the case of onion addresses, \"Base URL\" must use the https protocol.',
					});
				});

				it('cert required when Base URL uses https', function() {
					let data = Object.assign({ backend }, requiredFormData);
					data[`${backend}[baseUrl]`] = `https://${httpsServer.hostname}`;
					return assert.rejects(() => form.validate(data), {
						message: '"TLS Certificate" is required',
					});
				});

				it('onion address', function() {
					let data = Object.assign({ backend }, requiredFormData);
					data[`${backend}[baseUrl]`] = 'http://esdlkvxdkwxz6yqs6rquapg4xxt4pt4guj24k75pdnquo5nau135ugyd.onion';
					return assert.rejects(() => form.validate(data), {
						message: 'Failed test of Lightning configurations: "Socks5 proxy rejected connection - Failure"',
					});
				});

				it('tls connection failure', function() {
					let data = Object.assign({ backend }, requiredFormData);
					data[`${backend}[baseUrl]`] = `https://${httpsServer.hostname}`;
					data[`${backend}[cert]`] = exampleCert;
					return assert.rejects(() => form.validate(data), {
						message: `Unable to establish secure connection to ${httpsServer.hostname} with the provided TLS certificate`,
					});
				});

				it('tls connection OK', function() {
					let data = Object.assign({ backend }, requiredFormData);
					data[`${backend}[baseUrl]`] = `https://${httpsServer.hostname}`;
					data[`${backend}[cert]`] = httpsServer.cert;
					return form.validate(data);
				});
			});
		});
	});

	describe('exclude', function() {

		it('omits backends in exclude array', function() {
			const options = {
				exclude: ['dummy', 'c-lightning'],
			};
			const form = createForm({}, options);
			const backendInput = form.inputs.find(input => input.name === 'backend');
			options.exclude.forEach(name => {
				assert.ok(!backendInput.options.find(option => option.key === name));
				assert.ok(!form.options.groups.find(group => group.name === name));
			});
		});
	});
});
