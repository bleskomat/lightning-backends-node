# Changelog

* v1.4.0:
	* Added form.js which does TLS check (lnd, c-lightning-sparko) and toggling visibility of backend form fields
	* New option for createForm method ("exclude")
* v1.3.0:
	* Added getBalance method to all LN backends
* v1.2.0:
	* Added C-Lightning backend - JSON-RPC over unix sock or HTTP-RPC made available by Sparko plugin
* v1.1.1:
	* Added missing form inputs
	* Fix mutation of check method error messages on backend prototypes
* v1.1.0:
	* Form-related helpers and improvements
* v1.0.2:
	* Support backend = { path: '/full/path/to/backend.js' }
* v1.0.1:
	* Minor fixes related to formGroups
* v1.0.0:
	* Initial release
