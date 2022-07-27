/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 277:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 291:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



const base64 = __webpack_require__(277)
const ieee754 = __webpack_require__(608)
const customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.lW = Buffer
__webpack_unused_export__ = SlowBuffer
exports.h2 = 50

const K_MAX_LENGTH = 0x7fffffff
__webpack_unused_export__ = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    const arr = new Uint8Array(1)
    const proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  const buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  const valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  const b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  const length = byteLength(string, encoding) | 0
  let buf = createBuffer(length)

  const actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  const length = array.length < 0 ? 0 : checked(array.length) | 0
  const buf = createBuffer(length)
  for (let i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    const copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  let buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    const len = checked(obj.length) | 0
    const buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  let x = a.length
  let y = b.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  let i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  const buffer = Buffer.allocUnsafe(length)
  let pos = 0
  for (i = 0; i < list.length; ++i) {
    let buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
        buf.copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  const len = string.length
  const mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  let loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  const i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  const len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  const len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  const len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  const length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  let str = ''
  const max = exports.h2
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  let x = thisEnd - thisStart
  let y = end - start
  const len = Math.min(x, y)

  const thisCopy = this.slice(thisStart, thisEnd)
  const targetCopy = target.slice(start, end)

  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  let indexSize = 1
  let arrLength = arr.length
  let valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  let i
  if (dir) {
    let foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      let found = true
      for (let j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  const remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i
  for (i = 0; i < length; ++i) {
    const parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  const remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  const res = []

  let i = start
  while (i < end) {
    const firstByte = buf[i]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  const bytes = buf.slice(start, end)
  let res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (let i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  const len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  const newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  let val = this[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const lo = first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24

  const hi = this[++offset] +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    last * 2 ** 24

  return BigInt(lo) + (BigInt(hi) << BigInt(32))
})

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const hi = first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  const lo = this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last

  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
})

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let i = byteLength
  let mul = 1
  let val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = this[offset + 4] +
    this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 +
    (last << 24) // Overflow

  return (BigInt(val) << BigInt(32)) +
    BigInt(first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24)
})

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) +
    BigInt(this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
})

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let mul = 1
  let i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let i = byteLength - 1
  let mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function wrtBigUInt64LE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  return offset
}

function wrtBigUInt64BE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = 0
  let mul = 1
  let sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  const len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      const code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  let i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    const bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    const len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {}
function E (sym, getMessage, Base) {
  errors[sym] = class NodeError extends Base {
    constructor () {
      super()

      Object.defineProperty(this, 'message', {
        value: getMessage.apply(this, arguments),
        writable: true,
        configurable: true
      })

      // Add the error code to the name to include it in the stack trace.
      this.name = `${this.name} [${sym}]`
      // Access the stack to generate the error message including the error code
      // from the name.
      this.stack // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete this.name
    }

    get code () {
      return sym
    }

    set code (value) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }

    toString () {
      return `${this.name} [${sym}]: ${this.message}`
    }
  }
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
  function (name) {
    if (name) {
      return `${name} is outside of buffer bounds`
    }

    return 'Attempt to access memory outside buffer bounds'
  }, RangeError)
E('ERR_INVALID_ARG_TYPE',
  function (name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
  }, TypeError)
E('ERR_OUT_OF_RANGE',
  function (str, range, input) {
    let msg = `The value of "${str}" is out of range.`
    let received = input
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    }
    msg += ` It must be ${range}. Received ${received}`
    return msg
  }, RangeError)

function addNumericalSeparator (val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}

// CHECK FUNCTIONS
// ===============

function checkBounds (buf, offset, byteLength) {
  validateNumber(offset, 'offset')
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1))
  }
}

function checkIntBI (value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === 'bigint' ? 'n' : ''
    let range
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                `${(byteLength + 1) * 8 - 1}${n}`
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
  }
  checkBounds(buf, offset, byteLength)
}

function validateNumber (value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
}

function boundsError (value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type)
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
  }

  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
  }

  throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                    `>= ${type ? 1 : 0} and <= ${length}`,
                                    value)
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  let c, hi, lo
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  let i
  for (i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

// Return not function with Error if BigInt not supported
function defineBigIntMethod (fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
}

function BufferBigIntNotDefined () {
  throw new Error('BigInt not supported')
}


/***/ }),

/***/ 399:
/***/ ((module) => {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ 531:
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ 688:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "getFontEmbedCSS": () => (/* binding */ getFontEmbedCSS),
  "toBlob": () => (/* binding */ toBlob),
  "toCanvas": () => (/* binding */ toCanvas),
  "toJpeg": () => (/* binding */ toJpeg),
  "toPixelData": () => (/* binding */ toPixelData),
  "toPng": () => (/* binding */ toPng),
  "toSvg": () => (/* binding */ toSvg)
});

;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/util.js
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const WOFF = 'application/font-woff';
const JPEG = 'image/jpeg';
const mimes = {
    woff: WOFF,
    woff2: WOFF,
    ttf: 'application/font-truetype',
    eot: 'application/vnd.ms-fontobject',
    png: 'image/png',
    jpg: JPEG,
    jpeg: JPEG,
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
};
function getExtension(url) {
    const match = /\.([^./]*?)$/g.exec(url);
    return match ? match[1] : '';
}
function getMimeType(url) {
    const extension = getExtension(url).toLowerCase();
    return mimes[extension] || '';
}
function resolveUrl(url, baseUrl) {
    // url is absolute already
    if (url.match(/^[a-z]+:\/\//i)) {
        return url;
    }
    // url is absolute already, without protocol
    if (url.match(/^\/\//)) {
        return window.location.protocol + url;
    }
    // dataURI, mailto:, tel:, etc.
    if (url.match(/^[a-z]+:/i)) {
        return url;
    }
    const doc = document.implementation.createHTMLDocument();
    const base = doc.createElement('base');
    const a = doc.createElement('a');
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl) {
        base.href = baseUrl;
    }
    a.href = url;
    return a.href;
}
function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
    return `data:${mimeType};base64,${content}`;
}
function parseDataUrlContent(dataURL) {
    return dataURL.split(/,/)[1];
}
const uuid = (function uuid() {
    // generate uuid for className of pseudo elements.
    // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
    let counter = 0;
    // ref: http://stackoverflow.com/a/6248722/2519373
    const random = () => 
    // eslint-disable-next-line no-bitwise
    `0000${((Math.random() * Math.pow(36, 4)) << 0).toString(36)}`.slice(-4);
    return () => {
        counter += 1;
        return `u${random()}${counter}`;
    };
})();
const delay = (ms) => (args) => new Promise((resolve) => setTimeout(() => resolve(args), ms));
function toArray(arrayLike) {
    const arr = [];
    for (let i = 0, l = arrayLike.length; i < l; i += 1) {
        arr.push(arrayLike[i]);
    }
    return arr;
}
function px(node, styleProperty) {
    const val = window.getComputedStyle(node).getPropertyValue(styleProperty);
    return parseFloat(val.replace('px', ''));
}
function getNodeWidth(node) {
    const leftBorder = px(node, 'border-left-width');
    const rightBorder = px(node, 'border-right-width');
    return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
    const topBorder = px(node, 'border-top-width');
    const bottomBorder = px(node, 'border-bottom-width');
    return node.clientHeight + topBorder + bottomBorder;
}
function getPixelRatio() {
    let ratio;
    let FINAL_PROCESS;
    try {
        FINAL_PROCESS = process;
    }
    catch (e) {
        // pass
    }
    const val = FINAL_PROCESS && FINAL_PROCESS.env
        ? FINAL_PROCESS.env.devicePixelRatio
        : null;
    if (val) {
        ratio = parseInt(val, 10);
        if (Number.isNaN(ratio)) {
            ratio = 1;
        }
    }
    return ratio || window.devicePixelRatio || 1;
}
function canvasToBlob(canvas) {
    if (canvas.toBlob) {
        return new Promise((resolve) => canvas.toBlob(resolve));
    }
    return new Promise((resolve) => {
        const binaryString = window.atob(canvas.toDataURL().split(',')[1]);
        const len = binaryString.length;
        const binaryArray = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
            binaryArray[i] = binaryString.charCodeAt(i);
        }
        resolve(new Blob([binaryArray], { type: 'image/png' }));
    });
}
function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.decoding = 'sync';
        img.src = url;
    });
}
function svgToDataURL(svg) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve()
            .then(() => new XMLSerializer().serializeToString(svg))
            .then(encodeURIComponent)
            .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
    });
}
function nodeToDataURL(node, width, height) {
    return __awaiter(this, void 0, void 0, function* () {
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        const foreignObject = document.createElementNS(xmlns, 'foreignObject');
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        foreignObject.setAttribute('width', '100%');
        foreignObject.setAttribute('height', '100%');
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        foreignObject.setAttribute('externalResourcesRequired', 'true');
        svg.appendChild(foreignObject);
        foreignObject.appendChild(node);
        return svgToDataURL(svg);
    });
}
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/getBlobFromURL.js

