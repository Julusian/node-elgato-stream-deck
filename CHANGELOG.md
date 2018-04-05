# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.1.1"></a>
## [2.1.1](https://github.com/Lange/node-elgato-stream-deck/compare/v2.1.0...v2.1.1) (2018-04-05)


### Bug Fixes

* **package:** pin node-hid to 0.6.0 ([de5186a](https://github.com/Lange/node-elgato-stream-deck/commit/de5186a)), closes [#46](https://github.com/Lange/node-elgato-stream-deck/issues/46)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/Lange/node-elgato-stream-deck/compare/v2.0.0...v2.1.0) (2018-03-05)


### Features

* **package:** eliminate the need for compilation of dependencies on most platforms ([9e5f338](https://github.com/Lange/node-elgato-stream-deck/commit/9e5f338))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/Lange/node-elgato-stream-deck/compare/v1.2.0...v2.0.0) (2017-11-28)

### Features

* add `fillPanel` method
* add `clearAllKeys` method
* return the `StreamDeck` constructor instead of automatically instantiating it
* allow providing a `devicePath` to the constructor
  * if no device path is provided, will attempt to use the first found Stream Deck. Errors if no Stream Decks are connected.
* update `this.keyState` *before* emitting `down` and `up` events
  * this is technically a *breaking change*, but is very unlikely to affect any production code

### Bug Fixes

* fix center-cropping in `fillImageFromFile`
* fix `sharp` only being a `devDependency`, and not a production `dependency`

### Code Refactoring
* refactor `StreamDeck` class to move as much as possible to static methods and static getters
* refactor code to use `async`/`await`
  * this is a *breaking change*, because we now only support Node.js v7.6 or newer

### Documentation

* update all examples
* add `fillPanel` example

### BREAKING CHANGES

* `this.keyState` is now updated **before** `down` and `up` events are emitted.
* Support for versions of Node.js earlier than 7.6 has been dropped.
* The `StreamDeck` constructor is now required when `require`ing this library, instead of an instance of the class.
	* See the docs for updated examples.



<a name="1.2.0"></a>
# [1.2.0](https://github.com/Lange/node-elgato-stream-deck/compare/v1.1.0...v1.2.0) (2017-06-23)


### Features

* add `clearKey` method #4
* add Typescript typings #13
* add `setBrightness` and `sendFeatureReport` [4d904f0](https://github.com/Lange/node-elgato-stream-deck/commit/4d904f0c7d40154186914599d877b5879179d48b)

### Bug Fixes

* throw an error when no stream decks are present [c44a1bf](https://github.com/Lange/node-elgato-stream-deck/commit/c44a1bf3ae51bfdc7e9963f131a2ce02746b2975
)
* fix device detection on linux [e0b128c](https://github.com/Lange/node-elgato-stream-deck/commit/e0b128c82aa6e5075e3f8a77d9fca43103b83bc4)
* `fillImage` fix blue and red channels being swapped [8efdb6b](https://github.com/Lange/node-elgato-stream-deck/commit/8efdb6bf0cb1fde3920c850c6b57d25e56648e09)

### Misc

* Full test coverage 

<a name="1.1.0"></a>
# [1.1.0](https://github.com/Lange/node-elgato-stream-deck/compare/v1.0.0...v1.1.0) (2017-05-18)


### Features

* add `write` method ([0085d87](https://github.com/Lange/node-elgato-stream-deck/commit/0085d87))
* add `fillColor`, `fillImage`, and `fillImageFromFile` methods ([5fe46ef](https://github.com/Lange/node-elgato-stream-deck/commit/5fe46ef))



<a name="1.0.0"></a>
# 1.0.0 (2017-05-17)

Initial release.
