/* eslint-disable n/no-extraneous-import */
// @ts-check

import fs from 'node:fs/promises'

// eslint-disable-next-line n/no-missing-import
import { UdevRuleGenerator } from '../../udev-generator/dist/main.js'
import { DEVICE_MODELS2, VENDOR_ID } from '@elgato-stream-deck/core'

const generator = new UdevRuleGenerator()

for (const model of Object.values(DEVICE_MODELS2)) {
	for (const productId of model.productIds) {
		if (productId >= 0xfff0) continue // Skip reserved product IDs
		generator.addDevice(VENDOR_ID, productId)
	}
}

const headlessStr = generator.generateFile({
	mode: 'headless',
})
const desktopStr = generator.generateFile({
	mode: 'desktop',
})

const rulesJSON = JSON.stringify(generator.rules, undefined, '\t')

await fs.writeFile(new URL('../packages/node/udev/50-elgato-stream-deck-user.rules', import.meta.url), desktopStr)
await fs.writeFile(new URL('../packages/node/udev/50-elgato-stream-deck-headless.rules', import.meta.url), headlessStr)

await fs.writeFile(new URL('../packages/webhid/udev/50-elgato-stream-deck-user.rules', import.meta.url), desktopStr)

await fs.writeFile(new URL('../packages/node/udev-generator-rules.json', import.meta.url), rulesJSON)
await fs.writeFile(new URL('../packages/webhid/udev-generator-rules.json', import.meta.url), rulesJSON)

console.log('Udev rules regenerated successfully!')
