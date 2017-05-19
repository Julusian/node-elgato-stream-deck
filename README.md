# elgato-stream-deck [![npm version](https://img.shields.io/npm/v/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck) [![license](https://img.shields.io/npm/l/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck) [![Travis](https://travis-ci.org/Lange/node-elgato-stream-deck.svg?branch=master)](https://travis-ci.org/Lange/node-elgato-stream-deck) [![Join the chat at https://gitter.im/node-elgato-stream-deck/Lobby](https://badges.gitter.im/node-elgato-stream-deck/Lobby.svg)](https://gitter.im/node-elgato-stream-deck/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![alt text](media/streamdeck_ui.png "elgato-stream-deck")

[`elgato-stream-deck`](https://github.com/lange/elgato-stream-deck) is a Node.js library for interfacing
with the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

## Install

`$ npm install --save elgato-stream-deck`

If that fails (**or if you are on a Raspberry Pi**), you will need to install a compiler toolchain to enable npm to build
some of `node-elgato-stream-deck`'s dependencies from source. 

* Windows
  * Install [`windows-build-tools`](https://github.com/felixrieseberg/windows-build-tools):
  ```bash
  npm install --global windows-build-tools
  ```
* MacOS
  * Install [Xcode](https://developer.apple.com/xcode/download/), then:
  ```bash
  xcode-select --install
  ```
* Linux (**including Raspberry Pi**)
  * Follow the instructions for Linux in the ["Compiling from source"](https://github.com/node-hid/node-hid#compiling-from-source) steps for `node-hid`:
    ```bash
    sudo apt-get install build-essential git
    sudo apt-get install gcc-4.8 g++-4.8 && export CXX=g++-4.8
    sudo apt-get install sudo apt install libusb-1.0-0 libusb-1.0-0-dev
    ```
  * Install a recent version of Node.js. We've had success with v7:
    ```bash
    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt-get install -y nodejs 
    ```
  * Try installing `node-elgato-stream-deck`
  * If you still have issues, ensure everything is updated and try again:
	```bash
	sudo apt-get update && sudo apt-get upgrade
	```

## Table of Contents

* [Example](#example)
* [Features](#features)
* [Planned Features](#planned-features)
* [Contributing](#contributing)
* [API](#api)
  * [`write`](#write)
  * [`fillColor`](#fill-color)
  * [`fillImageFromFile`](#fill-image-from-file)
  * [`fillImage`](#fill-image)
  * [`clearKey`](#clear-key)
* [Events](#events)
  * [`down`](#down)
  * [`up`](#up)
  * [`error`](#error)

### Example

#### JavaScript

```javascript
const path = require('path');
const streamDeck = require('elgato-stream-deck');

streamDeck.on('down', keyIndex => {
    console.log('key %d down', keyIndex);
});

streamDeck.on('up', keyIndex => {
    console.log('key %d up', keyIndex);
});

streamDeck.on('error', error => {
    console.error(error);
});

// Fill the second button from the left in the first row with an image of the GitHub logo.
// This is asynchronous and returns a promise.
streamDeck.fillImageFromFile(3, path.resolve(__dirname, 'github_logo.png')).then(() => {
	console.log('Successfully wrote a GitHub logo to key 3.');
});

// Fill the first button form the left in the first row with a solid red color. This is synchronous.
streamDeck.fillColor(4, 255, 0, 0);
console.log('Successfully wrote a red square to key 4.');
```

#### TypeScript

```typescript
import streamDeck = require('elgato-stream-deck');

streamDeck.on('down', keyIndex => {
    console.log('key %d down', keyIndex);
});

streamDeck.on('up', keyIndex => {
    console.log('key %d up', keyIndex);
});

streamDeck.on('error', error => {
    console.error(error);
});
```

### Features

* Miltiplatform support: Windows 7-10, MacOS, Linux, and even Raspberry Pi!
* Key `down` and key `up` events
* Fill keys with images or solid RGB colors
* Typescript support

### Planned Features

* [Hotplugging](https://github.com/Lange/node-elgato-stream-deck/issues/14)
* [Key combinations](https://github.com/Lange/node-elgato-stream-deck/issues/9)
* Support "pages" feature from the official Elgato Stream Deck software
* [Text labels](https://github.com/Lange/node-elgato-stream-deck/issues/6)
* [Changing the standby image](https://github.com/Lange/node-elgato-stream-deck/issues/11)

### Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! The [Contributor Guide](CONTRIBUTING.md) has all the information you need for everything from reporting bugs to contributing entire new features. Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

All participants and maintainers in this project are expected to follow [Code of Conduct](CODE_OF_CONDUCT.md), and just generally be kind to each other.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.

### API

#### <a name="write"></a> `> streamDeck.write(buffer) -> undefined`

Synchronously writes an arbitrary [`Buffer`](https://nodejs.org/api/buffer.html) instance to the Stream Deck.
Throws if an error is encountered during the write operation.

##### Example

```javascript
// Writes 16 bytes of zero to the Stream Deck.
streamDeck.write(Buffer.alloc(16));
```

#### <a name="fill-color"></a> `> streamDeck.fillColor(keyIndex, r, g, b) -> undefined`

Synchronously sets the given `keyIndex`'s screen to a solid RGB color.

##### Example

```javascript
// Turn key 4 (the top left key) solid red.
streamDeck.fillColor(4, 255, 0, 0);
```

#### <a name="fill-image-from-file"></a> `> streamDeck.fillImageFromFile(keyIndex, filePath) -> Promise`

Asynchronously reads an image from `filePath` and sets the given `keyIndex`'s screen to that image.
Automatically scales the image to 72x72 and strips out the alpha channel.
If necessary, the image will be center-cropped to fit into a square.

##### Example

```javascript
// Fill the second button from the left in the first row with an image of the GitHub logo.
streamDeck.fillImageFromFile(3, path.resolve(__dirname, 'github_logo.png'))
	.then(() => {
		console.log('Successfully wrote a GitHub logo to key 3.');
	})
	.catch(err => {
		console.error(err);
	});
```

#### <a name="fill-image"></a> `> streamDeck.fillImage(keyIndex, buffer) -> undefined`

Synchronously writes a buffer of 72x72 RGB image data to the given `keyIndex`'s screen.
The buffer must be exactly 15552 bytes in length. Any other length will result in an error being thrown.

##### Example

```javascript
// Fill the third button from the left in the first row with an image of the GitHub logo.
const sharp = require('sharp'); // See http://sharp.dimens.io/en/stable/ for full docs on this great library!
sharp(path.resolve(__dirname, 'github_logo.png'))
	.flatten() // Eliminate alpha channel, if any.
	.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE) // Scale down to the right size, cropping if necessary.
	.raw() // Give us uncompressed RGB
	.toBuffer()
	.then(buffer => {
		return streamDeck.fillImage(2, buffer);
	})
	.catch(err => {
		console.error(err);
	});
```

#### <a name="clear-key"></a> `> streamDeck.clearKey(keyIndex) -> undefined`

Synchronously clears the given `keyIndex`'s screen.

##### Example

```javascript
// Clear the third button from the left in the first row.
streamDeck.clearKey(2);
```

### Events

#### <a name="down"></a> `> down`

Fired whenever a key is pressed. `keyIndex` is the 0-14 numerical index of that key.

##### Example

```javascript
streamDeck.on('down', keyIndex => {
    console.log('key %d down', keyIndex);
});
```

#### <a name="up"></a> `> up`

Fired whenever a key is released. `keyIndex` is the 0-14 numerical index of that key.

##### Example

```javascript
streamDeck.on('up', keyIndex => {
    console.log('key %d up', keyIndex);
});
```

#### <a name="error"></a> `> error`

Fired whenever an error is detected by the `node-hid` library.
**Always** add a listener for this event! If you don't, errors will be silently dropped.

##### Example

```javascript
streamDeck.on('error', error => {
    console.error(error);
});
```