const cache = {};
function getCacheKey(url) {
    let key = url.replace(/\?.*/, '');
    // font resourse
    if (/ttf|otf|eot|woff2?/i.test(key)) {
        key = key.replace(/.*\//, '');
    }
    return key;
}
function getBlobFromURL(url, options) {
    const cacheKey = getCacheKey(url);
    if (cache[cacheKey] != null) {
        return cache[cacheKey];
    }
    // cache bypass so we dont have CORS issues with cached images
    // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
    if (options.cacheBust) {
        // eslint-disable-next-line no-param-reassign
        url += (/\?/.test(url) ? '&' : '?') + new Date().getTime();
    }
    const failed = (reason) => {
        let placeholder = '';
        if (options.imagePlaceholder) {
            const parts = options.imagePlaceholder.split(/,/);
            if (parts && parts[1]) {
                placeholder = parts[1];
            }
        }
        let msg = `Failed to fetch resource: ${url}`;
        if (reason) {
            msg = typeof reason === 'string' ? reason : reason.message;
        }
        if (msg) {
            console.error(msg);
        }
        return {
            blob: placeholder,
            contentType: '',
        };
    };
    const deferred = window
        .fetch(url)
        .then((res) => 
    // eslint-disable-next-line promise/no-nesting
    res.blob().then((blob) => ({
        blob,
        contentType: res.headers.get('Content-Type') || '',
    })))
        .then(({ blob, contentType }) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            contentType,
            blob: reader.result,
        });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    }))
        .then(({ blob, contentType }) => ({
        contentType,
        blob: parseDataUrlContent(blob),
    }))
        // on failed
        .catch(failed);
    // cache result
    cache[cacheKey] = deferred;
    return deferred;
}
//# sourceMappingURL=getBlobFromURL.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/clonePseudoElements.js

function formatCSSText(style) {
    const content = style.getPropertyValue('content');
    return `${style.cssText} content: '${content.replace(/'|"/g, '')}';`;
}
function formatCSSProperties(style) {
    return toArray(style)
        .map((name) => {
        const value = style.getPropertyValue(name);
        const priority = style.getPropertyPriority(name);
        return `${name}: ${value}${priority ? ' !important' : ''};`;
    })
        .join(' ');
}
function getPseudoElementStyle(className, pseudo, style) {
    const selector = `.${className}:${pseudo}`;
    const cssText = style.cssText
        ? formatCSSText(style)
        : formatCSSProperties(style);
    return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
    const style = window.getComputedStyle(nativeNode, pseudo);
    const content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    const className = uuid();
    try {
        clonedNode.className = `${clonedNode.className} ${className}`;
    }
    catch (err) {
        return;
    }
    const styleElement = document.createElement('style');
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
    clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode) {
    clonePseudoElement(nativeNode, clonedNode, ':before');
    clonePseudoElement(nativeNode, clonedNode, ':after');
}
//# sourceMappingURL=clonePseudoElements.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/cloneNode.js
var cloneNode_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



