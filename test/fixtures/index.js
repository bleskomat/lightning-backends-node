const fs = require('fs');
const path = require('path');

module.exports = {
	cert: fs.readFileSync(path.join(__dirname, 'cert.pem')).toString(),
	key: fs.readFileSync(path.join(__dirname, 'key.pem')).toString(),
};
