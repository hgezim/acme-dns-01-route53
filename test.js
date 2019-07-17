var tester = require('acme-dns-01-test');

//var challenger = require('acme-dns-01-cli').create({});
var challenger = require('./index.js').create({
    AWS_ACCESS_KEY_ID: 'AKIA4R7OX2WJOI3BFFWZ',
    AWS_SECRET_ACCESS_KEY: 'vYhnlu5o8nE9eYgIfIFVF0P4u2XUcSvULhIjvmR/',
    // debug: true
});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
var zone = 'myrecipepage.com';

tester.testZone('dns-01', zone, challenger).then(function() {
	console.info('PASS');
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });