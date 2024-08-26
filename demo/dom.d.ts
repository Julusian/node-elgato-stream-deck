import type { StreamDeckWeb } from '@elgato-stream-deck/webhid';
import type { Demo } from './demo.js';
/**
 * This demo is using html-to-image to render a div to the streamdeck.
 * Performance is not great, and the conversion library has many issues with rendering in
 * various cases, but if the source material is very controlled it could be useful.
 * It would be better to render natively on a canvas.
 */
export declare class DomImageDemo implements Demo {
    private element;
    private run;
    private running;
    start(device: StreamDeckWeb): Promise<void>;
    stop(device: StreamDeckWeb): Promise<void>;
    keyDown(_device: StreamDeckWeb, _keyIndex: number): Promise<void>;
    keyUp(_device: StreamDeckWeb, _keyIndex: number): Promise<void>;
}
//# sourceMappingURL=dom.d.ts.map