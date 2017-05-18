# elgato-stream-deck [![npm version](https://img.shields.io/npm/v/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck) [![license](https://img.shields.io/npm/l/elgato-stream-deck.svg)](https://npm.im/elgato-stream-deck) [![Travis](https://travis-ci.org/Lange/node-elgato-stream-deck.svg?branch=master)](https://travis-ci.org/Lange/node-elgato-stream-deck) [![Join the chat at https://gitter.im/node-elgato-stream-deck/Lobby](https://badges.gitter.im/node-elgato-stream-deck/Lobby.svg)](https://gitter.im/node-elgato-stream-deck/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![alt text](media/streamdeck_ui.png "elgato-stream-deck")

[`elgato-stream-deck`](https://github.com/lange/elgato-stream-deck) is a Node.js library for interfacing
with the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

## Install

`$ npm install --save elgato-stream-deck`

## Table of Contents

* [Example](#example)
* [Features](#features)
* [Planned Features](#planned-features)
* [Contributing](#contributing)
* [API](#api)
  * [`write`](#write)
* [Events](#events)
  * [`down`](#down)
  * [`up`](#up)
  * [`error`](#error)

### Example

```javascript
const streamDeck = require('elgato-stream-deck')
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

* Key `down` and key `up` events

### Planned Features

* Key combinations
* Send new images to keys
* Support "pages" feature from the official Elgato Stream Deck software

### Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! The [Contributor Guide](CONTRIBUTING.md) has all the information you need for everything from reporting bugs to contributing entire new features. Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

All participants and maintainers in this project are expected to follow [Code of Conduct](CODE_OF_CONDUCT.md), and just generally be kind to each other.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.

### API

#### <a name="write"></a> `> streamDeck.write(buffer) -> undefined`

Synchronsously writes an arbitrary [`Buffer`](https://nodejs.org/api/buffer.html) instance to the Stream Deck.
Throws if an error is encountered during the write operation.

##### Example

```javascript
streamDeck.on('down', keyIndex => {
    console.log('key %d down', keyIndex);
});
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
streamDeck.on('error', keyIndex => {
    console.log('key %d error', keyIndex);
});
```