function cloneCanvasElement(node) {
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        const dataURL = node.toDataURL();
        if (dataURL === 'data:,') {
            return Promise.resolve(node.cloneNode(false));
        }
        return createImage(dataURL);
    });
}
function cloneVideoElement(node, options) {
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(node.poster)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(node.poster) || data.contentType))
            .then((dataURL) => createImage(dataURL));
    });
}
function cloneSingleNode(node, options) {
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        if (node instanceof HTMLCanvasElement) {
            return cloneCanvasElement(node);
        }
        if (node instanceof HTMLVideoElement && node.poster) {
            return cloneVideoElement(node, options);
        }
        return Promise.resolve(node.cloneNode(false));
    });
}
const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
function cloneChildren(nativeNode, clonedNode, options) {
    var _a;
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        const children = isSlotElement(nativeNode) && nativeNode.assignedNodes
            ? toArray(nativeNode.assignedNodes())
            : toArray(((_a = nativeNode.shadowRoot) !== null && _a !== void 0 ? _a : nativeNode).childNodes);
        if (children.length === 0 || nativeNode instanceof HTMLVideoElement) {
            return Promise.resolve(clonedNode);
        }
        return children
            .reduce((deferred, child) => deferred
            // eslint-disable-next-line no-use-before-define
            .then(() => cloneNode(child, options))
            .then((clonedChild) => {
            // eslint-disable-next-line promise/always-return
            if (clonedChild) {
                clonedNode.appendChild(clonedChild);
            }
        }), Promise.resolve())
            .then(() => clonedNode);
    });
}
function cloneCSSStyle(nativeNode, clonedNode) {
    const source = window.getComputedStyle(nativeNode);
    const target = clonedNode.style;
    if (!target) {
        return;
    }
    if (source.cssText) {
        target.cssText = source.cssText;
    }
    else {
        toArray(source).forEach((name) => {
            target.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
        });
    }
}
function cloneInputValue(nativeNode, clonedNode) {
    if (nativeNode instanceof HTMLTextAreaElement) {
        clonedNode.innerHTML = nativeNode.value;
    }
    if (nativeNode instanceof HTMLInputElement) {
        clonedNode.setAttribute('value', nativeNode.value);
    }
}
function decorate(nativeNode, clonedNode) {
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve()
            .then(() => cloneCSSStyle(nativeNode, clonedNode))
            .then(() => clonePseudoElements(nativeNode, clonedNode))
            .then(() => cloneInputValue(nativeNode, clonedNode))
            .then(() => clonedNode);
    });
}
function cloneNode(node, options, isRoot) {
    return cloneNode_awaiter(this, void 0, void 0, function* () {
        if (!isRoot && options.filter && !options.filter(node)) {
            return Promise.resolve(null);
        }
        return Promise.resolve(node)
            .then((clonedNode) => cloneSingleNode(clonedNode, options))
            .then((clonedNode) => cloneChildren(node, clonedNode, options))
            .then((clonedNode) => decorate(node, clonedNode));
    });
}
//# sourceMappingURL=cloneNode.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embedResources.js
var embedResources_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["'])([^"']+)\1\)/g;
const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
    // eslint-disable-next-line no-useless-escape
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, 'g');
}
function parseURLs(cssText) {
    const result = [];
    cssText.replace(URL_REGEX, (raw, quotation, url) => {
        result.push(url);
        return raw;
    });
    return result.filter((url) => !isDataUrl(url));
}
function embedResources_embed(cssText, resourceURL, baseURL, options, get) {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    return Promise.resolve(resolvedURL)
        .then((url) => get ? get(url) : getBlobFromURL(url, options))
        .then((data) => {
        if (typeof data === 'string') {
            return makeDataUrl(data, getMimeType(resourceURL));
        }
        return makeDataUrl(data.blob, getMimeType(resourceURL) || data.contentType);
    })
        .then((dataURL) => cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`))
        .then((content) => content, () => resolvedURL);
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
    return !preferredFontFormat
        ? str
        : str.replace(FONT_SRC_REGEX, (match) => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
                if (!format) {
                    return '';
                }
                if (format === preferredFontFormat) {
                    return `src: ${src};`;
                }
            }
        });
}
function shouldEmbed(url) {
    return url.search(URL_REGEX) !== -1;
}
function embedResources(cssText, baseUrl, options) {
    return embedResources_awaiter(this, void 0, void 0, function* () {
        if (!shouldEmbed(cssText)) {
            return Promise.resolve(cssText);
        }
        const filteredCSSText = filterPreferredFontFormat(cssText, options);
        return Promise.resolve(filteredCSSText)
            .then(parseURLs)
            .then((urls) => urls.reduce((deferred, url) => 
        // eslint-disable-next-line promise/no-nesting
        deferred.then((css) => embedResources_embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText)));
    });
}
//# sourceMappingURL=embedResources.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embedImages.js
var embedImages_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



function embedBackground(clonedNode, options) {
    var _a;
    return embedImages_awaiter(this, void 0, void 0, function* () {
        const background = (_a = clonedNode.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue('background');
        if (!background) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(background)
            .then((cssString) => embedResources(cssString, null, options))
            .then((cssString) => {
            clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
            return clonedNode;
        });
    });
}
function embedImageNode(clonedNode, options) {
    return embedImages_awaiter(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof HTMLImageElement && !isDataUrl(clonedNode.src)) &&
            !(clonedNode instanceof SVGImageElement &&
                !isDataUrl(clonedNode.href.baseVal))) {
            return Promise.resolve(clonedNode);
        }
        const src = clonedNode instanceof HTMLImageElement
            ? clonedNode.src
            : clonedNode.href.baseVal;
        return Promise.resolve(src)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(src) || data.contentType))
            .then((dataURL) => new Promise((resolve, reject) => {
            clonedNode.onload = resolve;
            clonedNode.onerror = reject;
            if (clonedNode instanceof HTMLImageElement) {
                clonedNode.srcset = '';
                clonedNode.src = dataURL;
            }
            else {
                clonedNode.href.baseVal = dataURL;
            }
        }))
            .then(() => clonedNode, () => clonedNode);
    });
}
function embedChildren(clonedNode, options) {
    return embedImages_awaiter(this, void 0, void 0, function* () {
        const children = toArray(clonedNode.childNodes);
        // eslint-disable-next-line no-use-before-define
        const deferreds = children.map((child) => embedImages(child, options));
        return Promise.all(deferreds).then(() => clonedNode);
    });
}
function embedImages(clonedNode, options) {
    return embedImages_awaiter(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(clonedNode)
            .then((node) => embedBackground(node, options))
            .then((node) => embedImageNode(node, options))
            .then((node) => embedChildren(node, options));
    });
}
//# sourceMappingURL=embedImages.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/applyStyleWithOptions.js
function applyStyleWithOptions(node, options) {
    const { style } = node;
    if (options.backgroundColor) {
        style.backgroundColor = options.backgroundColor;
    }
    if (options.width) {
        style.width = `${options.width}px`;
    }
    if (options.height) {
        style.height = `${options.height}px`;
    }
    const manual = options.style;
    if (manual != null) {
        Object.keys(manual).forEach((key) => {
            style[key] = manual[key];
        });
    }
    return node;
}
//# sourceMappingURL=applyStyleWithOptions.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embedWebFonts.js
var embedWebFonts_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const cssFetchCache = {};
function fetchCSS(url) {
    const cache = cssFetchCache[url];
    if (cache != null) {
        return cache;
    }
    const deferred = window.fetch(url).then((res) => ({
        url,
        cssText: res.text(),
    }));
    cssFetchCache[url] = deferred;
    return deferred;
}
function embedFonts(meta) {
    return embedWebFonts_awaiter(this, void 0, void 0, function* () {
        return meta.cssText.then((raw) => {
            let cssText = raw;
            const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
            const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
            const loadFonts = fontLocs.map((location) => {
                let url = location.replace(regexUrl, '$1');
                if (!url.startsWith('https://')) {
                    url = new URL(url, meta.url).href;
                }
                // eslint-disable-next-line promise/no-nesting
                return window
                    .fetch(url)
                    .then((res) => res.blob())
                    .then((blob) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Side Effect
                        cssText = cssText.replace(location, `url(${reader.result})`);
                        resolve([location, reader.result]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            });
            // eslint-disable-next-line promise/no-nesting
            return Promise.all(loadFonts).then(() => cssText);
        });
    });
}
function parseCSS(source) {
    if (source == null) {
        return [];
    }
    const result = [];
    const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
    // strip out comments
    let cssText = source.replace(commentsRegex, '');
    const keyframesRegex = new RegExp('((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})', 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const matches = keyframesRegex.exec(cssText);
        if (matches === null) {
            break;
        }
        result.push(matches[0]);
    }
    cssText = cssText.replace(keyframesRegex, '');
    const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    // to match css & media queries together
    const combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
        '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
    // unified regex
    const unifiedRegex = new RegExp(combinedCSSRegex, 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let matches = importRegex.exec(cssText);
        if (matches === null) {
            matches = unifiedRegex.exec(cssText);
            if (matches === null) {
                break;
            }
            else {
                importRegex.lastIndex = unifiedRegex.lastIndex;
            }
        }
        else {
            unifiedRegex.lastIndex = importRegex.lastIndex;
        }
        result.push(matches[0]);
    }
    return result;
}
function getCSSRules(styleSheets) {
    return embedWebFonts_awaiter(this, void 0, void 0, function* () {
        const ret = [];
        const deferreds = [];
        // First loop inlines imports
        styleSheets.forEach((sheet) => {
            if ('cssRules' in sheet) {
                try {
                    toArray(sheet.cssRules).forEach((item, index) => {
                        if (item.type === CSSRule.IMPORT_RULE) {
                            let importIndex = index + 1;
                            const url = item.href;
                            const deferred = fetchCSS(url)
                                .then((metadata) => (metadata ? embedFonts(metadata) : ''))
                                .then((cssText) => parseCSS(cssText).forEach((rule) => {
                                try {
                                    sheet.insertRule(rule, rule.startsWith('@import')
                                        ? (importIndex += 1)
                                        : sheet.cssRules.length);
                                }
                                catch (error) {
                                    console.error('Error inserting rule from remote css', {
                                        rule,
                                        error,
                                    });
                                }
                            }))
                                .catch((e) => {
                                console.error('Error loading remote css', e.toString());
                            });
                            deferreds.push(deferred);
                        }
                    });
                }
                catch (e) {
                    const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
                    if (sheet.href != null) {
                        deferreds.push(fetchCSS(sheet.href)
                            .then((metadata) => (metadata ? embedFonts(metadata) : ''))
                            .then((cssText) => parseCSS(cssText).forEach((rule) => {
                            inline.insertRule(rule, sheet.cssRules.length);
                        }))
                            .catch((err) => {
                            console.error('Error loading remote stylesheet', err.toString());
                        }));
                    }
                    console.error('Error inlining remote css file', e.toString());
                }
            }
        });
        return Promise.all(deferreds).then(() => {
            // Second loop parses rules
            styleSheets.forEach((sheet) => {
                if ('cssRules' in sheet) {
                    try {
                        toArray(sheet.cssRules).forEach((item) => {
                            ret.push(item);
                        });
                    }
                    catch (e) {
                        console.error(`Error while reading CSS rules from ${sheet.href}`, e.toString());
                    }
                }
            });
            return ret;
        });
    });
}
function getWebFontRules(cssRules) {
    return cssRules
        .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
        .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
}
function parseWebFontRules(node) {
    return embedWebFonts_awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (node.ownerDocument == null) {
                reject(new Error('Provided element is not within a Document'));
            }
            resolve(toArray(node.ownerDocument.styleSheets));
        })
            .then((styleSheets) => getCSSRules(styleSheets))
            .then(getWebFontRules);
    });
}
function getWebFontCSS(node, options) {
    return embedWebFonts_awaiter(this, void 0, void 0, function* () {
        return parseWebFontRules(node)
            .then((rules) => Promise.all(rules.map((rule) => {
            const baseUrl = rule.parentStyleSheet
                ? rule.parentStyleSheet.href
                : null;
            return embedResources(rule.cssText, baseUrl, options);
        })))
            .then((cssTexts) => cssTexts.join('\n'));
    });
}
function embedWebFonts(clonedNode, options) {
    return embedWebFonts_awaiter(this, void 0, void 0, function* () {
        return (options.fontEmbedCSS != null
            ? Promise.resolve(options.fontEmbedCSS)
            : getWebFontCSS(clonedNode, options)).then((cssText) => {
            const styleNode = document.createElement('style');
            const sytleContent = document.createTextNode(cssText);
            styleNode.appendChild(sytleContent);
            if (clonedNode.firstChild) {
                clonedNode.insertBefore(styleNode, clonedNode.firstChild);
            }
            else {
                clonedNode.appendChild(styleNode);
            }
            return clonedNode;
        });
    });
}
//# sourceMappingURL=embedWebFonts.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/index.js
var es_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





function getImageSize(node, options = {}) {
    const width = options.width || getNodeWidth(node);
    const height = options.height || getNodeHeight(node);
    return { width, height };
}
function toSvg(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        return Promise.resolve(node)
            .then((nativeNode) => cloneNode(nativeNode, options, true))
            .then((clonedNode) => embedWebFonts(clonedNode, options))
            .then((clonedNode) => embedImages(clonedNode, options))
            .then((clonedNode) => applyStyleWithOptions(clonedNode, options))
            .then((clonedNode) => nodeToDataURL(clonedNode, width, height));
    });
}
const dimensionCanvasLimit = 16384; // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
function checkCanvasDimensions(canvas) {
    if (canvas.width > dimensionCanvasLimit ||
        canvas.height > dimensionCanvasLimit) {
        if (canvas.width > dimensionCanvasLimit &&
            canvas.height > dimensionCanvasLimit) {
            if (canvas.width > canvas.height) {
                canvas.height *= dimensionCanvasLimit / canvas.width;
                canvas.width = dimensionCanvasLimit;
            }
            else {
                canvas.width *= dimensionCanvasLimit / canvas.height;
                canvas.height = dimensionCanvasLimit;
            }
        }
        else if (canvas.width > dimensionCanvasLimit) {
            canvas.height *= dimensionCanvasLimit / canvas.width;
            canvas.width = dimensionCanvasLimit;
        }
        else {
            canvas.width *= dimensionCanvasLimit / canvas.height;
            canvas.height = dimensionCanvasLimit;
        }
    }
}
function toCanvas(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        return toSvg(node, options)
            .then(createImage)
            .then((img) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const ratio = options.pixelRatio || getPixelRatio();
            const { width, height } = getImageSize(node, options);
            const canvasWidth = options.canvasWidth || width;
            const canvasHeight = options.canvasHeight || height;
            canvas.width = canvasWidth * ratio;
            canvas.height = canvasHeight * ratio;
            if (!options.skipAutoScale) {
                checkCanvasDimensions(canvas);
            }
            canvas.style.width = `${canvasWidth}`;
            canvas.style.height = `${canvasHeight}`;
            if (options.backgroundColor) {
                context.fillStyle = options.backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas;
        });
    });
}
function toPixelData(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        return toCanvas(node, options).then((canvas) => {
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, width, height).data;
        });
    });
}
function toPng(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        return toCanvas(node, options).then((canvas) => canvas.toDataURL());
    });
}
function toJpeg(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        return toCanvas(node, options).then((canvas) => canvas.toDataURL('image/jpeg', options.quality || 1));
    });
}
function toBlob(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        return toCanvas(node, options).then(canvasToBlob);
    });
}
function getFontEmbedCSS(node, options = {}) {
    return es_awaiter(this, void 0, void 0, function* () {
        return getWebFontCSS(node, options);
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 608:
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 490:
/***/ ((module) => {

"use strict";

module.exports = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};


/***/ }),

/***/ 10:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const EventEmitter = __webpack_require__(399);
const p_timeout_1 = __webpack_require__(605);
const priority_queue_1 = __webpack_require__(986);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const empty = () => { };
const timeoutError = new p_timeout_1.TimeoutError();
/**
Promise queue with concurrency control.
*/
class PQueue extends EventEmitter {
    constructor(options) {
        var _a, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === 'number' && options.intervalCap >= 1)) {
            throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : ''}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === undefined || !(Number.isFinite(options.interval) && options.interval >= 0)) {
            throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ''}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
    }
    get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
    }
    get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
    }
    _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit('next');
    }
    _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
            this._resolveIdle();
            this._resolveIdle = empty;
            this.emit('idle');
        }
    }
    _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = undefined;
    }
    _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === undefined) {
            const delay = this._intervalEnd - now;
            if (delay < 0) {
                // Act as the interval was done
                // We don't need to resume it here because it will be resumed on line 160
                this._intervalCount = (this._carryoverConcurrencyCount) ? this._pendingCount : 0;
            }
            else {
                // Act as the interval is pending
                if (this._timeoutId === undefined) {
                    this._timeoutId = setTimeout(() => {
                        this._onResumeInterval();
                    }, delay);
                }
                return true;
            }
        }
        return false;
    }
    _tryToStartAnother() {
        if (this._queue.size === 0) {
            // We can clear the interval ("pause")
            // Because we can redo it later ("resume")
            if (this._intervalId) {
                clearInterval(this._intervalId);
            }
            this._intervalId = undefined;
            this._resolvePromises();
            return false;
        }
        if (!this._isPaused) {
            const canInitializeInterval = !this._isIntervalPaused();
            if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
                const job = this._queue.dequeue();
                if (!job) {
                    return false;
                }
                this.emit('active');
                job();
                if (canInitializeInterval) {
                    this._initializeIntervalIfNeeded();
                }
                return true;
            }
        }
        return false;
    }
    _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== undefined) {
            return;
        }
        this._intervalId = setInterval(() => {
            this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
    }
    _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = undefined;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
    }
    /**
    Executes all queued functions until it reaches the limit.
    */
    _processQueue() {
        // eslint-disable-next-line no-empty
        while (this._tryToStartAnother()) { }
    }
    get concurrency() {
        return this._concurrency;
    }
    set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === 'number' && newConcurrency >= 1)) {
            throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
    }
    /**
    Adds a sync or async task to the queue. Always returns a promise.
    */
    async add(fn, options = {}) {
        return new Promise((resolve, reject) => {
            const run = async () => {
                this._pendingCount++;
                this._intervalCount++;
                try {
                    const operation = (this._timeout === undefined && options.timeout === undefined) ? fn() : p_timeout_1.default(Promise.resolve(fn()), (options.timeout === undefined ? this._timeout : options.timeout), () => {
                        if (options.throwOnTimeout === undefined ? this._throwOnTimeout : options.throwOnTimeout) {
                            reject(timeoutError);
                        }
                        return undefined;
                    });
                    resolve(await operation);
                }
                catch (error) {
                    reject(error);
                }
                this._next();
            };
            this._queue.enqueue(run, options);
            this._tryToStartAnother();
            this.emit('add');
        });
    }
    /**
    Same as `.add()`, but accepts an array of sync or async functions.

    @returns A promise that resolves when all functions are resolved.
    */
    async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
    }
    /**
    Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
    */
    start() {
        if (!this._isPaused) {
            return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
    }
    /**
    Put queue execution on hold.
    */
    pause() {
        this._isPaused = true;
    }
    /**
    Clear the queue.
    */
    clear() {
        this._queue = new this._queueClass();
    }
    /**
    Can be called multiple times. Useful if you for example add additional items at a later time.

    @returns A promise that settles when the queue becomes empty.
    */
    async onEmpty() {
        // Instantly resolve if the queue is empty
        if (this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveEmpty;
            this._resolveEmpty = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.

    @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
    */
    async onIdle() {
        // Instantly resolve if none pending and if nothing else is queued
        if (this._pendingCount === 0 && this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveIdle;
            this._resolveIdle = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    Size of the queue.
    */
    get size() {
        return this._queue.size;
    }
    /**
    Size of the queue, filtered by the given options.

    For example, this can be used to find the number of items remaining in the queue with a specific priority level.
    */
    sizeBy(options) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        return this._queue.filter(options).length;
    }
    /**
    Number of pending promises.
    */
    get pending() {
        return this._pendingCount;
    }
    /**
    Whether the queue is currently paused.
    */
    get isPaused() {
        return this._isPaused;
    }
    get timeout() {
        return this._timeout;
    }
    /**
    Set the timeout for future operations.
    */
    set timeout(milliseconds) {
        this._timeout = milliseconds;
    }
}
exports["default"] = PQueue;


/***/ }),

/***/ 982:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
// Port of lower_bound from https://en.cppreference.com/w/cpp/algorithm/lower_bound
// Used to compute insertion index to keep queue sorted after insertion
function lowerBound(array, value, comparator) {
    let first = 0;
    let count = array.length;
    while (count > 0) {
        const step = (count / 2) | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
            first = ++it;
            count -= step + 1;
        }
        else {
            count = step;
        }
    }
    return first;
}
exports["default"] = lowerBound;


/***/ }),

/***/ 986:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const lower_bound_1 = __webpack_require__(982);
class PriorityQueue {
    constructor() {
        this._queue = [];
    }
    enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
            priority: options.priority,
            run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
            this._queue.push(element);
            return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
    }
    dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
    }
    filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
    }
    get size() {
        return this._queue.length;
    }
}
exports["default"] = PriorityQueue;


/***/ }),

/***/ 605:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const pFinally = __webpack_require__(490);

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	// TODO: Use native `finally` keyword when targeting Node.js 10
	pFinally(
		// eslint-disable-next-line promise/prefer-await-to-then
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

module.exports = pTimeout;
// TODO: Remove this for the next major release
module.exports["default"] = pTimeout;

module.exports.TimeoutError = TimeoutError;


/***/ }),

/***/ 888:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChaseDemo = void 0;
class ChaseDemo {
    constructor() {
        this.pressed = [];
        this.counter = 0;
    }
    async drawButtons(device, canvas, c) {
        // We probably should reuse this instead of creating it each time.
        const ctx = canvas.getContext('2d');
        const ps = [];
        for (let i = 0; i < device.NUM_KEYS; i++) {
            if (ctx) {
                const n = c + i;
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Start with a font that's 80% as high as the button. maxWidth
                // is used on the stroke and fill calls below to scale down.
                ctx.font = `${canvas.height * 0.8}px "Arial"`;
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 1;
                ctx.strokeText(n.toString(), 8, 60, canvas.width * 0.8);
                ctx.fillStyle = 'white';
                ctx.fillText(n.toString(), 8, 60, canvas.width * 0.8);
                const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ps.push(device.fillKeyBuffer(i, Buffer.from(id.data), { format: 'rgba' }));
                ctx.restore();
            }
        }
        await Promise.all(ps);
    }
    async start(device) {
        await device.clearPanel();
        this.counter = 0;
        const canvas = document.createElement('canvas');
        canvas.width = device.ICON_SIZE;
        canvas.height = device.ICON_SIZE;
        await this.drawButtons(device, canvas, this.counter);
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    this.running = this.drawButtons(device, canvas, ++this.counter);
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


/***/ }),

/***/ 652:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DomImageDemo = void 0;
const html_to_image_1 = __webpack_require__(688);
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
/**
 * This demo is using html-to-image to render a div to the streamdeck.
 * Performance is not great, and the conversion library has many issues with rendering in
 * various cases, but if the source material is very controlled it could be useful.
 * It would be better to render natively on a canvas.
 */
class DomImageDemo {
    constructor() {
        this.run = false;
    }
    async start(device) {
        this.element = document.querySelector('#image-source') || undefined;
        if (this.element) {
            this.element.style.display = 'block';
        }
        if (!this.run) {
            this.run = true;
            const runTick = () => {
                if (this.element && this.run) {
                    const elm = this.element;
                    (0, html_to_image_1.toCanvas)(elm)
                        .then(async (canvas) => {
                        this.running = device.fillPanelCanvas(canvas);
                        await this.running;
                        this.running = undefined;
                        // It would run smoother to set the next tick going before sending to the panel, but then it becomes a race that could go wrong
                        runTick();
                    })
                        .catch(console.error);
                }
            };
            runTick();
        }
    }
    async stop(device) {
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.run = false;
        await this.running;
        await device.clearPanel();
    }
    async keyDown(_device, _keyIndex) {
        if (this.element) {
            this.element.style.background = getRandomColor();
        }
    }
    async keyUp(_device, _keyIndex) {
        // Nothing to do
    }
}
exports.DomImageDemo = DomImageDemo;


/***/ }),

/***/ 306:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FillWhenPressedDemo = void 0;
class FillWhenPressedDemo {
    constructor() {
        this.pressed = [];
    }
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


/***/ }),

/***/ 283:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RapidFillDemo = void 0;
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class RapidFillDemo {
    async start(device) {
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    const r = getRandomIntInclusive(0, 255);
                    const g = getRandomIntInclusive(0, 255);
                    const b = getRandomIntInclusive(0, 255);
                    console.log('Filling with rgb(%d, %d, %d)', r, g, b);
                    const ps = [];
                    for (let i = 0; i < device.NUM_KEYS; i++) {
                        ps.push(device.fillKeyColor(i, r, g, b));
                    }
                    this.running = Promise.all(ps);
                    await this.running;
                    this.running = undefined;
                }
            };
            this.interval = window.setInterval(() => {
                doThing().catch((e) => console.log(e));
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
    async keyDown(_device, _keyIndex) {
        // Nothing to do
    }
    async keyUp(_device, _keyIndex) {
        // Nothing to do
    }
}
exports.RapidFillDemo = RapidFillDemo;


/***/ }),

/***/ 613:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEVICE_MODELS = exports.DeviceModelType = exports.VENDOR_ID = exports.StreamDeckProxy = exports.DeviceModelId = void 0;
const models_1 = __webpack_require__(567);
var models_2 = __webpack_require__(567);
Object.defineProperty(exports, "DeviceModelId", ({ enumerable: true, get: function () { return models_2.DeviceModelId; } }));
var proxy_1 = __webpack_require__(922);
Object.defineProperty(exports, "StreamDeckProxy", ({ enumerable: true, get: function () { return proxy_1.StreamDeckProxy; } }));
/** Elgato vendor id */
exports.VENDOR_ID = 0x0fd9;
var DeviceModelType;
(function (DeviceModelType) {
    DeviceModelType["STREAMDECK"] = "streamdeck";
    DeviceModelType["PEDAL"] = "pedal";
})(DeviceModelType = exports.DeviceModelType || (exports.DeviceModelType = {}));
/** List of all the known models, and the classes to use them */
exports.DEVICE_MODELS = [
    {
        id: models_1.DeviceModelId.ORIGINAL,
        type: DeviceModelType.STREAMDECK,
        productId: 0x0060,
        class: models_1.StreamDeckOriginal,
    },
    {
        id: models_1.DeviceModelId.MINI,
        type: DeviceModelType.STREAMDECK,
        productId: 0x0063,
        class: models_1.StreamDeckMini,
    },
    {
        id: models_1.DeviceModelId.XL,
        type: DeviceModelType.STREAMDECK,
        productId: 0x006c,
        class: models_1.StreamDeckXL,
    },
    {
        id: models_1.DeviceModelId.ORIGINALV2,
        type: DeviceModelType.STREAMDECK,
        productId: 0x006d,
        class: models_1.StreamDeckOriginalV2,
    },
    {
        id: models_1.DeviceModelId.ORIGINALMK2,
        type: DeviceModelType.STREAMDECK,
        productId: 0x0080,
        class: models_1.StreamDeckOriginalMK2,
    },
    {
        id: models_1.DeviceModelId.PEDAL,
        type: DeviceModelType.PEDAL,
        productId: 0x0086,
        class: models_1.StreamDeckPedal,
    },
    {
        id: models_1.DeviceModelId.MINIV2,
        type: DeviceModelType.STREAMDECK,
        productId: 0x0090,
        class: models_1.StreamDeckMiniV2,
    },
];
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 882:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckGen1Base = void 0;
const base_1 = __webpack_require__(576);
/**
 * Base class for generation 1 hardware (before the xl)
 */
class StreamDeckGen1Base extends base_1.StreamDeckBase {
    constructor(device, options, properties) {
        super(device, options, properties);
    }
    /**
     * Sets the brightness of the keys on the Stream Deck
     *
     * @param {number} percentage The percentage brightness
     */
    async setBrightness(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new RangeError('Expected brightness percentage to be between 0 and 100');
        }
        // prettier-ignore
        const brightnessCommandBuffer = Buffer.from([
            0x05,
            0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.device.sendFeatureReport(brightnessCommandBuffer);
    }
    async resetToLogo() {
        // prettier-ignore
        const resetCommandBuffer = Buffer.from([
            0x0b,
            0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.device.sendFeatureReport(resetCommandBuffer);
    }
    async getFirmwareVersion() {
        const val = await this.device.getFeatureReport(4, 17);
        const end = val.indexOf(0);
        return val.toString('ascii', 5, end === -1 ? undefined : end);
    }
    async getSerialNumber() {
        const val = await this.device.getFeatureReport(3, 17);
        return val.toString('ascii', 5, 17);
    }
}
exports.StreamDeckGen1Base = StreamDeckGen1Base;
//# sourceMappingURL=base-gen1.js.map

/***/ }),

/***/ 679:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckGen2Base = void 0;
const util_1 = __webpack_require__(764);
const base_1 = __webpack_require__(576);
/**
 * Base class for generation 2 hardware (starting with the xl)
 */
class StreamDeckGen2Base extends base_1.StreamDeckBase {
    constructor(device, options, properties) {
        super(device, options, properties);
        this.encodeJPEG = options.encodeJPEG;
    }
    /**
     * Sets the brightness of the keys on the Stream Deck
     *
     * @param {number} percentage The percentage brightness
     */
    async setBrightness(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new RangeError('Expected brightness percentage to be between 0 and 100');
        }
        // prettier-ignore
        const brightnessCommandBuffer = Buffer.from([
            0x03,
            0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.device.sendFeatureReport(brightnessCommandBuffer);
    }
    async resetToLogo() {
        // prettier-ignore
        const resetCommandBuffer = Buffer.from([
            0x03,
            0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.device.sendFeatureReport(resetCommandBuffer);
    }
    async getFirmwareVersion() {
        const val = await this.device.getFeatureReport(5, 32);
        const end = val.indexOf(0);
        return val.toString('ascii', 6, end === -1 ? undefined : end);
    }
    async getSerialNumber() {
        const val = await this.device.getFeatureReport(6, 32);
        return val.toString('ascii', 2, 14);
    }
    getFillImageCommandHeaderLength() {
        return 8;
    }
    writeFillImageCommandHeader(buffer, keyIndex, partIndex, isLast, bodyLength) {
        buffer.writeUInt8(0x02, 0);
        buffer.writeUInt8(0x07, 1);
        buffer.writeUInt8(keyIndex, 2);
        buffer.writeUInt8(isLast ? 1 : 0, 3);
        buffer.writeUInt16LE(bodyLength, 4);
        buffer.writeUInt16LE(partIndex++, 6);
    }
    getFillImagePacketLength() {
        return 1024;
    }
    async convertFillImage(sourceBuffer, sourceOptions) {
        const byteBuffer = (0, util_1.imageToByteArray)(sourceBuffer, sourceOptions, { colorMode: 'rgba', xFlip: true, yFlip: true }, 0, this.ICON_SIZE);
        return this.encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE);
    }
}
exports.StreamDeckGen2Base = StreamDeckGen2Base;
//# sourceMappingURL=base-gen2.js.map

/***/ }),

/***/ 576:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckBase = exports.StreamDeckInputBase = void 0;
const EventEmitter = __webpack_require__(399);
class StreamDeckInputBase extends EventEmitter {
    constructor(device, _options, properties) {
        super();
        this.deviceProperties = properties;
        this.device = device;
        this.keyState = new Array(this.NUM_KEYS).fill(false);
        this.device.dataKeyOffset = properties.KEY_DATA_OFFSET;
        this.device.on('input', (data) => {
            for (let i = 0; i < this.NUM_KEYS; i++) {
                const keyPressed = Boolean(data[i]);
                const keyIndex = this.transformKeyIndex(i);
                const stateChanged = keyPressed !== this.keyState[keyIndex];
                if (stateChanged) {
                    this.keyState[keyIndex] = keyPressed;
                    if (keyPressed) {
                        this.emit('down', keyIndex);
                    }
                    else {
                        this.emit('up', keyIndex);
                    }
                }
            }
        });
        this.device.on('error', (err) => {
            this.emit('error', err);
        });
    }
    get NUM_KEYS() {
        return this.KEY_COLUMNS * this.KEY_ROWS;
    }
    get KEY_COLUMNS() {
        return this.deviceProperties.COLUMNS;
    }
    get KEY_ROWS() {
        return this.deviceProperties.ROWS;
    }
    get ICON_SIZE() {
        return this.deviceProperties.ICON_SIZE;
    }
    get ICON_BYTES() {
        return this.ICON_PIXELS * 3;
    }
    get ICON_PIXELS() {
        return this.ICON_SIZE * this.ICON_SIZE;
    }
    get MODEL() {
        return this.deviceProperties.MODEL;
    }
    get PRODUCT_NAME() {
        return this.deviceProperties.PRODUCT_NAME;
    }
    checkValidKeyIndex(keyIndex) {
        if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
            throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`);
        }
    }
    async close() {
        return this.device.close();
    }
    transformKeyIndex(keyIndex) {
        return keyIndex;
    }
}
exports.StreamDeckInputBase = StreamDeckInputBase;
class StreamDeckBase extends StreamDeckInputBase {
    async fillKeyColor(keyIndex, r, g, b) {
        this.checkValidKeyIndex(keyIndex);
        this.checkRGBValue(r);
        this.checkRGBValue(g);
        this.checkRGBValue(b);
        const pixels = Buffer.alloc(this.ICON_BYTES, Buffer.from([r, g, b]));
        const keyIndex2 = this.transformKeyIndex(keyIndex);
        await this.fillImageRange(keyIndex2, pixels, {
            format: 'rgb',
            offset: 0,
            stride: this.ICON_SIZE * 3,
        });
    }
    async fillKeyBuffer(keyIndex, imageBuffer, options) {
        var _a;
        this.checkValidKeyIndex(keyIndex);
        const sourceFormat = (_a = options === null || options === void 0 ? void 0 : options.format) !== null && _a !== void 0 ? _a : 'rgb';
        this.checkSourceFormat(sourceFormat);
        const imageSize = this.ICON_PIXELS * sourceFormat.length;
        if (imageBuffer.length !== imageSize) {
            throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`);
        }
        const keyIndex2 = this.transformKeyIndex(keyIndex);
        await this.fillImageRange(keyIndex2, imageBuffer, {
            format: sourceFormat,
            offset: 0,
            stride: this.ICON_SIZE * sourceFormat.length,
        });
    }
    async fillPanelBuffer(imageBuffer, options) {
        var _a;
        const sourceFormat = (_a = options === null || options === void 0 ? void 0 : options.format) !== null && _a !== void 0 ? _a : 'rgb';
        this.checkSourceFormat(sourceFormat);
        const imageSize = this.ICON_PIXELS * sourceFormat.length * this.NUM_KEYS;
        if (imageBuffer.length !== imageSize) {
            throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`);
        }
        const iconSize = this.ICON_SIZE * sourceFormat.length;
        const stride = iconSize * this.KEY_COLUMNS;
        const ps = [];
        for (let row = 0; row < this.KEY_ROWS; row++) {
            const rowOffset = stride * row * this.ICON_SIZE;
            for (let column = 0; column < this.KEY_COLUMNS; column++) {
                let index = row * this.KEY_COLUMNS;
                if (this.deviceProperties.KEY_DIRECTION === 'ltr') {
                    index += column;
                }
                else {
                    index += this.KEY_COLUMNS - column - 1;
                }
                const colOffset = column * iconSize;
                ps.push(this.fillImageRange(index, imageBuffer, {
                    format: sourceFormat,
                    offset: rowOffset + colOffset,
                    stride,
                }));
            }
        }
        await Promise.all(ps);
    }
    async clearKey(keyIndex) {
        this.checkValidKeyIndex(keyIndex);
        const pixels = Buffer.alloc(this.ICON_BYTES, 0);
        const keyIndex2 = this.transformKeyIndex(keyIndex);
        await this.fillImageRange(keyIndex2, pixels, {
            format: 'rgb',
            offset: 0,
            stride: this.ICON_SIZE * 3,
        });
    }
    async clearPanel() {
        const pixels = Buffer.alloc(this.ICON_BYTES, 0);
        const ps = [];
        for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
            ps.push(this.fillImageRange(keyIndex, pixels, {
                format: 'rgb',
                offset: 0,
                stride: this.ICON_SIZE * 3,
            }));
        }
        await Promise.all(ps);
    }
    getFillImageCommandHeaderLength() {
        return 16;
    }
    writeFillImageCommandHeader(buffer, keyIndex, partIndex, isLast, _bodyLength) {
        buffer.writeUInt8(0x02, 0);
        buffer.writeUInt8(0x01, 1);
        buffer.writeUInt16LE(partIndex, 2);
        // 3 = 0x00
        buffer.writeUInt8(isLast ? 1 : 0, 4);
        buffer.writeUInt8(keyIndex + 1, 5);
    }
    generateFillImageWrites(keyIndex, byteBuffer) {
        const MAX_PACKET_SIZE = this.getFillImagePacketLength();
        const PACKET_HEADER_LENGTH = this.getFillImageCommandHeaderLength();
        const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH;
        const result = [];
        let remainingBytes = byteBuffer.length;
        for (let part = 0; remainingBytes > 0; part++) {
            const packet = Buffer.alloc(MAX_PACKET_SIZE);
            const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE);
            this.writeFillImageCommandHeader(packet, keyIndex, part, remainingBytes <= MAX_PAYLOAD_SIZE, byteCount);
            const byteOffset = byteBuffer.length - remainingBytes;
            remainingBytes -= byteCount;
            byteBuffer.copy(packet, PACKET_HEADER_LENGTH, byteOffset, byteOffset + byteCount);
            result.push(packet);
        }
        return result;
    }
    async fillImageRange(keyIndex, imageBuffer, sourceOptions) {
        this.checkValidKeyIndex(keyIndex);
        const byteBuffer = await this.convertFillImage(imageBuffer, sourceOptions);
        const packets = this.generateFillImageWrites(keyIndex, byteBuffer);
        await this.device.sendReports(packets);
    }
    checkRGBValue(value) {
        if (value < 0 || value > 255) {
            throw new TypeError('Expected a valid color RGB value 0 - 255');
        }
    }
    checkSourceFormat(format) {
        switch (format) {
            case 'rgb':
            case 'rgba':
            case 'bgr':
            case 'bgra':
                break;
            default: {
                const fmt = format;
                throw new TypeError(`Expected a known color format not "${fmt}"`);
            }
        }
    }
}
exports.StreamDeckBase = StreamDeckBase;
//# sourceMappingURL=base.js.map

