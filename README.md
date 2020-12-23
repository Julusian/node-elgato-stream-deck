# elgato-stream-deck

[![npm version](https://img.shields.io/npm/v/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck)
[![license](https://img.shields.io/npm/l/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck)
![Node CI](https://github.com/Julusian/node-elgato-stream-deck/workflows/Node%20CI/badge.svg)

[`elgato-stream-deck`](https://github.com/julusian/elgato-stream-deck) is a Node.js library for interfacing
with the various models of the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

> ❗ Please note that `node-elgato-stream-deck` is **NOT a standalone application**. It is not something you download and run on its own. It is not an alternative to the [official Stream Deck program provided by Elgato](https://www.elgato.com/en/gaming/downloads). Instead, `node-elgato-stream-deck` is a code library which provides an API to the Stream Deck. Developers can use this API to make their own applications which interface with the Stream Deck.
>
> To further clarify: **this is not an installable program**. There is no user interface, and you cannot do anything with this library on its own. Out of the box, this library does nothing. It's purpose is to provide tools for programmers to **build** programs from the ground up which interact with a Stream Deck.
>
> This is a tool for developers to use. It is not a program for end users. It cannot and will not replace the official Stream Deck program. That is not its goal. However, it does enable someone to more easily write a program which _does_ do that.

## Install

`$ npm install --save elgato-stream-deck`

`$ npm install --save @julusian/jpeg-turbo@^1.0.0` (Optional)

It is recommended to install `@julusian/jpeg-turbo` to greatly improve performance for writing images to the StreamDeck XL or the Original-v2. Without doing so `jpeg-js` will be used instead, but image transfers will be noticably more cpu intensive and slower. `jpeg-turbo` has prebuilt binaries, but is not installed by default to ensure installation is easy for users who do not need the performance or the XL or the Original-v2.

### Linux

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

### Native dependencies

All of this library's native dependencies ship with prebuilt binaries, so having a full compiler toolchain should not be necessary to install `node-elgato-stream-deck`.

However, in the event that installation _does_ fail (**or if you are on a platform that our dependencies don't provide prebuilt binaries for, such as a Raspberry Pi**), you will need to install a compiler toolchain to enable npm to build some of `node-elgato-stream-deck`'s dependencies from source. Expand the details block below for full instructions on how to do so.

<details>
	<summary>Compiling dependencies from source</summary>
	
* Windows
  * Install [`windows-build-tools`](https://github.com/felixrieseberg/windows-build-tools):
  ```bash
  npm install --global windows-build-tools
  ```
* MacOS
  * Install the Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
* Linux (**including Raspberry Pi**)
  * Follow the instructions for Linux in the ["Compiling from source"](https://github.com/node-hid/node-hid#compiling-from-source) steps for 
  * Try installing `node-elgato-stream-deck`
  * If you still have issues, ensure everything is updated and try again:
	```bash
	sudo apt-get update && sudo apt-get upgrade
	```
</details>

## Table of Contents

-   [Features](#features)
-   [Example](#example)
-   [API](#api)
    -   [`openStreamDeck`](#open-streamdeck)
    -   [`listStreamDecks`](#list-streamdecks)
    -   [`getStreamDeckInfo`](#get-streamdeck-info)
    -   [`fillColor`](#fill-color)
    -   [`fillImage`](#fill-image)
    -   [`fillPanel`](#fill-panel)
    -   [`clearKey`](#clear-key)
    -   [`clearAllKeys`](#clear-all-keys)
    -   [`setBrightness`](#set-brightness)
    -   [`resetToLogo`](#reset-to-logo)
    -   [`getFirmwareVersion`](#get-firmware-version)
    -   [`getSerialNumber`](#get-serial-number)
-   [Events](#events)
    -   [`down`](#down)
    -   [`up`](#up)
    -   [`error`](#error)
-   [Contributing](#contributing)
-   [Protocol Notes](#protocol-notes)

### Features

-   Multiplatform support: Windows 7-10, MacOS, Linux, and even Raspberry Pi!
-   Support for every StreamDeck model (Original, Mini & XL)
-   Key `down` and key `up` events
-   Fill keys with images or solid RGB colors
-   Fill the entire panel with a single image, spread across all keys
-   Set the Stream Deck brightness
-   TypeScript support

### Example

#### JavaScript

```javascript
const path = require('path')
const { openStreamDeck } = require('elgato-stream-deck')

// Automatically discovers connected Stream Decks, and attaches to the first one.
// Throws if there are no connected stream decks.
// You also have the option of providing the devicePath yourself as the first argument to the constructor.
// For example: const myStreamDeck = new StreamDeck('\\\\?\\hid#vid_05f3&pid_0405&mi_00#7&56cf813&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}')
// On linux the equivalent would be: const myStreamDeck = new StreamDeck('0001:0021:00')
// Available devices can be found with listStreamDecks()
const myStreamDeck = openStreamDeck()

myStreamDeck.on('down', (keyIndex) => {
	console.log('key %d down', keyIndex)
})

myStreamDeck.on('up', (keyIndex) => {
	console.log('key %d up', keyIndex)
})

// Fired whenever an error is detected by the `node-hid` library.
// Always add a listener for this event! If you don't, errors will be silently dropped.
myStreamDeck.on('error', (error) => {
	console.error(error)
})

// Fill the first button form the left in the first row with a solid red color. This is synchronous.
myStreamDeck.fillColor(4, 255, 0, 0)
console.log('Successfully wrote a red square to key 4.')
```

#### TypeScript

```typescript
import { openStreamDeck } = require('elgato-stream-deck')
const myStreamDeck = openStreamDeck() // Will throw an error if no Stream Decks are connected.

myStreamDeck.on('down', keyIndex => {
	console.log('key %d down', keyIndex)
})

myStreamDeck.on('up', keyIndex => {
	console.log('key %d up', keyIndex)
})

// Fired whenever an error is detected by the `node-hid` library.
// Always add a listener for this event! If you don't, errors will be silently dropped.
myStreamDeck.on('error', error => {
	console.error(error)
})
```

### API

#### <a name="open-streamdeck"></a> `> openStreamDeck(path?: string, options?: OpenStreamDeckOptions) -> StreamDeckDeviceInfo | undefined`

Opens a StreamDeck.

If a path is provided, then a specific device will be opened, otherwise the first found device will be used. See [listDevices](#list-devices) for info on how to discover devices.

Some device types have additional options, as part of the options object. This is not required to be provided.

Options:

-   useOriginalKeyOrder: This restores the right-to-left key order for the Original StreamDeck. Since v3.0.0 the default key order has been changed to make sense and be consistent with the other models

```javascript
const streamDeck = openStreamDeck()

// Or

const streamDeck = openStreamDeck('0001:0021:00')

// Or

const streamDeck = openStreamDeck('0001:0021:00', {
	useOriginalKeyOrder: true,
})
```

#### <a name="list-streamdecks"></a> `> listStreamDecks() -> Array<StreamDeckDeviceInfo>`

This will scan for and list all detected StreamDeck devices on the system along with their model. The path property can be passed into the constructor to open a specific device.

```javascript
console.log('Devices: ', listStreamDecks())
/**
 * Devices: [
 *   {
 *     model: 'original',
 *     path: '0001:0023:00',
 *     serialNumber: 'AL37G1A02840'
 *   },
 *   {
 *     model: 'xl',
 *     path: '0001:0021:00',
 *     serialNumber: 'CL18I1A00913'
 *   }
 * ]
 */
```

#### <a name="get-streamdeck-info"></a> `> getStreamDeckInfo(path: string) -> StreamDeckDeviceInfo | undefined`

Get the info for a given device. Returns `undefined` if the path is not a valid StreamDeck

```javascript
console.log('Info: ', getStreamDeckInfo('0001:0021:00'))
/**
 * Info: {
 *   model: 'xl',
 *   path: '0001:0021:00',
 *   serialNumber: 'CL18I1A00913'
 * }
 */
```

#### <a name="fill-color"></a> `> streamDeck.fillColor(keyIndex, r, g, b) -> undefined`

Synchronously sets the given `keyIndex`'s screen to a solid RGB color.
An error will be thrown if the keyIndex is not valid, of a colour component is outside of the range 0-255

##### Example

```javascript
// Turn key 4 (the top left key) solid red.
streamDeck.fillColor(4, 255, 0, 0)
```

#### <a name="fill-image"></a> `> streamDeck.fillImage(keyIndex, buffer) -> undefined`

Synchronously writes a buffer of RGB image data to the given `keyIndex`'s screen.
The required size of the buffer varies by device, and must be the exact length. Any other length will result in an error being thrown.

The expected sizes are:

-   Original: 15552 (72px)
-   Mini: 19200 (80px)
-   XL: 27648 (96px)

##### Example

```javascript
// Fill the third button from the left in the first row with an image of the GitHub logo.
const sharp = require('sharp') // See http://sharp.dimens.io/en/stable/ for full docs on this great library!
sharp(path.resolve(__dirname, 'github_logo.png'))
	.flatten() // Eliminate alpha channel, if any.
	.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE) // Scale up/down to the right size, cropping if necessary.
	.raw() // Give us uncompressed RGB.
	.toBuffer()
	.then((buffer) => {
		streamDeck.fillImage(2, buffer)
	})
	.catch((err) => {
		console.error(err)
	})
```

#### <a name="fill-panel"></a> `> streamDeck.fillPanel(buffer) -> undefined`

Applies an image to the entire panel, spreading it over all keys. The image must be exactly the correct resolution for your device. Any other size will result in an error being thrown.

##### Example

```javascript
// Fill the entire panel with a photo of a sunny field.
const sharp = require('sharp') // See http://sharp.dimens.io/en/stable/ for full docs on this great library!
sharp(path.resolve(__dirname, 'github_logo.png'))
	.flatten() // Eliminate alpha channel, if any.
	.resize(streamDeck.ICON_SIZE * streamDeck.KEY_COLUMNS, streamDeck.ICON_SIZE * streamDeck.KEY_ROWS) // Scale up/down to the right size, cropping if necessary.
	.raw() // Give us uncompressed RGB.
	.toBuffer()
	.then((buffer) => {
		streamDeck.fillPanel(buffer)
	})
	.catch((err) => {
		console.error(err)
	})
```

#### <a name="clear-key"></a> `> streamDeck.clearKey(keyIndex) -> undefined`

Synchronously clears the given `keyIndex`'s screen.
An error will be thrown if the keyIndex is not valid

##### Example

```javascript
// Clear the third button from the left in the first row.
streamDeck.clearKey(2)
```

#### <a name="clear-all-keys"></a> `> streamDeck.clearAllKeys() -> undefined`

Synchronously clears all keys on the device.

##### Example

```javascript
// Clear all keys.
streamDeck.clearAllKeys()
```

#### <a name="set-brightness"></a> `> streamDeck.setBrightness(percentage) -> undefined`

Synchronously set the brightness of the Stream Deck. This affects all keys at once. The brightness of individual keys cannot be controlled.
An error will be thrown if the brightness is not in the range 0-100

##### Example

```javascript
// Set the Stream Deck to maximum brightness
streamDeck.setBrightness(100)
```

#### <a name="reset-to-logo"></a> `> streamDeck.resetToLogo() -> undefined`

Resets the device back to the startup Elgato logo.

##### Example

```javascript
// Set the Stream Deck back to the Elgato logo
streamDeck.resetToLogo()
```

#### <a name="get-firmware-version"></a> `> streamDeck.getFirmwareVersion() -> string`

Gets the firmware version number.

##### Example

```javascript
console.log(streamDeck.getFirmwareVersion())
```

#### <a name="get-serial-number"></a> `> streamDeck.getSerialNumber() -> string`

Gets the serial number of the device.

##### Example

```javascript
console.log(streamDeck.getSerialNumber())
```

### Events

#### <a name="down"></a> `> down`

Fired whenever a key is pressed. `keyIndex` is the index of that key.

##### Example

```javascript
streamDeck.on('down', (keyIndex) => {
	console.log('key %d down', keyIndex)
})
```

#### <a name="up"></a> `> up`

Fired whenever a key is released. `keyIndex` is the index of that key.

##### Example

```javascript
streamDeck.on('up', (keyIndex) => {
	console.log('key %d up', keyIndex)
})
```

#### <a name="error"></a> `> error`

Fired whenever an error is detected by the `node-hid` library.
**Always** add a listener for this event! If you don't, errors will be silently dropped.

##### Example

```javascript
streamDeck.on('error', (error) => {
	console.error(error)
})
```

### Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.

### Protocol Notes

Raw protocol notes can be found in [NOTES.md](NOTES.md). These detail the protocol and method for interacting with the Stream Deck which this module implements.
