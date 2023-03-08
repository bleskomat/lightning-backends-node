const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs').promises;
const https = require('https');
const path = require('path');
const { tlsCheck } = require('../../../lib');

describe('tlsCheck(host[, options])', function() {

	describe('service with self-signed TLS certificate', function() {

		const host = '127.0.0.1';
		const port = 18080;
		const hostname = `${host}:${port}`;
		let key, cert;
		before(function() {
			key = this.fixtures.key;
			cert = this.fixtures.cert;
		});

		let server;
		before(function(done) {
			server = https.createServer({ key, cert }).listen(port, host, () => done());
		});

		after(function(done) {
			if (server) return server.close(done);
			done();
		});

		it('returns PEM-encoded certificate and fingerprints', function() {
			return tlsCheck(hostname).then(result => {
				assert.strictEqual(typeof result, 'object');
				assert.strictEqual(result.authorized, false);
				assert.strictEqual(result.pem, cert.trim());
				assert.strictEqual(result.fingerprint, fingerprint(cert, 'sha1'));
				assert.strictEqual(result.fingerprint256, fingerprint(cert, 'sha256'));
			});
		});
	});
});

const fingerprint = function(certificate, algorithm) {
	certificate = certificate.trim();
	const hash = crypto.createHash(algorithm);
	const lines = certificate.split('\n');
	const der = Buffer.from(lines.slice(1, lines.length - 1).join(''), 'base64');
	hash.update(der);
	const digest = hash.digest('hex').toUpperCase();
	let fingerprint = [];
	for (let index = 0; index < digest.length; index += 2) {
		fingerprint.push(digest[index] + digest[index + 1]);
	}
	return fingerprint.join(':');
};
