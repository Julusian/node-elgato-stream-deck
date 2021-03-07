# @elgato-stream-deck/webhid

![Node CI](https://github.com/Julusian/node-elgato-stream-deck/workflows/Node%20CI/badge.svg)
[![codecov](https://codecov.io/gh/Julusian/node-elgato-stream-deck/branch/master/graph/badge.svg?token=Hl4QXGZJMF)](https://codecov.io/gh/Julusian/node-elgato-stream-deck)

[![npm version](https://img.shields.io/npm/v/@elgato-stream-deck/webhid.svg)](https://npm.im/@elgato-stream-deck/webhid)
[![license](https://img.shields.io/npm/l/@elgato-stream-deck/webhid.svg)](https://npm.im/@elgato-stream-deck/webhid)

[`@elgato-stream-deck/webhid`](https://github.com/julusian/node-elgato-stream-deck) is a shared library for interfacing
with the various models of the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

## Intended use

This library has nothing to do with the streamdeck software produced by Elgato. There is nothing here to install and run. This is a library to help developers make alternatives to that software

## Install

`$ npm install --save @elgato-stream-deck/webhid`

### Important

You need to provide a Buffer polyfill to the browser for this library. We recommend using [buffer](https://www.npmjs.com/package/buffer) which can be added to your webpack config with:

```
plugins: [
	new ProvidePlugin({
		Buffer: ['buffer', 'Buffer'],
	}),
],
```

## Linux

On linux, the udev subsystem blocks access to the StreamDeck without some special configuration.
Save the following to `/etc/udev/rules.d/50-elgato.rules` and reload the rules with `sudo udevadm control --reload-rules`

```
SUBSYSTEM=="input", GROUP="input", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", ATTRS{idProduct}=="0060", MODE:="666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", ATTRS{idProduct}=="0063", MODE:="666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", ATTRS{idProduct}=="006c", MODE:="666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", ATTRS{idProduct}=="006d", MODE:="666", GROUP="plugdev"
```

Unplug and replug the device and it should be usable

## Features

-   Support for every StreamDeck model (Original, Mini & XL)
-   Key `down` and key `up` events
-   Fill keys with canvas, images or solid RGB colors
-   Fill the entire panel with a single image, spread across all keys
-   Set the Stream Deck brightness
-   TypeScript support

### Known limitations

-   Only works with Chromium v89+ based browsers
-   The original model of the 15key is not supported on linux
-   When having a hid device open, you will still be subject to background tab throttling which affects the draw rate

## Example

```typescript
import { requestStreamDecks } from '@elgato-stream-deck/webhid'

// Prompts the user to select a streamdeck to use
const myStreamDecks = await requestStreamDecks()

myStreamDecks[0].on('down', (keyIndex) => {
	console.log('key %d down', keyIndex)
})

myStreamDecks[0].on('up', (keyIndex) => {
	console.log('key %d up', keyIndex)
})

// Fired whenever an error is detected by the hid device.
// Always add a listener for this event! If you don't, errors will be silently dropped.
myStreamDecks[0].on('error', (error) => {
	console.error(error)
})

// Fill the first button form the left in the first row with a solid red color. This is asynchronous.
await myStreamDecks[0].fillKeyColor(4, 255, 0, 0)
console.log('Successfully wrote a red square to key 4.')
```

Some the [demo site](https://streamdeck.julusian.dev) for some more complete examples and its corresponding [source](/packages/webhid-demo).

## Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.
