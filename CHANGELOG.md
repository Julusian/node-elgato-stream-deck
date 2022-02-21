# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.3.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.2.0...v5.3.0) (2022-02-21)


### Features

* allow the original 15 key to be used in webhid ([7ff5624](https://github.com/julusian/node-elgato-stream-deck/commit/7ff562446b77d17b119f27570937513f02338f28))
* use hidraw backend on linux, as modern (2 year old) kernels support it for all models now ([596e426](https://github.com/julusian/node-elgato-stream-deck/commit/596e426da1d67c268056bd5b37730d13bbc569f1))





# [5.2.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.2.0-alpha.1...v5.2.0) (2022-01-25)

**Note:** Version bump only for package elgato-stream-deck-packages





# [5.2.0-alpha.1](https://github.com/julusian/node-elgato-stream-deck/compare/v5.2.0-alpha.0...v5.2.0-alpha.1) (2022-01-19)

**Note:** Version bump only for package elgato-stream-deck-packages





# [5.2.0-alpha.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.1.2...v5.2.0-alpha.0) (2022-01-18)


### Features

* add method to get info about a hid device, if it is a streamdeck ([1791e37](https://github.com/julusian/node-elgato-stream-deck/commit/1791e370e830c0fff7e3169e30cb0871675fdf86))
* add PRODUCT_NAME property ([fbe3d14](https://github.com/julusian/node-elgato-stream-deck/commit/fbe3d1476e5ce2c472cc738e0694c968a558e102))





## [5.1.2](https://github.com/julusian/node-elgato-stream-deck/compare/v5.1.1...v5.1.2) (2021-12-02)


### Bug Fixes

* fillPanelBuffer not waiting for write [#28](https://github.com/julusian/node-elgato-stream-deck/issues/28) ([020a047](https://github.com/julusian/node-elgato-stream-deck/commit/020a047dceb8816f5b884d1aef3de07482c5d8c3))





## [5.1.1](https://github.com/julusian/node-elgato-stream-deck/compare/v5.1.0...v5.1.1) (2021-07-19)


### Bug Fixes

* mk2 is different to v2 ([71feace](https://github.com/julusian/node-elgato-stream-deck/commit/71feace86e0c097ea2b375b4981c252628f7eb4b))





# [5.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.0.0...v5.1.0) (2021-07-19)


### Features

* support streamdeck mk2 (15 key, new style) ([a239503](https://github.com/julusian/node-elgato-stream-deck/commit/a239503b2edf7d4a6dae780ffa5e7dfe481d8cd8))





# [5.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v4.0.0...v5.0.0) (2021-03-07)

This is a major overhaul of the library to allow for support for webhid to be added cleanly.
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




### [4.0.1](https://github.com/julusian/node-elgato-stream-deck/compare/v4.0.0...v4.0.1) (2021-01-07)


### Bug Fixes

* don't require tslib in generated code ([69e1dfe](https://github.com/julusian/node-elgato-stream-deck/commit/69e1dfeda180ff0a04d0c82956bfe0e455b7f54a))

## [4.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v3.3.5...v4.0.0) (2020-12-23)

### BREAKING CHANGES

-   Drop support for node 8 or older

### Features

-   support for buffers in any of rgb, rgba, bgr or bgra ([088d979](https://github.com/julusian/node-elgato-stream-deck/commit/088d979821d5614c0a751cfb594f7da936238552))

### Bug Fixes

-   broken text-generation example ([364f6de](https://github.com/julusian/node-elgato-stream-deck/commit/364f6de8ca83bfa89138f65bea31a01af42cd108))
-   dependencies too new for node8 ([875f5bd](https://github.com/julusian/node-elgato-stream-deck/commit/875f5bd9a215310610ad3a8b06173a4aa8b3f7ff))

### [3.3.5](https://github.com/julusian/node-elgato-stream-deck/compare/v3.3.3...v3.3.5) (2020-12-08)

### [3.3.3](https://github.com/julusian/node-elgato-stream-deck/compare/v3.3.2...v3.3.3) (2020-12-04)

### [3.3.2](https://github.com/julusian/node-elgato-stream-deck/compare/v3.3.1...v3.3.2) (2020-08-28)

### [3.3.1](https://github.com/julusian/node-elgato-stream-deck/compare/v3.3.0...v3.3.1) (2020-07-18)

### Bug Fixes

-   only audit dependencies ([60e7cca](https://github.com/julusian/node-elgato-stream-deck/commit/60e7ccabfb1f655829b55a255c8d2062bdb3a4c0))
-   only audit dependencies ([60e7cca](https://github.com/julusian/node-elgato-stream-deck/commit/60e7ccabfb1f655829b55a255c8d2062bdb3a4c0))
-   trim the serial number to 12 characters, as it always is currently ([d371654](https://github.com/julusian/node-elgato-stream-deck/commit/d371654df32f7e7bf07e9ce1c0fc14c7876799b4))
-   trim the serial number to 12 characters, as it always is currently ([d371654](https://github.com/julusian/node-elgato-stream-deck/commit/d371654df32f7e7bf07e9ce1c0fc14c7876799b4))

## [3.3.0](https://github.com/julusian/node-elgato-stream-deck/compare/v3.2.0...v3.3.0) (2020-02-16)

### Features

-   pass buffers to node-hid ([d371969](https://github.com/julusian/node-elgato-stream-deck/commit/d371969be44e247c97e8f40e5b0b5f00bffc982a))
-   upgrade jpeg-turbo and expose quality options ([344254a](https://github.com/julusian/node-elgato-stream-deck/commit/344254ae72119f34146dda4d30959ed7e65d19a4))

### Bug Fixes

-   optimise buffer transform/color conversion ([c5987ac](https://github.com/julusian/node-elgato-stream-deck/commit/c5987ac4783634282a1db132f8b38e93d9497ade))
-   remove dependency on node-hid typings for library users ([f83ae99](https://github.com/julusian/node-elgato-stream-deck/commit/f83ae990bf6208fd6efa6ec2235d6712b69f5a33))
-   tests ([b493274](https://github.com/julusian/node-elgato-stream-deck/commit/b493274c20a8b8d4fa4f175dc1b910554a74a6b2))
-   upgrade @types/node-hid ([3d59a4f](https://github.com/julusian/node-elgato-stream-deck/commit/3d59a4f8d2c5165cb96e77669884e9074bd583f9))

## [3.2.0](https://github.com/julusian/node-elgato-stream-deck/compare/v3.1.0...v3.2.0) (2019-11-14)

### Features

-   Add support for the new hardware version of the original Stream Deck ([992ee21](https://github.com/julusian/node-elgato-stream-deck/commit/992ee21c56a120717dce7113af24d94f70ec20e1))
-   close device on process exit ([105985e](https://github.com/julusian/node-elgato-stream-deck/commit/105985eb5f5a1fa0bc9396388450b55083feacf9))
-   refactor originalv2 and xl to a shared base class ([c9357ac](https://github.com/julusian/node-elgato-stream-deck/commit/c9357acefa85df5870288212e7d31d01b4b68688))

### Bug Fixes

-   add tests for original-v2 ([40030a8](https://github.com/julusian/node-elgato-stream-deck/commit/40030a8301a3c0dcb9e7375f6f0fd9fc15a37c56))
-   line endings on windows ([c0af2d6](https://github.com/julusian/node-elgato-stream-deck/commit/c0af2d6f55f3268d932875543ea6fb9c7f4865bc))
-   lint errors in origialv2 ([d8e7942](https://github.com/julusian/node-elgato-stream-deck/commit/d8e7942956930791aaa58c6b99363db089c4dd4b))

## [3.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v3.0.0...v3.1.0) (2019-09-29)

### Bug Fixes

-   **xl:** resetToLogo not working ([2475726](https://github.com/julusian/node-elgato-stream-deck/commit/2475726))

### Features

-   Add close method to cleanly close the HID device ([#72](https://github.com/julusian/node-elgato-stream-deck/issues/72)) ([877b5da](https://github.com/julusian/node-elgato-stream-deck/commit/877b5da))

## [3.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v2.1.1...v3.0.0) (2019-06-03)

### Bug Fixes

-   Don't depend on tslib ([3ebd04f](https://github.com/julusian/node-elgato-stream-deck/commit/3ebd04f))
-   Failing tests ([c36125d](https://github.com/julusian/node-elgato-stream-deck/commit/c36125d))
-   **xl:** Fill full button with image. Fix images being horizontally flipped ([4044809](https://github.com/julusian/node-elgato-stream-deck/commit/4044809))
-   Gracefully handle missing jpeg-turbo ([574068f](https://github.com/julusian/node-elgato-stream-deck/commit/574068f))
-   ignore tests in coverage report. format config files. Add tests for device info and listing functions ([2c1db92](https://github.com/julusian/node-elgato-stream-deck/commit/2c1db92))
-   JPEG encoding tests ([8efb092](https://github.com/julusian/node-elgato-stream-deck/commit/8efb092))
-   Mini image display ([99c0c94](https://github.com/julusian/node-elgato-stream-deck/commit/99c0c94))
-   Missing dependencies in travis ([9e0f5b5](https://github.com/julusian/node-elgato-stream-deck/commit/9e0f5b5))
-   Missing devDependency ([f94ff51](https://github.com/julusian/node-elgato-stream-deck/commit/f94ff51))
-   Move static device info methods to be separately importable. Reformat examples ([6dfde88](https://github.com/julusian/node-elgato-stream-deck/commit/6dfde88))
-   Refactor fillImage command generation, and some attempted fixes for the mini ([15ce1f2](https://github.com/julusian/node-elgato-stream-deck/commit/15ce1f2))
-   Refactor the packet generation code to be simpler ([d0ef9cf](https://github.com/julusian/node-elgato-stream-deck/commit/d0ef9cf))
-   Remove padding from images for the mini ([751fc62](https://github.com/julusian/node-elgato-stream-deck/commit/751fc62))
-   Switch to testing version of jpeg-turbo ([01e2e30](https://github.com/julusian/node-elgato-stream-deck/commit/01e2e30))
-   Test and fix some extra commands for the XL ([7399b28](https://github.com/julusian/node-elgato-stream-deck/commit/7399b28))
-   Travis not updating coveralls ([ea57f08](https://github.com/julusian/node-elgato-stream-deck/commit/ea57f08))
-   update dependencies, and linux version used ([8916aec](https://github.com/julusian/node-elgato-stream-deck/commit/8916aec))
-   Update node-hid to 0.7.9 ([da010e5](https://github.com/julusian/node-elgato-stream-deck/commit/da010e5))

### Features

-   Add example for device detection ([81ad930](https://github.com/julusian/node-elgato-stream-deck/commit/81ad930))
-   Add function to list available devices ([8c55598](https://github.com/julusian/node-elgato-stream-deck/commit/8c55598))
-   Add resetToLogo function, ideal for when disconnecting from the device to reset it back to default ([1b94570](https://github.com/julusian/node-elgato-stream-deck/commit/1b94570))
-   Convert to typescript ([a1492bd](https://github.com/julusian/node-elgato-stream-deck/commit/a1492bd))
-   Functions to get firmware and serial numbers [#45](https://github.com/julusian/node-elgato-stream-deck/issues/45) ([ba130b9](https://github.com/julusian/node-elgato-stream-deck/commit/ba130b9))
-   Initial (untested) support for StreamDeck Mini ([c41e684](https://github.com/julusian/node-elgato-stream-deck/commit/c41e684))
-   Port tests to jest and typescript ([4ceaf90](https://github.com/julusian/node-elgato-stream-deck/commit/4ceaf90))
-   Refactor logic to have a common base class with each device extending it ([8632d93](https://github.com/julusian/node-elgato-stream-deck/commit/8632d93))
-   Reimplement fillPanel to work solely on buffers. Fix up all the examples ([f35c26c](https://github.com/julusian/node-elgato-stream-deck/commit/f35c26c))
-   Removed references to sharp (BREAKING CHANGE) ([d17b7c4](https://github.com/julusian/node-elgato-stream-deck/commit/d17b7c4))
-   Reorder the keys on the original to be left to right. The old behaviour can be restored if desired ([fdff5f1](https://github.com/julusian/node-elgato-stream-deck/commit/fdff5f1))
-   Use jpeg-turbo as an optional dependency for image encoding, as it is significantly faster than jpeg-js but has a lot more dependencies ([e7e509e](https://github.com/julusian/node-elgato-stream-deck/commit/e7e509e))
-   Working XL, with slightly dodgey but working image transfer ([eb294e8](https://github.com/julusian/node-elgato-stream-deck/commit/eb294e8))

<a name="2.1.1"></a>

## [2.1.1](https://github.com/julusian/node-elgato-stream-deck/compare/v2.1.0...v2.1.1) (2018-04-05)

### Bug Fixes

-   **package:** pin node-hid to 0.6.0 ([de5186a](https://github.com/julusian/node-elgato-stream-deck/commit/de5186a)), closes [#46](https://github.com/julusian/node-elgato-stream-deck/issues/46)

<a name="2.1.0"></a>

# [2.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v2.0.0...v2.1.0) (2018-03-05)

### Features

-   **package:** eliminate the need for compilation of dependencies on most platforms ([9e5f338](https://github.com/julusian/node-elgato-stream-deck/commit/9e5f338))

<a name="2.0.0"></a>

# [2.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v1.2.0...v2.0.0) (2017-11-28)

### Features

-   add `fillPanel` method
-   add `clearAllKeys` method
-   return the `StreamDeck` constructor instead of automatically instantiating it
-   allow providing a `devicePath` to the constructor
    -   if no device path is provided, will attempt to use the first found Stream Deck. Errors if no Stream Decks are connected.
-   update `this.keyState` _before_ emitting `down` and `up` events
    -   this is technically a _breaking change_, but is very unlikely to affect any production code

### Bug Fixes

-   fix center-cropping in `fillImageFromFile`
-   fix `sharp` only being a `devDependency`, and not a production `dependency`

### Code Refactoring

-   refactor `StreamDeck` class to move as much as possible to static methods and static getters
-   refactor code to use `async`/`await`
    -   this is a _breaking change_, because we now only support Node.js v7.6 or newer

### Documentation

-   update all examples
-   add `fillPanel` example

### BREAKING CHANGES

-   `this.keyState` is now updated **before** `down` and `up` events are emitted.
-   Support for versions of Node.js earlier than 7.6 has been dropped.
-   The `StreamDeck` constructor is now required when `require`ing this library, instead of an instance of the class. \* See the docs for updated examples.

<a name="1.2.0"></a>

# [1.2.0](https://github.com/julusian/node-elgato-stream-deck/compare/v1.1.0...v1.2.0) (2017-06-23)

### Features

-   add `clearKey` method #4
-   add Typescript typings #13
-   add `setBrightness` and `sendFeatureReport` [4d904f0](https://github.com/julusian/node-elgato-stream-deck/commit/4d904f0c7d40154186914599d877b5879179d48b)

### Bug Fixes

-   throw an error when no stream decks are present [c44a1bf](https://github.com/julusian/node-elgato-stream-deck/commit/c44a1bf3ae51bfdc7e9963f131a2ce02746b2975)
-   fix device detection on linux [e0b128c](https://github.com/julusian/node-elgato-stream-deck/commit/e0b128c82aa6e5075e3f8a77d9fca43103b83bc4)
-   `fillImage` fix blue and red channels being swapped [8efdb6b](https://github.com/julusian/node-elgato-stream-deck/commit/8efdb6bf0cb1fde3920c850c6b57d25e56648e09)

### Misc

-   Full test coverage

<a name="1.1.0"></a>

# [1.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v1.0.0...v1.1.0) (2017-05-18)

### Features

-   add `write` method ([0085d87](https://github.com/julusian/node-elgato-stream-deck/commit/0085d87))
-   add `fillColor`, `fillImage`, and `fillImageFromFile` methods ([5fe46ef](https://github.com/julusian/node-elgato-stream-deck/commit/5fe46ef))

<a name="1.0.0"></a>

# 1.0.0 (2017-05-17)

Initial release.
