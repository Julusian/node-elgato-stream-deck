# @elgato-stream-deck/core

![Node CI](https://github.com/Julusian/node-elgato-stream-deck/workflows/Node%20CI/badge.svg)
[![codecov](https://codecov.io/gh/Julusian/node-elgato-stream-deck/branch/master/graph/badge.svg?token=Hl4QXGZJMF)](https://codecov.io/gh/Julusian/node-elgato-stream-deck)

[![npm version](https://img.shields.io/npm/v/@elgato-stream-deck/core.svg)](https://npm.im/@elgato-stream-deck/core)
[![license](https://img.shields.io/npm/l/@elgato-stream-deck/core.svg)](https://npm.im/@elgato-stream-deck/core)

[`@elgato-stream-deck/core`](https://github.com/julusian/node-elgato-stream-deck) is a shared library for interfacing
with the various models of the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

You should not be importing this package directly, instead you will want to do so via one of the wrapper libraries to provide the appropriate HID bindings for your target platform:

-   [`@elgato-stream-deck/node`](https://npm.im/@elgato-stream-deck/node)
-   [`@elgato-stream-deck/webhid`](https://npm.im/@elgato-stream-deck/webhid)
