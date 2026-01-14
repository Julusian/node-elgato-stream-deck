"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomImageDemo = void 0;
const html_to_image_1 = require("html-to-image");
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
/**
 * This demo is using html-to-image to render a div to the streamdeck.
 * Performance is not great, and the conversion library has many issues with rendering in
 * various cases, but if the source material is very controlled it could be useful.
 * It would be better to render natively on a canvas.
 */
class DomImageDemo {
    element;
    run = false;
    running;
    async start(device) {
        this.element = document.querySelector('#image-source') || undefined;
        if (this.element) {
            this.element.style.display = 'block';
        }
        if (!this.run) {
            this.run = true;
            const runTick = () => {
                if (this.element && this.run) {
                    const elm = this.element;
                    (0, html_to_image_1.toCanvas)(elm)
                        .then(async (canvas) => {
                        this.running = device.fillPanelCanvas(canvas);
                        await this.running;
                        this.running = undefined;
                        // It would run smoother to set the next tick going before sending to the panel, but then it becomes a race that could go wrong
                        runTick();
                    })
                        .catch(console.error);
                }
            };
            runTick();
        }
    }
    async stop(device) {
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.run = false;
        await this.running;
        await device.clearPanel();
    }
    async keyDown(_device, _keyIndex) {
        if (this.element) {
            this.element.style.background = getRandomColor();
        }
    }
    async keyUp(_device, _keyIndex) {
        // Nothing to do
    }
}
exports.DomImageDemo = DomImageDemo;
//# sourceMappingURL=dom.js.map