interface IStreamDeck {
	readonly ICON_SIZE: number;
	write(buffer: Buffer): any;
	clearKey(keyIndex: number): void;
	fillColor(keyIndex: number, r: number, g: number, b: number): void;
	fillImage(keyIndex: number, imageBuffer: Buffer): void;
	fillImageFromFile(keyIndex: number, filePath: string): Promise<void>;

	bufferToIntArray(buffer: Buffer): number[];

	on(event: 'up', handler: (key: number) => void): this;
	on(event: 'down', handler: (key: number) => void): this;

	on(event: 'error', handler: (error: Error) => void): this;
}

const streamDeck: IStreamDeck;
export = streamDeck;
