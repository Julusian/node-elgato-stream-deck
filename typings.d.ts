interface SharpOptions {
  failOnError?: boolean;
  density?: number;
  raw?: {
    width?: number,
    height?: number,
    channels?: number,
  };
  create?: {
    width?: number,
    height?: number,
    channels?: number,
    background?: string | any;
  };
}

declare class StreamDeck {
	readonly ICON_SIZE: number;

	static checkRGBValue(value: number): void;
	static checkValidKeyIndex(keyIndex: number): void;
	static bufferToIntArray(buffer: Buffer): Array<number>;

	constructor(devicePath?: string);
	write(buffer: Buffer): void;
	sendFeatureReport(buffer: Buffer): void;

	setBrightness(percentage: number): void;

	clearKey(keyIndex: number): void;
	clearAllKeys(): void;

	fillColor(keyIndex: number, r: number, g: number, b: number): void;
	fillImage(keyIndex: number, imageBuffer: Buffer): void;
	fillImageFromFile(keyIndex: number, filePath: string): Promise<void>;
	fillPanel(imagePathOrBuffer: string | Buffer, sharpOptions: SharpOptions): Promise<void>;

	bufferToIntArray(buffer: Buffer): number[];

	on(event: 'up', handler: (key: number) => void): this;
	on(event: 'down', handler: (key: number) => void): this;

	on(event: 'error', handler: (error: Error) => void): this;
}

export = StreamDeck;
