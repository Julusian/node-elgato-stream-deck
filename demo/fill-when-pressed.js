"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FillWhenPressedDemo = void 0;
class FillWhenPressedDemo {
    pressed = [];
    async start(device) {
        await device.clearPanel();
    }
    async stop(device) {
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
exports.FillWhenPressedDemo = FillWhenPressedDemo;
//# sourceMappingURL=fill-when-pressed.js.map