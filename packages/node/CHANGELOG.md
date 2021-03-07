# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v4.0.0...v5.0.0) (2021-03-07)

This is a major overhaul of [elgato-stream-deck](https://npmjs.com/package/elgato-stream-deck) to allow for support for webhid to be added cleanly.
The major changes are listed below, and should be reviewed when updating.

The most notable changes are the api now returns promises for every operation, and various methods have been renamed to be more consistent

### Features
* convert most methods to return promises, as webhid uses them even though node-hid doesnt. ([7b1883b](https://github.com/julusian/node-elgato-stream-deck/commit/7b1883be9ff91293aeef95cd1c0f087d795a4fb1))
* lerna ([c942fb9](https://github.com/julusian/node-elgato-stream-deck/commit/c942fb970727944eb3b614b98fd996f2531b0c53))
* publish demo to github pages ([44428a2](https://github.com/julusian/node-elgato-stream-deck/commit/44428a23619538de9de5a50975e30a6957efc44b))
* refactor into a separate node package ([0e68e20](https://github.com/julusian/node-elgato-stream-deck/commit/0e68e206acf99024fa3673a3c8c26a52b08f83b1))
* remove exit-hook due to it potentially 'claiming' error handling ([a4aca6b](https://github.com/julusian/node-elgato-stream-deck/commit/a4aca6bb14d0cdbf3e0ac4d01b016b5e85e32890))
* use eventemitter3 instead of node eventemitter ([31e6bc3](https://github.com/julusian/node-elgato-stream-deck/commit/31e6bc300c963d45c103fa0de9788c458637c684))
* rename api methods to be clearer ([e8777bb](https://github.com/julusian/node-elgato-stream-deck/commit/e8777bbb3ac5b549d91f9062dd8b3e1a4b28021b))
