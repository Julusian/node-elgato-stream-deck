export async function encodeJPEG(buffer: Buffer, width: number, height: number): Promise<Buffer> {
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
