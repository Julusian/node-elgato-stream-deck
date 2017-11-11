'use strict';

const sharp = require('sharp');
const path = require('path');
const PImage = require('pureimage');
const streamBuffers = require('stream-buffers');
const streamDeck = require('../index');

const font = PImage.registerFont(path.resolve(__dirname, 'SourceSansPro-Regular.ttf'), 'Source Sans Pro');
font.load(() => {
	streamDeck.on('down', async keyIndex => {
		const img = PImage.make(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE);
		const ctx = img.getContext('2d');
		ctx.clearRect(0, 0, streamDeck.ICON_SIZE, streamDeck.ICON_SIZE); // As of v0.1, pureimage fills the canvas with black by default.
		ctx.font = '16pt "Source Sans Pro"';
		ctx.USE_FONT_GLYPH_CACHING = false;
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 3;
		ctx.strokeText('FOOBAR', 8, 60);
		ctx.fillStyle = '#ffffff';
		ctx.fillText('FOOBAR', 8, 60);

		const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
			initialSize: 20736, // Start at what should be the exact size we need
			incrementAmount: 1024 // Grow by 1 kilobyte each time buffer overflows.
		});

		try {
			// Pureimage _does_ have an encodePNGSync method, but it seems to output corrupt files.
			// For now, we've forced to use the async encodePNG() method instead.
			// Also unfortunately: encodePNG() must write to a stream, so that's why we have a
			// WriteableStreamBuffer up there receiving the PNG output.
			await PImage.encodePNGToStream(img, writableStreamBuffer);

			// For some reason, adding an overlayWith command forces the final image to have
			// an alpha channel, even if we call .flatten().
			// To work around this, we have to overlay the image, render it as a PNG,
			// then put that PNG back into Sharp, flatten it, and render raw.
			// Seems like a bug in Sharp that we should make a test case for and report.
			const pngBuffer = await sharp(path.resolve(__dirname, 'github_logo.png'))
				.resize(streamDeck.ICON_SIZE)
				.overlayWith(writableStreamBuffer.getContents())
				.png()
				.toBuffer();
			const finalBuffer = await sharp(pngBuffer).flatten().raw().toBuffer();
			await streamDeck.fillImage(keyIndex, finalBuffer);
		} catch (error) {
			console.error(error);
		}
	});

	streamDeck.on('up', keyIndex => {
		// Clear the key when it is released.
		streamDeck.clearKey(keyIndex);
	});

	streamDeck.on('error', error => {
		console.error(error);
	});
});
