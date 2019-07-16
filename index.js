var tester = require('acme-dns-01-test');

//var challenger = require('acme-dns-01-cli').create({});
var challenger = require('./stradge.js').create({
	YOUR_TOKEN_OPTION: 'SOME_API_KEY'
});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
var zone = 'example.com';

tester.testZone('dns-01', zone, challenger).then(function() {
	console.info('PASS');
});