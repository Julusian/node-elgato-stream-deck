import type { StreamDeck } from '@elgato-stream-deck/webhid';
import type { Demo } from './demo.js';
export declare class RapidFillDemo implements Demo {
    private interval;
    private running;
    start(device: StreamDeck): Promise<void>;
    stop(device: StreamDeck): Promise<void>;
    keyDown(_device: StreamDeck, _keyIndex: number): Promise<void>;
    keyUp(_device: StreamDeck, _keyIndex: number): Promise<void>;
}
//# sourceMappingURL=rapid-fill.d.ts.map