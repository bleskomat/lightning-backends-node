const assert = require('assert');
const DummyLightningBackend = require('../../../lib/backends/dummy');
const { LightningBackend, prepareBackend } = require('../../../lib');
const path = require('path');

describe('prepareBackend(backend[, config])', function() {

	it('unknown backend', function() {
		assert.throws(() => prepareBackend('unknown'), {
			message: 'Unknown backend: "unknown"',
		});
	});

	it('returns lightning backend instance', function() {
		const ln = prepareBackend('dummy');
		assert.ok(ln instanceof LightningBackend);
		assert.ok(ln instanceof DummyLightningBackend);
		assert.strictEqual(ln.name, 'dummy');
	});

	it('backend as absolute file path', function() {
		const filePath = path.resolve(path.join(__dirname, '..', '..', '..', 'lib', 'backends', 'dummy.js'));
		const ln = prepareBackend(filePath);
		assert.ok(ln instanceof LightningBackend);
		assert.ok(ln instanceof DummyLightningBackend);
		assert.strictEqual(ln.name, 'dummy');
	});

	it('backend as relative file path', function() {
		const filePath = path.join('lib', 'backends', 'dummy.js');
		const ln = prepareBackend(filePath);
		assert.ok(ln instanceof LightningBackend);
		assert.ok(ln instanceof DummyLightningBackend);
		assert.strictEqual(ln.name, 'dummy');
	});
});
