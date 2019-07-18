# [acme-dns-01-route53](https://git.coolaj86.com/coolaj86/acme-dns-01-route53.js) | a [Root](https://rootprojects.org) project

AWS Route 53 + Let's Encrypt for Node.js

This handles ACME dns-01 challenges, compatible with ACME.js and Greenlock.js.
Passes [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js).

## Features

- Compatible
  - [x] Let's Encrypt v2.1 / ACME draft 18 (2019)
  - [x] Uses AWS SDK
  - [x] ACME.js, Greenlock.js, and others
  - [x] Quality
  - [x] Node v6 compatible
  - [x] Written in TypeScript

## Install

1. Install it
    ```bash
    npm install --save acme-dns-01-route53@3.x
    ```
2. Create an AWS IAM Policy with these permissions:
    - `GetChange`
    - `ListHostedZonesByName`
    - `ListResourceRecordSets`
    - `ChangeResourceRecordSets`
3. Create an AWS IAM User and assign the policy you created above to them.
4. Keep the Access key ID and the Secret access key handy (see Usage below)

## Usage

First you create an instance with your credentials:

```js
var dns01 = require('acme-dns-01-route53').create({
    AWS_ACCESS_KEY_ID: 'AKIA4R7OX2WJOI3BFFWZ', // change this to your own Access key ID
    AWS_SECRET_ACCESS_KEY: 'vYhnlu5o8nE9eYgIfIFVF0P4u2XUcSvULhIjvmR/', // change this to your own Secret access key
	// debug: true // enable this for detailed logs
	// ensureSync: true // AWS Route 53 does transactional changes which means it has a status of PENDING until in ensures that changes complete entirely on any individual DNS server, or not at all. You can force wait by setting this flag to true and it'll poll the changes until they're no longer pending. 
});
```

Then you can use it with any compatible ACME library,
such as Greenlock.js or ACME.js.

### Greenlock.js

```js
var Greenlock = require('greenlock-express');
var greenlock = Greenlock.create({
	challenges: {
		'dns-01': dns01
		// ...
	}
});
```

See [Greenlock Express](https://git.rootprojects.org/root/greenlock-express.js) and/or [Greenlock.js](https://git.rootprojects.org/root/greenlock.js) documentation for more details.

### ACME.js

```js
// TODO
```

See the [ACME.js](https://git.rootprojects.org/root/acme-v2.js) for more details.

## Development

This is implemented by implemeting these 5 methods:

- `init(config)`
- `zones(opts)` - return a list of zones available (e.g. ['example.com', 'mysite.com']) or empty array
- `set(opts)` - add a TXT record with name `opts.challenge.dnsPrefix` (or if the FQDN is require like for Route 53, `opts.challenge.dnsPrefix + '.' + opts.challenge.dnsZone`) and value `opts.challenge.dnsAuthorization`. Make sure you don't override existing values for the record but append.
- `get(opts)` - look at existing TXT records for the zone, and return `opts.challenge.dnsAuthorization` if it's found
- `remove(opts)` - remove TXT record with value `opts.challenge.dnsAuthorization`. Only remove the single value if the record has multiple values.

```js
dns01
	.set({
		identifier: { value: 'foo.example.co.uk' },
		wildcard: false,
		dnsZone: 'example.co.uk',
		dnsPrefix: '_acme-challenge.foo',
		dnsAuthorization: 'xxx_secret_xxx'
	})
	.then(function() {
		console.log('TXT record set');
	})
	.catch(function() {
		console.log('Failed to set TXT record');
	});
```

See [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js) for more implementation details.

### Tests

The best way to test your implementation is by creating a test harness like this:

```js
var tester = require('acme-dns-01-test'); // don't forget to npm install this

var challenger = require('./YOUR-CHALLENGE-STRATEGY').create({
	YOUR_TOKEN_OPTION: 'SOME_API_KEY'
});

// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
var zone = 'example.com';

tester.testZone('dns-01', zone, challenger).then(function() {
	console.info('PASS');
});
```

To run tests against this package, use this command:


```bash
npm run build && node ./test.js 'example.com' 'YOUR_AWS_ACCESS_KEY_ID' 'YOUR_AWS_SECRET_ACCESS_KEY'
```

This builds the TypeScript source first before running the test.



# Authors

- Gezim Hoxha

<!-- {{ if .Legal }} -->

# Legal

[acme-dns-01-route53](https://git.coolaj86.com/coolaj86/acme-dns-01-route53.js) | MPL-2.0 | [Terms of Use](https://therootcompany.com/legal/#terms) | [Privacy Policy](https://therootcompany.com/legal/#privacy)

Copyright 2019 The Root Group LLC

<!-- {{ end }} -->
