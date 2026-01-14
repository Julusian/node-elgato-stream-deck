"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChaseDemo = void 0;
class ChaseDemo {
    pressed = [];
    counter = 0;
    interval;
    running;
    async drawButtons(device, controls, c) {
        const ps = [];
        for (const { control, canvas } of controls) {
            // We probably should reuse this instead of creating it each time.
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const n = c + control.index;
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Start with a font that's 80% as high as the button. maxWidth
                // is used on the stroke and fill calls below to scale down.
                ctx.font = `${canvas.height * 0.8}px "Arial"`;
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 1;
                ctx.strokeText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8);
                ctx.fillStyle = 'white';
                ctx.fillText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8);
                const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ps.push(device.fillKeyBuffer(control.index, id.data, { format: 'rgba' }));
                ctx.restore();
            }
        }
        await Promise.all(ps);
    }
    async start(device) {
        await device.clearPanel();
        this.counter = 0;
        const controls = device.CONTROLS.filter((control) => control.type === 'button' && control.feedbackType === 'lcd').sort((a, b) => b.index - a.index);
        const controlsAndCanvases = controls.map((control) => {
            const canvas = document.createElement('canvas');
            canvas.width = control.pixelSize.width;
            canvas.height = control.pixelSize.height;
            return { control, canvas };
        });
        await this.drawButtons(device, controlsAndCanvases, this.counter);
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    this.running = this.drawButtons(device, controlsAndCanvases, ++this.counter);
                    await this.running;
                    this.running = undefined;
                }
            };
            this.interval = window.setInterval(() => {
                doThing().catch((e) => console.error(e));
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
    async keyDown(device, keyIndex) {
        if (this.pressed.indexOf(keyIndex) === -1) {
            this.pressed.push(keyIndex);
            await device.fillKeyColor(keyIndex, 255, 0, 0);
        }
    }
    async keyUp(device, keyIndex) {
        const index = this.pressed.indexOf(keyIndex);
        if (index !== -1) {
            this.pressed.splice(index, 1);
            await device.clearKey(keyIndex);
        }
    }
}
exports.ChaseDemo = ChaseDemo;
//# sourceMappingURL=chase.js.map