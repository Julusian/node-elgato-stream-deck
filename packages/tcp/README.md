# @elgato-stream-deck/tcp

![Node CI](https://github.com/Julusian/node-elgato-stream-deck/workflows/Node%20CI/badge.svg)
[![codecov](https://codecov.io/gh/Julusian/node-elgato-stream-deck/branch/master/graph/badge.svg?token=Hl4QXGZJMF)](https://codecov.io/gh/Julusian/node-elgato-stream-deck)

[![npm version](https://img.shields.io/npm/v/@elgato-stream-deck/tcp.svg)](https://npm.im/@elgato-stream-deck/tcp)
[![license](https://img.shields.io/npm/l/@elgato-stream-deck/tcp.svg)](https://npm.im/@elgato-stream-deck/tcp)

[`@elgato-stream-deck/tcp`](https://github.com/julusian/node-elgato-stream-deck) is a shared library for interfacing
with the various models of the [Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck).

## Intended use

This library has nothing to do with the streamdeck software produced by Elgato. There is nothing here to install and run. This is a library to help developers make alternatives to that software

## Install

`$ npm install --save @elgato-stream-deck/tcp`

`$ npm install --save @julusian/jpeg-turbo@^2.0.0` (Optional)

It is recommended to install `@julusian/jpeg-turbo` to greatly improve performance for writing images to the StreamDeck XL or the Original-v2. Without doing so `jpeg-js` will be used instead, but image transfers will be noticably more cpu intensive and slower. `jpeg-turbo` has prebuilt binaries, but is not installed by default to ensure installation is easy for users who do not need the performance for the XL or the Original-v2.

### Native dependencies

All of this library's native dependencies ship with prebuilt binaries, so having a full compiler toolchain should not be necessary to install `@elgato-stream-deck/tcp`.

However, in the event that installation _does_ fail (**or if you are on a platform that our dependencies don't provide prebuilt binaries for, such as a Raspberry Pi**), you will need to install a compiler toolchain to enable npm to build some of `@elgato-stream-deck/tcp`'s dependencies from source. Expand the details block below for full instructions on how to do so.

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
  * Try installing `@elgato-stream-deck/tcp`
  * If you still have issues, ensure everything is updated and try again:
	```bash
	sudo apt-get update && sudo apt-get upgrade
	```
</details>

## Features

TODO

## API

The root methods exposed by the library are as follows. For more information it is recommended to rely on the typescript typings for hints or to browse through the source to see what methods are available

```typescript
// TODO
```

The StreamDeck type can be found [here](/packages/core/src/models/types.ts#L15)

## Example

```typescript
// TODO
```

Some more complex demos can be found in the [examples](examples/) folder.

## Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.