/***/ }),

/***/ 766:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeviceModelId = void 0;
var DeviceModelId;
(function (DeviceModelId) {
    DeviceModelId["ORIGINAL"] = "original";
    DeviceModelId["ORIGINALV2"] = "originalv2";
    DeviceModelId["ORIGINALMK2"] = "original-mk2";
    DeviceModelId["MINI"] = "mini";
    DeviceModelId["MINIV2"] = "miniv2";
    DeviceModelId["XL"] = "xl";
    DeviceModelId["PEDAL"] = "pedal";
})(DeviceModelId = exports.DeviceModelId || (exports.DeviceModelId = {}));
//# sourceMappingURL=id.js.map

/***/ }),

/***/ 567:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckPedal = exports.StreamDeckOriginalMK2 = exports.StreamDeckOriginalV2 = exports.StreamDeckXL = exports.StreamDeckMiniV2 = exports.StreamDeckMini = exports.StreamDeckOriginal = void 0;
__exportStar(__webpack_require__(766), exports);
var original_1 = __webpack_require__(148);
Object.defineProperty(exports, "StreamDeckOriginal", ({ enumerable: true, get: function () { return original_1.StreamDeckOriginal; } }));
var mini_1 = __webpack_require__(758);
Object.defineProperty(exports, "StreamDeckMini", ({ enumerable: true, get: function () { return mini_1.StreamDeckMini; } }));
var miniv2_1 = __webpack_require__(207);
Object.defineProperty(exports, "StreamDeckMiniV2", ({ enumerable: true, get: function () { return miniv2_1.StreamDeckMiniV2; } }));
var xl_1 = __webpack_require__(287);
Object.defineProperty(exports, "StreamDeckXL", ({ enumerable: true, get: function () { return xl_1.StreamDeckXL; } }));
var originalv2_1 = __webpack_require__(168);
Object.defineProperty(exports, "StreamDeckOriginalV2", ({ enumerable: true, get: function () { return originalv2_1.StreamDeckOriginalV2; } }));
var original_mk2_1 = __webpack_require__(51);
Object.defineProperty(exports, "StreamDeckOriginalMK2", ({ enumerable: true, get: function () { return original_mk2_1.StreamDeckOriginalMK2; } }));
var pedal_1 = __webpack_require__(266);
Object.defineProperty(exports, "StreamDeckPedal", ({ enumerable: true, get: function () { return pedal_1.StreamDeckPedal; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 758:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckMini = void 0;
const util_1 = __webpack_require__(764);
const base_gen1_1 = __webpack_require__(882);
const id_1 = __webpack_require__(766);
const miniProperties = {
    MODEL: id_1.DeviceModelId.MINI,
    PRODUCT_NAME: 'Streamdeck Mini',
    COLUMNS: 3,
    ROWS: 2,
    ICON_SIZE: 80,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 1,
};
class StreamDeckMini extends base_gen1_1.StreamDeckGen1Base {
    constructor(device, options) {
        super(device, options, miniProperties);
    }
    async convertFillImage(sourceBuffer, sourceOptions) {
        const byteBuffer = (0, util_1.imageToByteArray)(sourceBuffer, sourceOptions, { colorMode: 'bgr', rotate: true, yFlip: true }, util_1.BMP_HEADER_LENGTH, this.ICON_SIZE);
        (0, util_1.writeBMPHeader)(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835);
        return Promise.resolve(byteBuffer);
    }
    getFillImagePacketLength() {
        return 1024;
    }
}
exports.StreamDeckMini = StreamDeckMini;
//# sourceMappingURL=mini.js.map

/***/ }),

/***/ 207:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckMiniV2 = void 0;
const util_1 = __webpack_require__(764);
const base_gen1_1 = __webpack_require__(882);
const id_1 = __webpack_require__(766);
const miniV2Properties = {
    MODEL: id_1.DeviceModelId.MINIV2,
    PRODUCT_NAME: 'Streamdeck Mini',
    COLUMNS: 3,
    ROWS: 2,
    ICON_SIZE: 80,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 1,
};
class StreamDeckMiniV2 extends base_gen1_1.StreamDeckGen1Base {
    constructor(device, options) {
        super(device, options, miniV2Properties);
    }
    async convertFillImage(sourceBuffer, sourceOptions) {
        const byteBuffer = (0, util_1.imageToByteArray)(sourceBuffer, sourceOptions, { colorMode: 'bgr', rotate: true, yFlip: true }, util_1.BMP_HEADER_LENGTH, this.ICON_SIZE);
        (0, util_1.writeBMPHeader)(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835);
        return Promise.resolve(byteBuffer);
    }
    getFillImagePacketLength() {
        return 1024;
    }
    async getSerialNumber() {
        const val = await this.device.getFeatureReport(3, 32);
        return val.toString('ascii', 5, 17);
    }
}
exports.StreamDeckMiniV2 = StreamDeckMiniV2;
//# sourceMappingURL=miniv2.js.map

/***/ }),

