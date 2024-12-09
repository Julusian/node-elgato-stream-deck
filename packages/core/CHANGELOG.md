# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.1.2](https://github.com/julusian/node-elgato-stream-deck/compare/v7.1.1...v7.1.2) (2024-12-09)


### Bug Fixes

* studio clearPanel over usb ([6282b1b](https://github.com/julusian/node-elgato-stream-deck/commit/6282b1b401ce5a17955c3dc01e0757773efa520c))





## [7.1.1](https://github.com/julusian/node-elgato-stream-deck/compare/v7.1.0...v7.1.1) (2024-11-14)


### Bug Fixes

* simplify firmware versions ([1b94c63](https://github.com/julusian/node-elgato-stream-deck/commit/1b94c63a6742bfe47d424acdf4c70927d62066b2))





# [7.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v7.0.2...v7.1.0) (2024-11-14)


### Bug Fixes

* fillKeyColor ([234fa8f](https://github.com/julusian/node-elgato-stream-deck/commit/234fa8f0cc8c5755f356d2a01f75c5374f616d00))
* studio right encoder led ring offset ([024fd2a](https://github.com/julusian/node-elgato-stream-deck/commit/024fd2a108ac0adeb6cd8d152b507da32c410fa2))
* studio right encoder led ring offset ([65839d8](https://github.com/julusian/node-elgato-stream-deck/commit/65839d8a1ea70ba8d85475b0d9950629dab1551c))


### Features

* additional studio firmware versions ([46c49d7](https://github.com/julusian/node-elgato-stream-deck/commit/46c49d7cc91263931ff2a0e3d9a50b2e20f96a44))
* additional studio firmware versions (usb) ([4e2e5df](https://github.com/julusian/node-elgato-stream-deck/commit/4e2e5df1811427d78f4515b3e313a39e4625bbb7))





## [7.0.2](https://github.com/julusian/node-elgato-stream-deck/compare/v7.0.1...v7.0.2) (2024-09-16)

**Note:** Version bump only for package @elgato-stream-deck/core





## [7.0.1](https://github.com/julusian/node-elgato-stream-deck/compare/v7.0.0...v7.0.1) (2024-09-10)


### Bug Fixes

* disable `SUPPORTS_RGB_KEY_FILL` for some models [#101](https://github.com/julusian/node-elgato-stream-deck/issues/101) ([d752b41](https://github.com/julusian/node-elgato-stream-deck/commit/d752b41726a37f3740ef5dafd85ec72408b19433))





# [7.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v7.0.0-0...v7.0.0) (2024-09-08)


### Features

* streamdeck studio support ([#100](https://github.com/julusian/node-elgato-stream-deck/issues/100)) ([baf506d](https://github.com/julusian/node-elgato-stream-deck/commit/baf506da9f4a1e38bc8f7f393743491c21c59835))





# [7.0.0-0](https://github.com/julusian/node-elgato-stream-deck/compare/v6.2.2...v7.0.0-0) (2024-08-26)

### Features

* target nodejs 18 ([5fe6c09](https://github.com/julusian/node-elgato-stream-deck/commit/5fe6c092ba46e09a1814ff627ec2991359dadd6c))
* rework how device functionality is exposed
* rework events structure



## [6.2.2](https://github.com/julusian/node-elgato-stream-deck/compare/v6.2.1...v6.2.2) (2024-07-11)

**Note:** Version bump only for package @elgato-stream-deck/core





## [6.2.1](https://github.com/julusian/node-elgato-stream-deck/compare/v6.2.0...v6.2.1) (2024-07-11)


### Bug Fixes

* val.readUint8 is not a function ([#95](https://github.com/julusian/node-elgato-stream-deck/issues/95)) ([d80b765](https://github.com/julusian/node-elgato-stream-deck/commit/d80b76572cb02589549315eaee92de7c08f963eb))





# [6.2.0](https://github.com/julusian/node-elgato-stream-deck/compare/v6.0.0...v6.2.0) (2024-04-30)


### Bug Fixes

* clear neo screen as part of `clearPanel` ([53b88e5](https://github.com/julusian/node-elgato-stream-deck/commit/53b88e5772cd7e8f0fb9716e6e7f4d714e5c029f))
* support longer serial numbers [#76](https://github.com/julusian/node-elgato-stream-deck/issues/76) ([545cb6e](https://github.com/julusian/node-elgato-stream-deck/commit/545cb6eaa2eccecc5f94e47973465e7b1a43f664))


### Features

* add `KEY_SPACING_VERTICAL` and `KEY_SPACING_HORIZONTAL` properties ([d69e5c7](https://github.com/julusian/node-elgato-stream-deck/commit/d69e5c74fe027e3763eee645b1639c367de19155))
* neo lcd drawing ([7d13bc0](https://github.com/julusian/node-elgato-stream-deck/commit/7d13bc03306fccad119b4f203c9106bc93d5515b))
* **node:** expose path of opened device [#65](https://github.com/julusian/node-elgato-stream-deck/issues/65) ([45ebbe5](https://github.com/julusian/node-elgato-stream-deck/commit/45ebbe5a9e721f3a89d027d977193f7aa322f6ce))
* refactor image generation to be more modular ([4f62a9d](https://github.com/julusian/node-elgato-stream-deck/commit/4f62a9d05d7abb4d44779281cdc2285c66623f3a))
* refactor streamdeck plus lcd image generation (needs testing) ([e32eaa5](https://github.com/julusian/node-elgato-stream-deck/commit/e32eaa53e47b6c43a5bf4ffa0a55afd9eee7be87))
* support for streamdeck neo ([65197a7](https://github.com/julusian/node-elgato-stream-deck/commit/65197a7735d86ebd1883f96a5f7719b2bd1c95fb))





# [6.1.0](https://github.com/julusian/node-elgato-stream-deck/compare/v6.0.0...v6.1.0) (2024-04-21)


### Features

* add `KEY_SPACING_VERTICAL` and `KEY_SPACING_HORIZONTAL` properties ([d69e5c7](https://github.com/julusian/node-elgato-stream-deck/commit/d69e5c74fe027e3763eee645b1639c367de19155))
* **node:** expose path of opened device [#65](https://github.com/julusian/node-elgato-stream-deck/issues/65) ([45ebbe5](https://github.com/julusian/node-elgato-stream-deck/commit/45ebbe5a9e721f3a89d027d977193f7aa322f6ce))





# [6.0.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.7.3...v6.0.0) (2023-11-29)


### Features

* use async node-hid ([#75](https://github.com/julusian/node-elgato-stream-deck/issues/75)) ([9938244](https://github.com/julusian/node-elgato-stream-deck/commit/9938244f1c61618ce821fe574127c5ae81211c72))





## [5.7.3](https://github.com/julusian/node-elgato-stream-deck/compare/v5.7.2...v5.7.3) (2023-06-20)


### Bug Fixes

* streamdeck mini unable to be opened on windows ([f8b174a](https://github.com/julusian/node-elgato-stream-deck/commit/f8b174a31a1afabf6f8aa1b69ed52809f5f6316b))





# [5.7.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.6.0-alpha.0...v5.7.0) (2022-11-15)


### Features

* streamdeck plus ([#59](https://github.com/julusian/node-elgato-stream-deck/issues/59)) ([37479d8](https://github.com/julusian/node-elgato-stream-deck/commit/37479d8a14bffe6eb421164bbaad1161dc302502))


### Reverts

* Revert "chore: switch to yarn3" ([45f6137](https://github.com/julusian/node-elgato-stream-deck/commit/45f613755a274c350b7819d30856cf7aa27f27e3))





# [5.6.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.6.0-alpha.0...v5.6.0) (2022-09-30)

**Note:** Version bump only for package @elgato-stream-deck/core





# [5.6.0-alpha.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.5.0...v5.6.0-alpha.0) (2022-09-25)

**Note:** Version bump only for package @elgato-stream-deck/core





# [5.5.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.5.0-alpha.1...v5.5.0) (2022-07-25)

**Note:** Version bump only for package @elgato-stream-deck/core





# [5.5.0-alpha.1](https://github.com/julusian/node-elgato-stream-deck/compare/v5.5.0-alpha.0...v5.5.0-alpha.1) (2022-07-25)


### Bug Fixes

* mini-v2 ([b5bce79](https://github.com/julusian/node-elgato-stream-deck/commit/b5bce799c8b46f4d882e6b80e073445be3261b8b))





# [5.5.0-alpha.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.4.0...v5.5.0-alpha.0) (2022-07-08)


### Bug Fixes

* optimise coordinate manipulation for buffers ([4ca3b66](https://github.com/julusian/node-elgato-stream-deck/commit/4ca3b66a03b17c1d495a726d89a90a3890b23ddc))


### Features

* implement mini-v2 ([4993389](https://github.com/julusian/node-elgato-stream-deck/commit/49933898efb8772a008f8427eca15d4a1b20448d))





# [5.4.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.4.0-alpha.0...v5.4.0) (2022-05-10)


### Bug Fixes

* add missing tslib dependency ([6b53699](https://github.com/julusian/node-elgato-stream-deck/commit/6b536994bea3686b4b03fccadafeb2a532e63f4d))





# [5.4.0-alpha.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.3.1...v5.4.0-alpha.0) (2022-04-12)


### Features

* support for the pedal (untested) ([ccc4389](https://github.com/julusian/node-elgato-stream-deck/commit/ccc4389844c67194060f32e741c41407713c4cf7))





# [5.2.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.2.0-alpha.1...v5.2.0) (2022-01-25)

**Note:** Version bump only for package @elgato-stream-deck/core





# [5.2.0-alpha.1](https://github.com/julusian/node-elgato-stream-deck/compare/v5.2.0-alpha.0...v5.2.0-alpha.1) (2022-01-19)

**Note:** Version bump only for package @elgato-stream-deck/core





# [5.2.0-alpha.0](https://github.com/julusian/node-elgato-stream-deck/compare/v5.1.2...v5.2.0-alpha.0) (2022-01-18)


### Features

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

Initial release
