/**
 * The default JPEG encoder.
 * Utilises a hidden canvas to convert a byte array buffer into a jpeg
 * @param buffer The buffer to convert
 * @param width Width of the image
 * @param height Hieght of the image
 */
export async function encodeJPEG(buffer: Uint8Array, width: number, height: number): Promise<Uint8Array> {
	const blob = await new Promise<Blob>((resolve, reject) => {
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d')
		if (ctx) {
			const imageData = ctx.createImageData(width, height)
			imageData.data.set(buffer)
			ctx.putImageData(imageData, 0, 0)
			canvas.toBlob(
				(b) => {
					if (b) {
						resolve(b)
					} else {
						reject()
					}
				},
				'image/jpeg',
				0.9
			)
		} else {
			reject()
		}
	})
	return Buffer.from(await blob.arrayBuffer())
}
