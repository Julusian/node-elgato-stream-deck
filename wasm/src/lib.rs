use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn image_to_byte_array(
	src: &[u8],
	dest: &mut [u8],
	src_format_len: usize,
	dest_format_len: usize,
	flip_colours: bool,
	x_flip: bool,
	y_flip: bool,
	rotate: bool,
	image_size: usize,
) {
	// TODO - check buffer lengths?

	let source_stride = image_size * src_format_len;
	let dest_stride = image_size * dest_format_len;

	for y in 0..image_size {
		let row_offset = dest_stride * y;
		for x in 0..image_size {
			let (x2, y2) = {
				let mut x2 = x;
				let mut y2 = y;

				if x_flip {
					x2 = image_size - x2 - 1;
				}
				if y_flip {
					y2 = image_size - y2 - 1;
				}

				if rotate {
					(y2, x2)
				} else {
					(x2, y2)
				}
			};

			let src_offset = y2 * source_stride + x2 * src_format_len;

			let red = src[src_offset];
			let green = src[src_offset + 1];
			let blue = src[src_offset + 2];

			let target_offset = row_offset + x * dest_format_len;
			if flip_colours {
				dest[target_offset] = blue;
				dest[target_offset + 1] = green;
				dest[target_offset + 2] = red;
			} else {
				dest[target_offset] = red;
				dest[target_offset + 1] = green;
				dest[target_offset + 2] = blue;
			}

			if dest_format_len > 3 {
				dest[target_offset + 3] = 255;
			}
		}
	}

}