/***/ 51:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginalMK2 = void 0;
const base_gen2_1 = __webpack_require__(679);
const id_1 = __webpack_require__(766);
const origMK2Properties = {
    MODEL: id_1.DeviceModelId.ORIGINALMK2,
    PRODUCT_NAME: 'Streamdeck MK2',
    COLUMNS: 5,
    ROWS: 3,
    ICON_SIZE: 72,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 4,
};
class StreamDeckOriginalMK2 extends base_gen2_1.StreamDeckGen2Base {
    constructor(device, options) {
        super(device, options, origMK2Properties);
    }
}
exports.StreamDeckOriginalMK2 = StreamDeckOriginalMK2;
//# sourceMappingURL=original-mk2.js.map

/***/ }),

/***/ 148:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginal = void 0;
const util_1 = __webpack_require__(764);
const base_gen1_1 = __webpack_require__(882);
const id_1 = __webpack_require__(766);
const originalProperties = {
    MODEL: id_1.DeviceModelId.ORIGINAL,
    PRODUCT_NAME: 'Streamdeck',
    COLUMNS: 5,
    ROWS: 3,
    ICON_SIZE: 72,
    KEY_DIRECTION: 'rtl',
    KEY_DATA_OFFSET: 1,
};
class StreamDeckOriginal extends base_gen1_1.StreamDeckGen1Base {
    constructor(device, options) {
        super(device, options, originalProperties);
        this.useOriginalKeyOrder = !!options.useOriginalKeyOrder;
    }
    transformKeyIndex(keyIndex) {
        if (!this.useOriginalKeyOrder) {
            // Horizontal flip
            const half = (this.KEY_COLUMNS - 1) / 2;
            const diff = ((keyIndex % this.KEY_COLUMNS) - half) * -half;
            return keyIndex + diff;
        }
        else {
            return keyIndex;
        }
    }
    getFillImagePacketLength() {
        return 8191;
    }
    async convertFillImage(sourceBuffer, sourceOptions) {
        const byteBuffer = (0, util_1.imageToByteArray)(sourceBuffer, sourceOptions, { colorMode: 'bgr', xFlip: true }, util_1.BMP_HEADER_LENGTH, this.ICON_SIZE);
        (0, util_1.writeBMPHeader)(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 3780);
        return Promise.resolve(byteBuffer);
    }
    generateFillImageWrites(keyIndex, byteBuffer) {
        const MAX_PACKET_SIZE = this.getFillImagePacketLength();
        const PACKET_HEADER_LENGTH = this.getFillImageCommandHeaderLength();
        // The original uses larger packets, and splits the payload equally across 2
        const packet1Bytes = byteBuffer.length / 2;
        const packet1 = Buffer.alloc(MAX_PACKET_SIZE);
        this.writeFillImageCommandHeader(packet1, keyIndex, 0x01, false, packet1Bytes);
        byteBuffer.copy(packet1, PACKET_HEADER_LENGTH, 0, packet1Bytes);
        const packet2 = Buffer.alloc(MAX_PACKET_SIZE);
        this.writeFillImageCommandHeader(packet2, keyIndex, 0x02, true, packet1Bytes);
        byteBuffer.copy(packet2, PACKET_HEADER_LENGTH, packet1Bytes);
        return [packet1, packet2];
    }
}
exports.StreamDeckOriginal = StreamDeckOriginal;
//# sourceMappingURL=original.js.map

