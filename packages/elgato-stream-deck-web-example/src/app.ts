import { requestStreamDeck, StreamDeck } from 'elgato-stream-deck-web'

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

const consentButton = document.getElementById('consent-button')
if (consentButton) {
	consentButton.addEventListener('click', async () => {
		// Prompt for a device
		let device: StreamDeck
		try {
			const device2 = await requestStreamDeck()
			if (!device2) {
				appendLog('No device was selected')
				return
			}
			device = device2
		} catch (error) {
			appendLog(`No device access granted: ${error}`)
			return
		}

		appendLog(
			`Device opened. Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`
		)

		// Sample actions
		device.setBrightness(70)

		device.fillColor(2, 255, 0, 0)
		device.fillColor(12, 0, 0, 255)
	})

	appendLog('Page loaded')
}
