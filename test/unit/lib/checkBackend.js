const assert = require('assert');
const { checkBackend } = require('../../../lib');

describe('checkBackend(backend[, config[, options]])', function() {

	it('payInvoice ok', function() {
		return checkBackend('dummy', { alwaysFail: false }).then(result => {
			assert.ok(result);
			assert.strictEqual(typeof result, 'object');
			assert.ok(result.ok);
			assert.strictEqual(typeof result.message, 'undefined');
		});
	});

	it('payInvoice notOk', function() {
		return checkBackend('dummy', { alwaysFail: true }).then(result => {
			assert.ok(result);
			assert.strictEqual(typeof result, 'object');
			assert.ok(!result.ok);
			assert.strictEqual(result.message, 'payInvoice failure');
		});
	});
});