/***/ }),

/***/ 168:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginalV2 = void 0;
const base_gen2_1 = __webpack_require__(679);
const id_1 = __webpack_require__(766);
const origV2Properties = {
    MODEL: id_1.DeviceModelId.ORIGINALV2,
    PRODUCT_NAME: 'Streamdeck',
    COLUMNS: 5,
    ROWS: 3,
    ICON_SIZE: 72,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 4,
};
class StreamDeckOriginalV2 extends base_gen2_1.StreamDeckGen2Base {
    constructor(device, options) {
        super(device, options, origV2Properties);
    }
}
exports.StreamDeckOriginalV2 = StreamDeckOriginalV2;
//# sourceMappingURL=originalv2.js.map

/***/ }),

/***/ 266:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckPedal = void 0;
const base_1 = __webpack_require__(576);
const id_1 = __webpack_require__(766);
const pedalProperties = {
    MODEL: id_1.DeviceModelId.PEDAL,
    PRODUCT_NAME: 'Streamdeck Pedal',
    COLUMNS: 3,
    ROWS: 1,
    ICON_SIZE: 0,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 4,
};
class StreamDeckPedal extends base_1.StreamDeckInputBase {
    constructor(device, options) {
        super(device, options, pedalProperties);
    }
    /**
     * Sets the brightness of the keys on the Stream Deck
     *
     * @param {number} percentage The percentage brightness
     */
    async setBrightness(_percentage) {
        // Not supported
    }
    async resetToLogo() {
        // Not supported
    }
    async getFirmwareVersion() {
        const val = await this.device.getFeatureReport(5, 32);
        const end = val.indexOf(0);
        return val.toString('ascii', 6, end === -1 ? undefined : end);
    }
    async getSerialNumber() {
        const val = await this.device.getFeatureReport(6, 32);
        return val.toString('ascii', 2, 14);
    }
    async fillKeyColor(_keyIndex, _r, _g, _b) {
        // Not supported
    }
    async fillKeyBuffer(_keyIndex, _imageBuffer, _options) {
        // Not supported
    }
    async fillPanelBuffer(_imageBuffer, _options) {
        // Not supported
    }
    async clearKey(_keyIndex) {
        // Not supported
    }
    async clearPanel() {
        // Not supported
    }
}
exports.StreamDeckPedal = StreamDeckPedal;
//# sourceMappingURL=pedal.js.map

