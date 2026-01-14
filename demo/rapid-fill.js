"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapidFillDemo = void 0;
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class RapidFillDemo {
    interval;
    running;
    async start(device) {
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    const r = getRandomIntInclusive(0, 255);
                    const g = getRandomIntInclusive(0, 255);
                    const b = getRandomIntInclusive(0, 255);
                    console.log('Filling with rgb(%d, %d, %d)', r, g, b);
                    const ps = [];
                    for (const control of device.CONTROLS) {
                        if (control.type === 'button') {
                            ps.push(device.fillKeyColor(control.index, r, g, b));
                        }
                    }
                    this.running = Promise.all(ps);
                    await this.running;
                    this.running = undefined;
                }
            };
            this.interval = window.setInterval(() => {
                doThing().catch((e) => console.log(e));
            }, 1000 / 5);
        }
    }
    async stop(device) {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
        await this.running;
        await device.clearPanel();
    }
    async keyDown(_device, _keyIndex) {
        // Nothing to do
    }
    async keyUp(_device, _keyIndex) {
        // Nothing to do
    }
}
exports.RapidFillDemo = RapidFillDemo;
//# sourceMappingURL=rapid-fill.js.map