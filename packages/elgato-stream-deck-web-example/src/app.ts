import { requestStreamDeck, StreamDeckWeb } from 'elgato-stream-deck-web'
import { Demo } from './demo/demo'
import { DomImageDemo } from './demo/dom'
import { FillWhenPressedDemo } from './demo/fill-when-pressed'
import { RapidFillDemo } from './demo/rapid-fill'

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

const consentButton = document.getElementById('consent-button')
if (consentButton) {
	let demo: Demo = new FillWhenPressedDemo()
	let device: StreamDeckWeb | null = null

	const brightnessRange = document.getElementById('brightness-range') as HTMLInputElement | undefined
	if (brightnessRange) {
		brightnessRange.addEventListener('input', _e => {
			const value = (brightnessRange.value as any) as number
			if (device) {
				device.setBrightness(value)
			}
		})
	}

	const demoSelect = document.getElementById('demo-select') as HTMLInputElement | undefined
	function demoChange() {
		if (demoSelect) {
			console.log(`Selected demo: ${demoSelect.value}`)
			if (device) {
				demo.stop(device)
			}

			switch (demoSelect.value) {
				case 'rapid-fill':
					demo = new RapidFillDemo()
					break
				case 'dom':
					demo = new DomImageDemo()
					break
				case 'fill-when-pressed':
				default:
					demo = new FillWhenPressedDemo()
					break
			}

			if (device) {
				demo.start(device)
			}
		}
	}
	if (demoSelect) {
		demoSelect.addEventListener('input', demoChange)
		demoChange()
	}

	consentButton.addEventListener('click', async () => {
		if (device) {
			appendLog('Closing device')
			demo.stop(device)
			await device.close()
			device = null
		}
		// Prompt for a device
		try {
			device = await requestStreamDeck()
			if (!device) {
				appendLog('No device was selected')
				return
			}
		} catch (error) {
			appendLog(`No device access granted: ${error}`)
			return
		}

		appendLog(
			`Device opened. Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`
		)

		device.on('down', key => {
			appendLog(`Key ${key} down`)
			demo.keyDown(device!, key)
		})
		device.on('up', key => {
			appendLog(`Key ${key} up`)
			demo.keyUp(device!, key)
		})

		demo.start(device)

		// Sample actions
		device.setBrightness(70)

		// device.fillColor(2, 255, 0, 0)
		// device.fillColor(12, 0, 0, 255)
	})

	appendLog('Page loaded')
}
