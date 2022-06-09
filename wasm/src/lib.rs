use core::result::Result;
// use js_sys::Error;
use wasm_bindgen::prelude::*;
// use wasm_bindgen::throw_str;

#[wasm_bindgen]
pub fn hello(
	src: &[u8],
	dest: &mut [u8],
	source_format: &str,
	source_stride: usize,
	source_offset: usize,
	target_format: &str,
	target_offset: usize,
	x_flip: bool,
	y_flip: bool,
	rotate: bool,
	// source_options: &JsValue,
	// target_options: &JsValue,
	image_size: usize,
) {
	// 	if let Ok(source_options) = source_options.into_serde::<SourceOptions>() {
	// 		if let Ok(target_options) = target_options.into_serde::<TargetOptions>() {
	// TODO - check buffer lengths!

	// const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3)
	let flip_colours = source_format[0..3].ne(&target_format[0..3]);
	let target_format_len = target_format.len();

	for y in 0..image_size {
		let row_offset = target_offset + image_size * target_format_len * y;
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

			let src_offset = y2 * source_stride + source_offset + x2 * target_format_len;

			let red = src[src_offset];
			let green = src[src_offset + 1];
			let blue = src[src_offset + 2];

			let target_offset = row_offset + x * target_format_len;
			if flip_colours {
				dest[target_offset] = blue;
				dest[target_offset + 1] = green;
				dest[target_offset + 2] = red;
			} else {
				dest[target_offset] = red;
				dest[target_offset + 1] = green;
				dest[target_offset + 2] = blue;
			}

			if target_format.len() == 4 {
				dest[target_offset + 3] = 255;
			}
		}
	}

	// 	} else {
	// 		throw_str("Failed to parse target_options")
	// 	}
	// } else {
	// 	throw_str("Failed to parse source_options")
	// }
}
