import type { StreamDeck } from '@elgato-stream-deck/webhid';
import type { Demo } from './demo.js';
export declare class FillWhenPressedDemo implements Demo {
    private pressed;
    start(device: StreamDeck): Promise<void>;
    stop(device: StreamDeck): Promise<void>;
    keyDown(device: StreamDeck, keyIndex: number): Promise<void>;
    keyUp(device: StreamDeck, keyIndex: number): Promise<void>;
}
//# sourceMappingURL=fill-when-pressed.d.ts.map