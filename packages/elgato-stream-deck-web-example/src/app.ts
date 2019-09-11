import { requestStreamDeck, StreamDeck } from 'elgato-stream-deck-web'

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

const consentButton = document.getElementById('consent-button')
if (consentButton) {
	let device: StreamDeck | null = null

	const brightnessRange = document.getElementById('brightness-range') as HTMLInputElement
	if (brightnessRange) {
		brightnessRange.addEventListener('input', _e => {
			const value = (brightnessRange.value as any) as number
			if (device) {
				device.setBrightness(value)
			}
		})
	}

	consentButton.addEventListener('click', async () => {
		if (device) {
			appendLog('Closing device')
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

		device.on('down', key => appendLog(`Key ${key} down`))
		device.on('up', key => appendLog(`Key ${key} up`))

		// Sample actions
		device.setBrightness(70)

		device.fillColor(2, 255, 0, 0)
		device.fillColor(12, 0, 0, 255)
	})

	appendLog('Page loaded')
}
