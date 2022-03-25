const assert = require('assert');
const Form = require('@bleskomat/form');
const { formGroups } = require('../../../lib');

describe('formGroups', function() {

	it('sanity check', function() {
		new Form({ groups: formGroups });
	});

	describe('validation', function() {

		describe('lnd', function() {

			const group = formGroups.find(group => group.name === 'lnd');
			const form = new Form({ groups: [ group ] });

			it('https required', function() {
				const baseUrl = 'http://127.0.0.1:8080';
				return assert.rejects(() => form.validate({ baseUrl }), {
					message: 'Except in the case of onion addresses, \"Base URL\" must use the https protocol.',
				});
			});

			it('onion address', function() {
				const baseUrl = 'http://esdlkvxdkwxz6yqs6rquapg4xxt4pt4guj24k75pdnquo5nau135ugyd.onion';
				const macaroon = 'XXX';
				return form.validate({ baseUrl, macaroon });
			});

			it('failed tls connection', function() {
				const host = '127.0.0.1:8080';
				const baseUrl = `https://${host}`;
				const cert = '-----BEGIN CERTIFICATE-----\nMIICKjCCAdCgAwIBAgIQPhR+xktMPKgHgVDI3AVZVjAKBggqhkjOPQQDAjA4MR8w\nHQYDVQQKExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRUwEwYDVQQDEww3NzhiOTYy\nOGRlZjUwHhcNMjEwODAxMTUyNzU5WhcNMjIwOTI2MTUyNzU5WjA4MR8wHQYDVQQK\nExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRUwEwYDVQQDEww3NzhiOTYyOGRlZjUw\nWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATWzshXeTA8h7x7LokfqkRNKa7x6oHx\nI6MesaUvRCB0plcwvG7W81i7q+u1GboPc5r879JB7X2U/zIVpCEhrfFio4G7MIG4\nMA4GA1UdDwEB/wQEAwICpDATBgNVHSUEDDAKBggrBgEFBQcDATAPBgNVHRMBAf8E\nBTADAQH/MB0GA1UdDgQWBBSDTfvu9v2CcYv85cgdbOewyLb4TzBhBgNVHREEWjBY\nggw3NzhiOTYyOGRlZjWCCWxvY2FsaG9zdIIEdW5peIIKdW5peHBhY2tldIIHYnVm\nY29ubocEfwAAAYcQAAAAAAAAAAAAAAAAAAAAAYcErBUABIcEp2PSDTAKBggqhkjO\nPQQDAgNIADBFAiBG2ihLZAInqyj5wRgs2K0O4NYE4TItngzWuRNruVLkQgIhAJR7\nPTKWMnmdeoywfmzibF2I+mfP5j20++20k4Br5G1w\n-----END CERTIFICATE-----';
				const macaroon = 'XXX';
				return assert.rejects(() => form.validate({ baseUrl, cert, macaroon }), {
					message: `connect ECONNREFUSED ${host}`,
				});
			});
		});
	});
});
