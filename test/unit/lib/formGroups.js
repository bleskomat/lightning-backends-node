const Form = require('@bleskomat/form');
const { formGroups } = require('../../../lib');

describe('formGroups', function() {

	it('sanity check', function() {
		form = new Form({ groups: formGroups });
	});
});