/***/ }),

/***/ 287:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckXL = void 0;
const base_gen2_1 = __webpack_require__(679);
const id_1 = __webpack_require__(766);
const xlProperties = {
    MODEL: id_1.DeviceModelId.XL,
    PRODUCT_NAME: 'Streamdeck XL',
    COLUMNS: 8,
    ROWS: 4,
    ICON_SIZE: 96,
    KEY_DIRECTION: 'ltr',
    KEY_DATA_OFFSET: 4,
};
class StreamDeckXL extends base_gen2_1.StreamDeckGen2Base {
    constructor(device, options) {
        super(device, options, xlProperties);
    }
}
exports.StreamDeckXL = StreamDeckXL;
//# sourceMappingURL=xl.js.map

/***/ }),

/***/ 922:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckProxy = void 0;
/**
 * A minimal proxy around a StreamDeck instance.
 * This is intended to be used by libraries wrapping this that want to add more methods to the StreamDeck
 */
class StreamDeckProxy {
    constructor(device) {
        this.device = device;
    }
    get NUM_KEYS() {
        return this.device.NUM_KEYS;
    }
    get KEY_COLUMNS() {
        return this.device.KEY_COLUMNS;
    }
    get KEY_ROWS() {
        return this.device.KEY_ROWS;
    }
    get ICON_SIZE() {
        return this.device.ICON_SIZE;
    }
    get ICON_BYTES() {
        return this.device.ICON_BYTES;
    }
    get ICON_PIXELS() {
        return this.device.ICON_PIXELS;
    }
    get MODEL() {
        return this.device.MODEL;
    }
    get PRODUCT_NAME() {
        return this.device.PRODUCT_NAME;
    }
    checkValidKeyIndex(keyIndex) {
        this.device.checkValidKeyIndex(keyIndex);
    }
    async close() {
        return this.device.close();
    }
    async fillKeyColor(keyIndex, r, g, b) {
        return this.device.fillKeyColor(keyIndex, r, g, b);
    }
    async fillKeyBuffer(keyIndex, imageBuffer, options) {
        return this.device.fillKeyBuffer(keyIndex, imageBuffer, options);
    }
    async fillPanelBuffer(imageBuffer, options) {
        return this.device.fillPanelBuffer(imageBuffer, options);
    }
    async clearKey(keyIndex) {
        return this.device.clearKey(keyIndex);
    }
    async clearPanel() {
        return this.device.clearPanel();
    }
    async setBrightness(percentage) {
        return this.device.setBrightness(percentage);
    }
    async resetToLogo() {
        return this.device.resetToLogo();
    }
    async getFirmwareVersion() {
        return this.device.getFirmwareVersion();
    }
    async getSerialNumber() {
        return this.device.getSerialNumber();
    }
    /**
     * EventEmitter
     */
    eventNames() {
        return this.device.eventNames();
    }
    listeners(event) {
        return this.device.listeners(event);
    }
    listenerCount(event) {
        return this.device.listenerCount(event);
    }
    emit(event, ...args) {
        return this.device.emit(event, ...args);
    }
    /**
     * Add a listener for a given event.
     */
    on(event, fn, context) {
        this.device.on(event, fn, context);
        return this;
    }
    addListener(event, fn, context) {
        this.device.addListener(event, fn, context);
        return this;
    }
    /**
     * Add a one-time listener for a given event.
     */
    once(event, fn, context) {
        this.device.once(event, fn, context);
        return this;
    }
    /**
     * Remove the listeners of a given event.
     */
    removeListener(event, fn, context, once) {
        this.device.removeListener(event, fn, context, once);
        return this;
    }
    off(event, fn, context, once) {
        this.device.off(event, fn, context, once);
        return this;
    }
    removeAllListeners(event) {
        this.device.removeAllListeners(event);
        return this;
    }
}
exports.StreamDeckProxy = StreamDeckProxy;
//# sourceMappingURL=proxy.js.map

/***/ }),

/***/ 764:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.writeBMPHeader = exports.BMP_HEADER_LENGTH = exports.imageToByteArray = void 0;
function imageToByteArray(imageBuffer, sourceOptions, targetOptions, destPadding, imageSize) {
    const byteBuffer = Buffer.alloc(destPadding + imageSize * imageSize * targetOptions.colorMode.length);
    const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3);
    for (let y = 0; y < imageSize; y++) {
        const rowOffset = destPadding + imageSize * targetOptions.colorMode.length * y;
        for (let x = 0; x < imageSize; x++) {
            // Apply x/y flips
            let x2 = targetOptions.xFlip ? imageSize - x - 1 : x;
            let y2 = targetOptions.yFlip ? imageSize - y - 1 : y;
            if (targetOptions.rotate) {
                // Swap x and y
                const tmpX = x2;
                x2 = y2;
                y2 = tmpX;
            }
            const srcOffset = y2 * sourceOptions.stride + sourceOptions.offset + x2 * sourceOptions.format.length;
            const red = imageBuffer.readUInt8(srcOffset);
            const green = imageBuffer.readUInt8(srcOffset + 1);
            const blue = imageBuffer.readUInt8(srcOffset + 2);
            const targetOffset = rowOffset + x * targetOptions.colorMode.length;
            if (flipColours) {
                byteBuffer.writeUInt8(blue, targetOffset);
                byteBuffer.writeUInt8(green, targetOffset + 1);
                byteBuffer.writeUInt8(red, targetOffset + 2);
            }
            else {
                byteBuffer.writeUInt8(red, targetOffset);
                byteBuffer.writeUInt8(green, targetOffset + 1);
                byteBuffer.writeUInt8(blue, targetOffset + 2);
            }
            if (targetOptions.colorMode.length === 4) {
                byteBuffer.writeUInt8(255, targetOffset + 3);
            }
        }
    }
    return byteBuffer;
}
exports.imageToByteArray = imageToByteArray;
exports.BMP_HEADER_LENGTH = 54;
function writeBMPHeader(buf, iconSize, iconBytes, imagePPM) {
    // Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format
    // Bitmap file header
    buf.write('BM');
    buf.writeUInt32LE(iconBytes + 54, 2);
    buf.writeInt16LE(0, 6);
    buf.writeInt16LE(0, 8);
    buf.writeUInt32LE(54, 10); // Full header size
    // DIB header (BITMAPINFOHEADER)
    buf.writeUInt32LE(40, 14); // DIB header size
    buf.writeInt32LE(iconSize, 18);
    buf.writeInt32LE(iconSize, 22);
    buf.writeInt16LE(1, 26); // Color planes
    buf.writeInt16LE(24, 28); // Bit depth
    buf.writeInt32LE(0, 30); // Compression
    buf.writeInt32LE(iconBytes, 34); // Image size
    buf.writeInt32LE(imagePPM, 38); // Horizontal resolution ppm
    buf.writeInt32LE(imagePPM, 42); // Vertical resolution ppm
    buf.writeInt32LE(0, 46); // Colour pallette size
    buf.writeInt32LE(0, 50); // 'Important' Colour count
}
exports.writeBMPHeader = writeBMPHeader;
//# sourceMappingURL=util.js.map

