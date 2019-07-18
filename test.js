var tester = require('acme-dns-01-test');
var process = require('process');

if (process.argv.length < 5) {
  console.log('Please pass zone name, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY as arguments:')
  console.log("node ./test.js 'example.com' 'YOUR_AWS_ACCESS_KEY_ID' 'YOUR_AWS_SECRET_ACCESS_KEY'")
  return -1;
}

var challenger = require('./index.js').create({
    AWS_ACCESS_KEY_ID: process.argv[3],
    AWS_SECRET_ACCESS_KEY: process.argv[4],
    // debug: true,
    // ensureSync: true
});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
var zone = process.argv[2];

tester.testZone('dns-01', zone, challenger).then(function() {
	console.info('PASS');
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });