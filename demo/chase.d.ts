import type { StreamDeck } from '@elgato-stream-deck/webhid';
import type { Demo } from './demo.js';
export declare class ChaseDemo implements Demo {
    private pressed;
    private counter;
    private interval;
    private running;
    private drawButtons;
    start(device: StreamDeck): Promise<void>;
    stop(device: StreamDeck): Promise<void>;
    keyDown(device: StreamDeck, keyIndex: number): Promise<void>;
    keyUp(device: StreamDeck, keyIndex: number): Promise<void>;
}
//# sourceMappingURL=chase.d.ts.map