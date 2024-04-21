# @elgato-stream-deck

![Node CI](https://github.com/Julusian/node-elgato-stream-deck/workflows/Node%20CI/badge.svg)
[![codecov](https://codecov.io/gh/Julusian/node-elgato-stream-deck/branch/master/graph/badge.svg?token=Hl4QXGZJMF)](https://codecov.io/gh/Julusian/node-elgato-stream-deck)

[@elgato-stream-deck](https://www.npmjs.com/org/elgato-stream-deck) is a collection of libraries for interfacing with the various models of the [Elgato Stream Deck](https://www.elgato.com/en/gaming/).  
With WebHID being made publicly available it is now possible to use the Steam Deck directly in the browser.

## Intended use

This library has nothing to do with the streamdeck software produced by Elgato. There is nothing here to install and run. This is a library to help developers make alternatives to that software

## Installing & Usage

Check one of the installable packages for installation and usage instructions:

-   [`@elgato-stream-deck/node`](https://npm.im/@elgato-stream-deck/node)
-   [`@elgato-stream-deck/webhid`](https://npm.im/@elgato-stream-deck/webhid)

### Have another hid target you wish to use?

The existing implementations are a light wrapper around the platform agnostic [`@elgato-stream-deck/core`](https://npm.im/@elgato-stream-deck/core). You can use your own HID implementation and device scanning/opening logic and reuse all the streamdeck bits.

## Demo

If you are using a Chromium v89+ based browser, you can try out the [webhid demo](https://julusian.github.io/node-elgato-stream-deck/)

## Linux

On linux, the udev subsystem blocks access to the StreamDeck without some special configuration.
Copy one of the following files into `/etc/udev/rules.d/` and reload the rules with `sudo udevadm control --reload-rules`

-   Use the [headless server](./packages/node/udev/50-elgato-stream-deck-headless.rules) version when your software will be running as a system service, and is not related to a logged in user
-   Use the [desktop user](./packages/node/udev/50-elgato-stream-deck-user.rules) version when your software is run by a user session on a distribution using systemd

Unplug and replug the device and it should be usable

## Contributing

The elgato-stream-deck team enthusiastically welcomes contributions and project participation! There's a bunch of things you can do if you want to contribute! Please don't hesitate to jump in if you'd like to, or even ask us questions if something isn't clear.

Please refer to the [Changelog](CHANGELOG.md) for project history details, too.