/***/ }),

/***/ 768:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebHIDDevice = void 0;
const events_1 = __webpack_require__(531);
const p_queue_1 = __webpack_require__(10);
/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
class WebHIDDevice extends events_1.EventEmitter {
    constructor(device) {
        super();
        this.reportQueue = new p_queue_1.default({ concurrency: 1 });
        this.device = device;
        // this.device.on('data', data => this.emit('data', data))
        // this.device.on('error', error => this.emit('error', error))
        this.device.addEventListener('inputreport', (event) => {
            // Button press
            if (event.reportId === 0x01) {
                const data = new Uint8Array(event.data.buffer);
                const offset = this.dataKeyOffset || 1;
                const buttons = Array.from(data).slice(offset - 1, data.length - 1);
                this.emit('input', buttons);
            }
        });
    }
    async close() {
        return this.device.close();
    }
    async sendFeatureReport(data) {
        return this.device.sendFeatureReport(data[0], new Uint8Array(data.slice(1)));
    }
    async getFeatureReport(reportId, _reportLength) {
        const view = await this.device.receiveFeatureReport(reportId);
        return Buffer.from(view.buffer);
    }
    async sendReports(buffers) {
        return this.reportQueue.add(async () => {
            for (const data of buffers) {
                await this.device.sendReport(data[0], new Uint8Array(data.slice(1)));
            }
        });
    }
}
exports.WebHIDDevice = WebHIDDevice;
//# sourceMappingURL=device.js.map

/***/ }),

/***/ 415:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.openDevice = exports.getStreamDecks = exports.requestStreamDecks = exports.StreamDeckWeb = exports.DeviceModelId = void 0;
const core_1 = __webpack_require__(613);
const device_1 = __webpack_require__(768);
const jpeg_1 = __webpack_require__(438);
const wrapper_1 = __webpack_require__(934);
var core_2 = __webpack_require__(613);
Object.defineProperty(exports, "DeviceModelId", ({ enumerable: true, get: function () { return core_2.DeviceModelId; } }));
var wrapper_2 = __webpack_require__(934);
Object.defineProperty(exports, "StreamDeckWeb", ({ enumerable: true, get: function () { return wrapper_2.StreamDeckWeb; } }));
/**
 * Request the user to select some streamdecks to open
 * @param userOptions Options to customise the device behvaiour
 */
async function requestStreamDecks(options) {
    // TODO - error handling
    return navigator.hid
        .requestDevice({
        filters: [
            {
                vendorId: core_1.VENDOR_ID,
            },
        ],
    })
        .then(async (browserDevices) => {
        return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)));
    });
}
exports.requestStreamDecks = requestStreamDecks;
/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
async function getStreamDecks(options) {
    // TODO - error handling
    return navigator.hid.getDevices().then(async (browserDevices) => {
        return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)));
    });
}
exports.getStreamDecks = getStreamDecks;
/**
 * Open a StreamDeck from a manually selected HIDDevice handle
 * @param browserDevice The unopened browser HIDDevice
 * @param userOptions Options to customise the device behvaiour
 */
async function openDevice(browserDevice, userOptions) {
    const model = core_1.DEVICE_MODELS.find((m) => m.productId === browserDevice.productId);
    if (!model) {
        throw new Error('Stream Deck is of unexpected type.');
    }
    // if (model.id === DeviceModelId.ORIGINAL) {
    // 	const browser = detect()
    // 	if (browser && browser.os === 'Linux') {
    // 		// See https://github.com/node-hid/node-hid/issues/249 for more info.
    // 		throw new Error('This is not supported on linux')
    // 	}
    // }
    await browserDevice.open();
    const options = {
        useOriginalKeyOrder: false,
        encodeJPEG: jpeg_1.encodeJPEG,
        ...userOptions,
    };
    const device = new model.class(new device_1.WebHIDDevice(browserDevice), options || {});
    return new wrapper_1.StreamDeckWeb(device);
}
exports.openDevice = openDevice;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 438:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.encodeJPEG = void 0;
/**
 * The default JPEG encoder.
 * Utilises a hidden canvas to convert a byte array buffer into a jpeg
 * @param buffer The buffer to convert
 * @param width Width of the image
 * @param height Hieght of the image
 */
async function encodeJPEG(buffer, width, height) {
    const blob = await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const imageData = ctx.createImageData(width, height);
            imageData.data.set(buffer);
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((b) => {
                if (b) {
                    resolve(b);
                }
                else {
                    reject();
                }
            }, 'image/jpeg', 0.9);
        }
        else {
            reject();
        }
    });
    return Buffer.from(await blob.arrayBuffer());
}
exports.encodeJPEG = encodeJPEG;
//# sourceMappingURL=jpeg.js.map

/***/ }),

/***/ 934:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(291)["lW"];

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckWeb = void 0;
const core_1 = __webpack_require__(613);
/**
 * A StreamDeck instance.
 * This is an extended variant of the class, to provide some more web friendly helpers, such as accepting a canvas
 */
class StreamDeckWeb extends core_1.StreamDeckProxy {
    constructor(device) {
        super(device);
    }
    async fillKeyCanvas(keyIndex, canvas) {
        this.checkValidKeyIndex(keyIndex);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        const data = ctx.getImageData(0, 0, this.ICON_SIZE, this.ICON_SIZE);
        return this.device.fillKeyBuffer(keyIndex, Buffer.from(data.data), { format: 'rgba' });
    }
    async fillPanelCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        const data = ctx.getImageData(0, 0, this.ICON_SIZE * this.KEY_COLUMNS, this.ICON_SIZE * this.KEY_ROWS);
        return this.device.fillPanelBuffer(Buffer.from(data.data), { format: 'rgba' });
    }
}
exports.StreamDeckWeb = StreamDeckWeb;
//# sourceMappingURL=wrapper.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const webhid_1 = __webpack_require__(415);
const dom_1 = __webpack_require__(652);
const fill_when_pressed_1 = __webpack_require__(306);
const rapid_fill_1 = __webpack_require__(283);
const chase_1 = __webpack_require__(888);
if (true) {
    const elm = document.querySelector('#version_str');
    if (elm) {
        elm.innerHTML = `v${"5.5.0"}`;
    }
}
function appendLog(str) {
    var _a;
    const logElm = document.getElementById('log');
    if (logElm) {
        logElm.textContent = `${str}\n${(_a = logElm.textContent) !== null && _a !== void 0 ? _a : ''}`;
    }
}
const demoSelect = document.getElementById('demo-select');
const consentButton = document.getElementById('consent-button');
let device = null;
let currentDemo = new fill_when_pressed_1.FillWhenPressedDemo();
async function demoChange() {
    if (demoSelect) {
        console.log(`Selected demo: ${demoSelect.value}`);
        if (device) {
            await currentDemo.stop(device);
        }
        switch (demoSelect.value) {
            case 'rapid-fill':
                currentDemo = new rapid_fill_1.RapidFillDemo();
                break;
            case 'dom':
                currentDemo = new dom_1.DomImageDemo();
                break;
            case 'chase':
                currentDemo = new chase_1.ChaseDemo();
                break;
            case 'fill-when-pressed':
            default:
                currentDemo = new fill_when_pressed_1.FillWhenPressedDemo();
                break;
        }
        if (device) {
            await currentDemo.start(device);
        }
    }
}
async function openDevice(device) {
    appendLog(`Device opened. Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`);
    device.on('down', (key) => {
        appendLog(`Key ${key} down`);
        currentDemo.keyDown(device, key).catch(console.error);
    });
    device.on('up', (key) => {
        appendLog(`Key ${key} up`);
        currentDemo.keyUp(device, key).catch(console.error);
    });
    await currentDemo.start(device);
    // Sample actions
    await device.setBrightness(70);
    // device.fillColor(2, 255, 0, 0)
    // device.fillColor(12, 0, 0, 255)
}
if (consentButton) {
    const doLoad = async () => {
        // attempt to open a previously selected device.
        const devices = await (0, webhid_1.getStreamDecks)();
        if (devices.length > 0) {
            device = devices[0];
            openDevice(device).catch(console.error);
        }
        console.log(devices);
    };
    window.addEventListener('load', () => {
        doLoad().catch((e) => console.error(e));
    });
    const brightnessRange = document.getElementById('brightness-range');
    if (brightnessRange) {
        brightnessRange.addEventListener('input', (_e) => {
            const value = brightnessRange.value;
            if (device) {
                device.setBrightness(value).catch(console.error);
            }
        });
    }
    if (demoSelect) {
        demoSelect.addEventListener('input', () => {
            demoChange().catch(console.error);
        });
        demoChange().catch(console.error);
    }
    const consentClick = async () => {
        if (device) {
            appendLog('Closing device');
            currentDemo.stop(device).catch(console.error);
            await device.close();
            device = null;
        }
        // Prompt for a device
        try {
            const devices = await (0, webhid_1.requestStreamDecks)();
            device = devices[0];
            if (devices.length === 0) {
                appendLog('No device was selected');
                return;
            }
        }
        catch (error) {
            appendLog(`No device access granted: ${error}`);
            return;
        }
        openDevice(device).catch(console.error);
    };
    consentButton.addEventListener('click', () => {
        consentClick().catch((e) => console.error(e));
    });
    appendLog('Page loaded');
}

})();

/******/ })()
;
//# sourceMappingURL=main.map