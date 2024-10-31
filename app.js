/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 2646:
/***/ ((module) => {



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

/***/ 2559:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  getFontEmbedCSS: () => (/* binding */ getFontEmbedCSS),
  toBlob: () => (/* binding */ toBlob),
  toCanvas: () => (/* binding */ toCanvas),
  toJpeg: () => (/* binding */ toJpeg),
  toPixelData: () => (/* binding */ toPixelData),
  toPng: () => (/* binding */ toPng),
  toSvg: () => (/* binding */ toSvg)
});

;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/util.js
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
const uuid = (() => {
    // generate uuid for className of pseudo elements.
    // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
    let counter = 0;
    // ref: http://stackoverflow.com/a/6248722/2519373
    const random = () => 
    // eslint-disable-next-line no-bitwise
    `0000${((Math.random() * 36 ** 4) << 0).toString(36)}`.slice(-4);
    return () => {
        counter += 1;
        return `u${random()}${counter}`;
    };
})();
function delay(ms) {
    return (args) => new Promise((resolve) => {
        setTimeout(() => resolve(args), ms);
    });
}
function toArray(arrayLike) {
    const arr = [];
    for (let i = 0, l = arrayLike.length; i < l; i++) {
        arr.push(arrayLike[i]);
    }
    return arr;
}
function px(node, styleProperty) {
    const win = node.ownerDocument.defaultView || window;
    const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
    return val ? parseFloat(val.replace('px', '')) : 0;
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
function getImageSize(targetNode, options = {}) {
    const width = options.width || getNodeWidth(targetNode);
    const height = options.height || getNodeHeight(targetNode);
    return { width, height };
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
// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
const canvasDimensionLimit = 16384;
function checkCanvasDimensions(canvas) {
    if (canvas.width > canvasDimensionLimit ||
        canvas.height > canvasDimensionLimit) {
        if (canvas.width > canvasDimensionLimit &&
            canvas.height > canvasDimensionLimit) {
            if (canvas.width > canvas.height) {
                canvas.height *= canvasDimensionLimit / canvas.width;
                canvas.width = canvasDimensionLimit;
            }
            else {
                canvas.width *= canvasDimensionLimit / canvas.height;
                canvas.height = canvasDimensionLimit;
            }
        }
        else if (canvas.width > canvasDimensionLimit) {
            canvas.height *= canvasDimensionLimit / canvas.width;
            canvas.width = canvasDimensionLimit;
        }
        else {
            canvas.width *= canvasDimensionLimit / canvas.height;
            canvas.height = canvasDimensionLimit;
        }
    }
}
function canvasToBlob(canvas, options = {}) {
    if (canvas.toBlob) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, options.type ? options.type : 'image/png', options.quality ? options.quality : 1);
        });
    }
    return new Promise((resolve) => {
        const binaryString = window.atob(canvas
            .toDataURL(options.type ? options.type : undefined, options.quality ? options.quality : undefined)
            .split(',')[1]);
        const len = binaryString.length;
        const binaryArray = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
            binaryArray[i] = binaryString.charCodeAt(i);
        }
        resolve(new Blob([binaryArray], {
            type: options.type ? options.type : 'image/png',
        }));
    });
}
function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.decode = () => resolve(img);
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.src = url;
    });
}
async function svgToDataURL(svg) {
    return Promise.resolve()
        .then(() => new XMLSerializer().serializeToString(svg))
        .then(encodeURIComponent)
        .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
}
async function nodeToDataURL(node, width, height) {
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
}
const isInstanceOfElement = (node, instance) => {
    if (node instanceof instance)
        return true;
    const nodePrototype = Object.getPrototypeOf(node);
    if (nodePrototype === null)
        return false;
    return (nodePrototype.constructor.name === instance.name ||
        isInstanceOfElement(nodePrototype, instance));
};
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/clone-pseudos.js

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
//# sourceMappingURL=clone-pseudos.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/mimes.js
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
    webp: 'image/webp',
};
function getExtension(url) {
    const match = /\.([^./]*?)$/g.exec(url);
    return match ? match[1] : '';
}
function getMimeType(url) {
    const extension = getExtension(url).toLowerCase();
    return mimes[extension] || '';
}
//# sourceMappingURL=mimes.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/dataurl.js
function getContentFromDataUrl(dataURL) {
    return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
    return `data:${mimeType};base64,${content}`;
}
async function fetchAsDataURL(url, init, process) {
    const res = await fetch(url, init);
    if (res.status === 404) {
        throw new Error(`Resource "${res.url}" not found`);
    }
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
            try {
                resolve(process({ res, result: reader.result }));
            }
            catch (error) {
                reject(error);
            }
        };
        reader.readAsDataURL(blob);
    });
}
const cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
    let key = url.replace(/\?.*/, '');
    if (includeQueryParams) {
        key = url;
    }
    // font resource
    if (/ttf|otf|eot|woff2?/i.test(key)) {
        key = key.replace(/.*\//, '');
    }
    return contentType ? `[${contentType}]${key}` : key;
}
async function resourceToDataURL(resourceUrl, contentType, options) {
    const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
    if (cache[cacheKey] != null) {
        return cache[cacheKey];
    }
    // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
    if (options.cacheBust) {
        // eslint-disable-next-line no-param-reassign
        resourceUrl += (/\?/.test(resourceUrl) ? '&' : '?') + new Date().getTime();
    }
    let dataURL;
    try {
        const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
            if (!contentType) {
                // eslint-disable-next-line no-param-reassign
                contentType = res.headers.get('Content-Type') || '';
            }
            return getContentFromDataUrl(result);
        });
        dataURL = makeDataUrl(content, contentType);
    }
    catch (error) {
        dataURL = options.imagePlaceholder || '';
        let msg = `Failed to fetch resource: ${resourceUrl}`;
        if (error) {
            msg = typeof error === 'string' ? error : error.message;
        }
        if (msg) {
            console.warn(msg);
        }
    }
    cache[cacheKey] = dataURL;
    return dataURL;
}
//# sourceMappingURL=dataurl.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/clone-node.js




async function cloneCanvasElement(canvas) {
    const dataURL = canvas.toDataURL();
    if (dataURL === 'data:,') {
        return canvas.cloneNode(false);
    }
    return createImage(dataURL);
}
async function cloneVideoElement(video, options) {
    if (video.currentSrc) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL();
        return createImage(dataURL);
    }
    const poster = video.poster;
    const contentType = getMimeType(poster);
    const dataURL = await resourceToDataURL(poster, contentType, options);
    return createImage(dataURL);
}
async function cloneIFrameElement(iframe) {
    var _a;
    try {
        if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
            return (await cloneNode(iframe.contentDocument.body, {}, true));
        }
    }
    catch (_b) {
        // Failed to clone iframe
    }
    return iframe.cloneNode(false);
}
async function cloneSingleNode(node, options) {
    if (isInstanceOfElement(node, HTMLCanvasElement)) {
        return cloneCanvasElement(node);
    }
    if (isInstanceOfElement(node, HTMLVideoElement)) {
        return cloneVideoElement(node, options);
    }
    if (isInstanceOfElement(node, HTMLIFrameElement)) {
        return cloneIFrameElement(node);
    }
    return node.cloneNode(false);
}
const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
async function cloneChildren(nativeNode, clonedNode, options) {
    var _a, _b;
    let children = [];
    if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
        children = toArray(nativeNode.assignedNodes());
    }
    else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
        ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
        children = toArray(nativeNode.contentDocument.body.childNodes);
    }
    else {
        children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
    }
    if (children.length === 0 ||
        isInstanceOfElement(nativeNode, HTMLVideoElement)) {
        return clonedNode;
    }
    await children.reduce((deferred, child) => deferred
        .then(() => cloneNode(child, options))
        .then((clonedChild) => {
        if (clonedChild) {
            clonedNode.appendChild(clonedChild);
        }
    }), Promise.resolve());
    return clonedNode;
}
function cloneCSSStyle(nativeNode, clonedNode) {
    const targetStyle = clonedNode.style;
    if (!targetStyle) {
        return;
    }
    const sourceStyle = window.getComputedStyle(nativeNode);
    if (sourceStyle.cssText) {
        targetStyle.cssText = sourceStyle.cssText;
        targetStyle.transformOrigin = sourceStyle.transformOrigin;
    }
    else {
        toArray(sourceStyle).forEach((name) => {
            let value = sourceStyle.getPropertyValue(name);
            if (name === 'font-size' && value.endsWith('px')) {
                const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
                value = `${reducedFont}px`;
            }
            if (isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
                name === 'display' &&
                value === 'inline') {
                value = 'block';
            }
            if (name === 'd' && clonedNode.getAttribute('d')) {
                value = `path(${clonedNode.getAttribute('d')})`;
            }
            targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
        });
    }
}
function cloneInputValue(nativeNode, clonedNode) {
    if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
        clonedNode.innerHTML = nativeNode.value;
    }
    if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
        clonedNode.setAttribute('value', nativeNode.value);
    }
}
function cloneSelectValue(nativeNode, clonedNode) {
    if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
        const clonedSelect = clonedNode;
        const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute('value'));
        if (selectedOption) {
            selectedOption.setAttribute('selected', '');
        }
    }
}
function decorate(nativeNode, clonedNode) {
    if (isInstanceOfElement(clonedNode, Element)) {
        cloneCSSStyle(nativeNode, clonedNode);
        clonePseudoElements(nativeNode, clonedNode);
        cloneInputValue(nativeNode, clonedNode);
        cloneSelectValue(nativeNode, clonedNode);
    }
    return clonedNode;
}
async function ensureSVGSymbols(clone, options) {
    const uses = clone.querySelectorAll ? clone.querySelectorAll('use') : [];
    if (uses.length === 0) {
        return clone;
    }
    const processedDefs = {};
    for (let i = 0; i < uses.length; i++) {
        const use = uses[i];
        const id = use.getAttribute('xlink:href');
        if (id) {
            const exist = clone.querySelector(id);
            const definition = document.querySelector(id);
            if (!exist && definition && !processedDefs[id]) {
                // eslint-disable-next-line no-await-in-loop
                processedDefs[id] = (await cloneNode(definition, options, true));
            }
        }
    }
    const nodes = Object.values(processedDefs);
    if (nodes.length) {
        const ns = 'http://www.w3.org/1999/xhtml';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('xmlns', ns);
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.overflow = 'hidden';
        svg.style.display = 'none';
        const defs = document.createElementNS(ns, 'defs');
        svg.appendChild(defs);
        for (let i = 0; i < nodes.length; i++) {
            defs.appendChild(nodes[i]);
        }
        clone.appendChild(svg);
    }
    return clone;
}
async function cloneNode(node, options, isRoot) {
    if (!isRoot && options.filter && !options.filter(node)) {
        return null;
    }
    return Promise.resolve(node)
        .then((clonedNode) => cloneSingleNode(clonedNode, options))
        .then((clonedNode) => cloneChildren(node, clonedNode, options))
        .then((clonedNode) => decorate(node, clonedNode))
        .then((clonedNode) => ensureSVGSymbols(clonedNode, options));
}
//# sourceMappingURL=clone-node.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embed-resources.js



const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
    // eslint-disable-next-line no-useless-escape
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, 'g');
}
function parseURLs(cssText) {
    const urls = [];
    cssText.replace(URL_REGEX, (raw, quotation, url) => {
        urls.push(url);
        return raw;
    });
    return urls.filter((url) => !isDataUrl(url));
}
async function embed_resources_embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
    try {
        const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
        const contentType = getMimeType(resourceURL);
        let dataURL;
        if (getContentFromUrl) {
            const content = await getContentFromUrl(resolvedURL);
            dataURL = makeDataUrl(content, contentType);
        }
        else {
            dataURL = await resourceToDataURL(resolvedURL, contentType, options);
        }
        return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
    }
    catch (error) {
        // pass
    }
    return cssText;
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
async function embedResources(cssText, baseUrl, options) {
    if (!shouldEmbed(cssText)) {
        return cssText;
    }
    const filteredCSSText = filterPreferredFontFormat(cssText, options);
    const urls = parseURLs(filteredCSSText);
    return urls.reduce((deferred, url) => deferred.then((css) => embed_resources_embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
}
//# sourceMappingURL=embed-resources.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embed-images.js




async function embedProp(propName, node, options) {
    var _a;
    const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
    if (propValue) {
        const cssString = await embedResources(propValue, null, options);
        node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
        return true;
    }
    return false;
}
async function embedBackground(clonedNode, options) {
    if (!(await embedProp('background', clonedNode, options))) {
        await embedProp('background-image', clonedNode, options);
    }
    if (!(await embedProp('mask', clonedNode, options))) {
        await embedProp('mask-image', clonedNode, options);
    }
}
async function embedImageNode(clonedNode, options) {
    const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
    if (!(isImageElement && !isDataUrl(clonedNode.src)) &&
        !(isInstanceOfElement(clonedNode, SVGImageElement) &&
            !isDataUrl(clonedNode.href.baseVal))) {
        return;
    }
    const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
    const dataURL = await resourceToDataURL(url, getMimeType(url), options);
    await new Promise((resolve, reject) => {
        clonedNode.onload = resolve;
        clonedNode.onerror = reject;
        const image = clonedNode;
        if (image.decode) {
            image.decode = resolve;
        }
        if (image.loading === 'lazy') {
            image.loading = 'eager';
        }
        if (isImageElement) {
            clonedNode.srcset = '';
            clonedNode.src = dataURL;
        }
        else {
            clonedNode.href.baseVal = dataURL;
        }
    });
}
async function embedChildren(clonedNode, options) {
    const children = toArray(clonedNode.childNodes);
    const deferreds = children.map((child) => embedImages(child, options));
    await Promise.all(deferreds).then(() => clonedNode);
}
async function embedImages(clonedNode, options) {
    if (isInstanceOfElement(clonedNode, Element)) {
        await embedBackground(clonedNode, options);
        await embedImageNode(clonedNode, options);
        await embedChildren(clonedNode, options);
    }
}
//# sourceMappingURL=embed-images.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/apply-style.js
function applyStyle(node, options) {
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
//# sourceMappingURL=apply-style.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/embed-webfonts.js



const cssFetchCache = {};
async function fetchCSS(url) {
    let cache = cssFetchCache[url];
    if (cache != null) {
        return cache;
    }
    const res = await fetch(url);
    const cssText = await res.text();
    cache = { url, cssText };
    cssFetchCache[url] = cache;
    return cache;
}
async function embedFonts(data, options) {
    let cssText = data.cssText;
    const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
    const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
    const loadFonts = fontLocs.map(async (loc) => {
        let url = loc.replace(regexUrl, '$1');
        if (!url.startsWith('https://')) {
            url = new URL(url, data.url).href;
        }
        return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
            cssText = cssText.replace(loc, `url(${result})`);
            return [loc, result];
        });
    });
    return Promise.all(loadFonts).then(() => cssText);
}
function parseCSS(source) {
    if (source == null) {
        return [];
    }
    const result = [];
    const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
    // strip out comments
    let cssText = source.replace(commentsRegex, '');
    // eslint-disable-next-line prefer-regex-literals
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
async function getCSSRules(styleSheets, options) {
    const ret = [];
    const deferreds = [];
    // First loop inlines imports
    styleSheets.forEach((sheet) => {
        if ('cssRules' in sheet) {
            try {
                toArray(sheet.cssRules || []).forEach((item, index) => {
                    if (item.type === CSSRule.IMPORT_RULE) {
                        let importIndex = index + 1;
                        const url = item.href;
                        const deferred = fetchCSS(url)
                            .then((metadata) => embedFonts(metadata, options))
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
                        .then((metadata) => embedFonts(metadata, options))
                        .then((cssText) => parseCSS(cssText).forEach((rule) => {
                        inline.insertRule(rule, sheet.cssRules.length);
                    }))
                        .catch((err) => {
                        console.error('Error loading remote stylesheet', err);
                    }));
                }
                console.error('Error inlining remote css file', e);
            }
        }
    });
    return Promise.all(deferreds).then(() => {
        // Second loop parses rules
        styleSheets.forEach((sheet) => {
            if ('cssRules' in sheet) {
                try {
                    toArray(sheet.cssRules || []).forEach((item) => {
                        ret.push(item);
                    });
                }
                catch (e) {
                    console.error(`Error while reading CSS rules from ${sheet.href}`, e);
                }
            }
        });
        return ret;
    });
}
function getWebFontRules(cssRules) {
    return cssRules
        .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
        .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
}
async function parseWebFontRules(node, options) {
    if (node.ownerDocument == null) {
        throw new Error('Provided element is not within a Document');
    }
    const styleSheets = toArray(node.ownerDocument.styleSheets);
    const cssRules = await getCSSRules(styleSheets, options);
    return getWebFontRules(cssRules);
}
async function getWebFontCSS(node, options) {
    const rules = await parseWebFontRules(node, options);
    const cssTexts = await Promise.all(rules.map((rule) => {
        const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
        return embedResources(rule.cssText, baseUrl, options);
    }));
    return cssTexts.join('\n');
}
async function embedWebFonts(clonedNode, options) {
    const cssText = options.fontEmbedCSS != null
        ? options.fontEmbedCSS
        : options.skipFonts
            ? null
            : await getWebFontCSS(clonedNode, options);
    if (cssText) {
        const styleNode = document.createElement('style');
        const sytleContent = document.createTextNode(cssText);
        styleNode.appendChild(sytleContent);
        if (clonedNode.firstChild) {
            clonedNode.insertBefore(styleNode, clonedNode.firstChild);
        }
        else {
            clonedNode.appendChild(styleNode);
        }
    }
}
//# sourceMappingURL=embed-webfonts.js.map
;// CONCATENATED MODULE: ../../../node_modules/html-to-image/es/index.js





async function toSvg(node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const clonedNode = (await cloneNode(node, options, true));
    await embedWebFonts(clonedNode, options);
    await embedImages(clonedNode, options);
    applyStyle(clonedNode, options);
    const datauri = await nodeToDataURL(clonedNode, width, height);
    return datauri;
}
async function toCanvas(node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const svg = await toSvg(node, options);
    const img = await createImage(svg);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const ratio = options.pixelRatio || getPixelRatio();
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
}
async function toPixelData(node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const canvas = await toCanvas(node, options);
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, width, height).data;
}
async function toPng(node, options = {}) {
    const canvas = await toCanvas(node, options);
    return canvas.toDataURL();
}
async function toJpeg(node, options = {}) {
    const canvas = await toCanvas(node, options);
    return canvas.toDataURL('image/jpeg', options.quality || 1);
}
async function toBlob(node, options = {}) {
    const canvas = await toCanvas(node, options);
    const blob = await canvasToBlob(canvas);
    return blob;
}
async function getFontEmbedCSS(node, options = {}) {
    return getWebFontCSS(node, options);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3651:
/***/ ((module) => {


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

/***/ 4968:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const EventEmitter = __webpack_require__(9210);
const p_timeout_1 = __webpack_require__(9455);
const priority_queue_1 = __webpack_require__(8856);
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

/***/ 152:
/***/ ((__unused_webpack_module, exports) => {


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

/***/ 8856:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const lower_bound_1 = __webpack_require__(152);
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

/***/ 9210:
/***/ ((module) => {



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

/***/ 9455:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const pFinally = __webpack_require__(3651);

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

/***/ 1889:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChaseDemo = void 0;
class ChaseDemo {
    pressed = [];
    counter = 0;
    interval;
    running;
    async drawButtons(device, controls, c) {
        const ps = [];
        for (const { control, canvas } of controls) {
            // We probably should reuse this instead of creating it each time.
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const n = c + control.index;
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Start with a font that's 80% as high as the button. maxWidth
                // is used on the stroke and fill calls below to scale down.
                ctx.font = `${canvas.height * 0.8}px "Arial"`;
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 1;
                ctx.strokeText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8);
                ctx.fillStyle = 'white';
                ctx.fillText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8);
                const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ps.push(device.fillKeyBuffer(control.index, id.data, { format: 'rgba' }));
                ctx.restore();
            }
        }
        await Promise.all(ps);
    }
    async start(device) {
        await device.clearPanel();
        this.counter = 0;
        const controls = device.CONTROLS.filter((control) => control.type === 'button' && control.feedbackType === 'lcd').sort((a, b) => b.index - a.index);
        const controlsAndCanvases = controls.map((control) => {
            const canvas = document.createElement('canvas');
            canvas.width = control.pixelSize.width;
            canvas.height = control.pixelSize.height;
            return { control, canvas };
        });
        await this.drawButtons(device, controlsAndCanvases, this.counter);
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    this.running = this.drawButtons(device, controlsAndCanvases, ++this.counter);
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

/***/ 2035:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DomImageDemo = void 0;
const html_to_image_1 = __webpack_require__(2559);
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
    element;
    run = false;
    running;
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

/***/ 4964:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
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


/***/ }),

/***/ 1215:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RapidFillDemo = void 0;
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class RapidFillDemo {
    interval;
    running;
    async start(device) {
        if (!this.interval) {
            const doThing = async () => {
                if (!this.running) {
                    const r = getRandomIntInclusive(0, 255);
                    const g = getRandomIntInclusive(0, 255);
                    const b = getRandomIntInclusive(0, 255);
                    console.log('Filling with rgb(%d, %d, %d)', r, g, b);
                    const ps = [];
                    for (const control of device.CONTROLS) {
                        if (control.type === 'button') {
                            ps.push(device.fillKeyColor(control.index, r, g, b));
                        }
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

/***/ 2173:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=controlDefinition.js.map

/***/ }),

/***/ 3794:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateButtonsGrid = generateButtonsGrid;
exports.freezeDefinitions = freezeDefinitions;
function generateButtonsGrid(width, height, pixelSize, rtl = false, columnOffset = 0) {
    const controls = [];
    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            const index = row * width + column;
            const hidIndex = rtl ? flipKeyIndex(width, index) : index;
            controls.push({
                type: 'button',
                row,
                column: column + columnOffset,
                index,
                hidIndex,
                feedbackType: 'lcd',
                pixelSize,
            });
        }
    }
    return controls;
}
function flipKeyIndex(columns, keyIndex) {
    // Horizontal flip
    const half = (columns - 1) / 2;
    const diff = ((keyIndex % columns) - half) * -half;
    return keyIndex + diff;
}
function freezeDefinitions(controls) {
    return Object.freeze(controls.map((control) => Object.freeze(control)));
}
//# sourceMappingURL=controlsGenerator.js.map

/***/ }),

/***/ 6444:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MODEL_NAMES = exports.DeviceModelId = void 0;
var DeviceModelId;
(function (DeviceModelId) {
    DeviceModelId["ORIGINAL"] = "original";
    DeviceModelId["ORIGINALV2"] = "originalv2";
    DeviceModelId["ORIGINALMK2"] = "original-mk2";
    DeviceModelId["MINI"] = "mini";
    DeviceModelId["XL"] = "xl";
    DeviceModelId["PEDAL"] = "pedal";
    DeviceModelId["PLUS"] = "plus";
    DeviceModelId["NEO"] = "neo";
    DeviceModelId["STUDIO"] = "studio";
})(DeviceModelId || (exports.DeviceModelId = DeviceModelId = {}));
exports.MODEL_NAMES = {
    [DeviceModelId.ORIGINAL]: 'Stream Deck',
    [DeviceModelId.MINI]: 'Stream Deck Mini',
    [DeviceModelId.XL]: 'Stream Deck XL',
    [DeviceModelId.ORIGINALV2]: 'Stream Deck',
    [DeviceModelId.ORIGINALMK2]: 'Stream Deck MK.2',
    [DeviceModelId.PLUS]: 'Stream Deck +',
    [DeviceModelId.PEDAL]: 'Stream Deck Pedal',
    [DeviceModelId.NEO]: 'Stream Deck Neo',
    [DeviceModelId.STUDIO]: 'Stream Deck Studio',
};
//# sourceMappingURL=id.js.map

/***/ }),

/***/ 8601:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEVICE_MODELS = exports.DEVICE_MODELS2 = exports.DeviceModelType = exports.VENDOR_ID = exports.uint8ArrayToDataView = exports.StreamDeckProxy = void 0;
const tslib_1 = __webpack_require__(5823);
const id_js_1 = __webpack_require__(6444);
const original_js_1 = __webpack_require__(745);
const mini_js_1 = __webpack_require__(2321);
const xl_js_1 = __webpack_require__(2766);
const originalv2_js_1 = __webpack_require__(769);
const original_mk2_js_1 = __webpack_require__(1158);
const plus_js_1 = __webpack_require__(1562);
const pedal_js_1 = __webpack_require__(7756);
const neo_js_1 = __webpack_require__(9350);
const studio_js_1 = __webpack_require__(7724);
tslib_1.__exportStar(__webpack_require__(5064), exports);
tslib_1.__exportStar(__webpack_require__(6444), exports);
tslib_1.__exportStar(__webpack_require__(2173), exports);
var proxy_js_1 = __webpack_require__(6481);
Object.defineProperty(exports, "StreamDeckProxy", ({ enumerable: true, get: function () { return proxy_js_1.StreamDeckProxy; } }));
var util_js_1 = __webpack_require__(4369);
Object.defineProperty(exports, "uint8ArrayToDataView", ({ enumerable: true, get: function () { return util_js_1.uint8ArrayToDataView; } }));
/** Elgato vendor id */
exports.VENDOR_ID = 0x0fd9;
var DeviceModelType;
(function (DeviceModelType) {
    DeviceModelType["STREAMDECK"] = "streamdeck";
    DeviceModelType["PEDAL"] = "pedal";
})(DeviceModelType || (exports.DeviceModelType = DeviceModelType = {}));
/** List of all the known models, and the classes to use them */
exports.DEVICE_MODELS2 = {
    [id_js_1.DeviceModelId.ORIGINAL]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x0060],
        factory: original_js_1.StreamDeckOriginalFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.MINI]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x0063, 0x0090],
        factory: mini_js_1.StreamDeckMiniFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.XL]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x006c, 0x008f],
        factory: xl_js_1.StreamDeckXLFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.ORIGINALV2]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x006d],
        factory: originalv2_js_1.StreamDeckOriginalV2Factory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.ORIGINALMK2]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x0080],
        factory: original_mk2_js_1.StreamDeckOriginalMK2Factory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.PLUS]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x0084],
        factory: plus_js_1.StreamDeckPlusFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.PEDAL]: {
        type: DeviceModelType.PEDAL,
        productIds: [0x0086],
        factory: pedal_js_1.StreamDeckPedalFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.NEO]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x009a],
        factory: neo_js_1.StreamDeckNeoFactory,
        hasNativeTcp: false,
    },
    [id_js_1.DeviceModelId.STUDIO]: {
        type: DeviceModelType.STREAMDECK,
        productIds: [0x00aa],
        factory: studio_js_1.StreamDeckStudioFactory,
        hasNativeTcp: true,
    },
};
/** @deprecated maybe? */
exports.DEVICE_MODELS = Object.entries(exports.DEVICE_MODELS2).map(([id, spec]) => {
    const modelId = id;
    return {
        id: modelId,
        productName: id_js_1.MODEL_NAMES[modelId],
        ...spec,
    };
});
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7067:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckBase = void 0;
const eventemitter3_1 = __webpack_require__(2646);
const index_js_1 = __webpack_require__(8601);
class StreamDeckBase extends eventemitter3_1.EventEmitter {
    get CONTROLS() {
        return this.deviceProperties.CONTROLS;
    }
    // get KEY_SPACING_HORIZONTAL(): number {
    // 	return this.deviceProperties.KEY_SPACING_HORIZONTAL
    // }
    // get KEY_SPACING_VERTICAL(): number {
    // 	return this.deviceProperties.KEY_SPACING_VERTICAL
    // }
    get MODEL() {
        return this.deviceProperties.MODEL;
    }
    get PRODUCT_NAME() {
        return this.deviceProperties.PRODUCT_NAME;
    }
    get HAS_NFC_READER() {
        return this.deviceProperties.HAS_NFC_READER;
    }
    device;
    deviceProperties;
    // readonly #options: Readonly<Required<OpenStreamDeckOptions>>
    #propertiesService;
    #buttonsLcdService;
    #lcdSegmentDisplayService;
    #inputService;
    #encoderLedService;
    constructor(device, _options, services) {
        super();
        this.device = device;
        this.deviceProperties = services.deviceProperties;
        // this.#options = options
        this.#propertiesService = services.properties;
        this.#buttonsLcdService = services.buttonsLcd;
        this.#lcdSegmentDisplayService = services.lcdSegmentDisplay;
        this.#inputService = services.inputService;
        this.#encoderLedService = services.encoderLed;
        // propogate events
        services.events?.listen((key, ...args) => this.emit(key, ...args));
        this.device.on('input', (data) => this.#inputService.handleInput(data));
        this.device.on('error', (err) => {
            this.emit('error', err);
        });
    }
    checkValidKeyIndex(keyIndex, feedbackType) {
        const buttonControl = this.deviceProperties.CONTROLS.find((control) => control.type === 'button' && control.index === keyIndex);
        if (!buttonControl) {
            throw new TypeError(`Expected a valid keyIndex`);
        }
        if (feedbackType && buttonControl.feedbackType !== feedbackType) {
            throw new TypeError(`Expected a keyIndex with expected feedbackType`);
        }
    }
    calculateFillPanelDimensions(options) {
        return this.#buttonsLcdService.calculateFillPanelDimensions(options);
    }
    async close() {
        return this.device.close();
    }
    async getHidDeviceInfo() {
        return this.device.getDeviceInfo();
    }
    async setBrightness(percentage) {
        return this.#propertiesService.setBrightness(percentage);
    }
    async resetToLogo() {
        return this.#propertiesService.resetToLogo();
    }
    async getFirmwareVersion() {
        return this.#propertiesService.getFirmwareVersion();
    }
    async getSerialNumber() {
        return this.#propertiesService.getSerialNumber();
    }
    async fillKeyColor(keyIndex, r, g, b) {
        this.checkValidKeyIndex(keyIndex, null);
        await this.#buttonsLcdService.fillKeyColor(keyIndex, r, g, b);
    }
    async fillKeyBuffer(keyIndex, imageBuffer, options) {
        this.checkValidKeyIndex(keyIndex, 'lcd');
        await this.#buttonsLcdService.fillKeyBuffer(keyIndex, imageBuffer, options);
    }
    async fillPanelBuffer(imageBuffer, options) {
        await this.#buttonsLcdService.fillPanelBuffer(imageBuffer, options);
    }
    async clearKey(keyIndex) {
        this.checkValidKeyIndex(keyIndex, null);
        await this.#buttonsLcdService.clearKey(keyIndex);
    }
    async clearPanel() {
        const ps = [];
        ps.push(this.#buttonsLcdService.clearPanel());
        if (this.#lcdSegmentDisplayService)
            ps.push(this.#lcdSegmentDisplayService.clearAllLcdSegments());
        await Promise.all(ps);
    }
    async fillLcd(...args) {
        if (!this.#lcdSegmentDisplayService)
            throw new Error('Not supported for this model');
        return this.#lcdSegmentDisplayService.fillLcd(...args);
    }
    async fillLcdRegion(...args) {
        if (!this.#lcdSegmentDisplayService)
            throw new Error('Not supported for this model');
        return this.#lcdSegmentDisplayService.fillLcdRegion(...args);
    }
    async clearLcdSegment(...args) {
        if (!this.#lcdSegmentDisplayService)
            throw new Error('Not supported for this model');
        return this.#lcdSegmentDisplayService.clearLcdSegment(...args);
    }
    async setEncoderColor(...args) {
        if (!this.#encoderLedService)
            throw new Error('Not supported for this model');
        return this.#encoderLedService.setEncoderColor(...args);
    }
    async setEncoderRingSingleColor(...args) {
        if (!this.#encoderLedService)
            throw new Error('Not supported for this model');
        return this.#encoderLedService.setEncoderRingSingleColor(...args);
    }
    async setEncoderRingColors(...args) {
        if (!this.#encoderLedService)
            throw new Error('Not supported for this model');
        return this.#encoderLedService.setEncoderRingColors(...args);
    }
    async getChildDeviceInfo() {
        const info = await this.device.getChildDeviceInfo();
        if (!info || info.vendorId !== index_js_1.VENDOR_ID)
            return null;
        const model = index_js_1.DEVICE_MODELS.find((m) => m.productIds.includes(info.productId));
        if (!model)
            return null;
        return {
            ...info,
            model: model.id,
        };
    }
}
exports.StreamDeckBase = StreamDeckBase;
//# sourceMappingURL=base.js.map

/***/ }),

/***/ 9367:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckGen1Factory = StreamDeckGen1Factory;
const base_js_1 = __webpack_require__(7067);
const gen1_js_1 = __webpack_require__(993);
const default_js_1 = __webpack_require__(9826);
const bitmap_js_1 = __webpack_require__(3483);
const callback_hook_js_1 = __webpack_require__(659);
const gen1_js_2 = __webpack_require__(2632);
function extendDevicePropertiesForGen1(rawProps) {
    return {
        ...rawProps,
        KEY_DATA_OFFSET: 0,
        HAS_NFC_READER: false,
        SUPPORTS_CHILD_DEVICES: false,
    };
}
function StreamDeckGen1Factory(device, options, properties, imageWriter, targetOptions, bmpImagePPM) {
    const fullProperties = extendDevicePropertiesForGen1(properties);
    const events = new callback_hook_js_1.CallbackHook();
    return new base_js_1.StreamDeckBase(device, options, {
        deviceProperties: fullProperties,
        events,
        properties: new gen1_js_1.Gen1PropertiesService(device),
        buttonsLcd: new default_js_1.DefaultButtonsLcdService(imageWriter, new bitmap_js_1.BitmapButtonLcdImagePacker(targetOptions, bmpImagePPM), device, fullProperties),
        lcdSegmentDisplay: null,
        inputService: new gen1_js_2.ButtonOnlyInputService(fullProperties, events),
        encoderLed: null,
    });
}
//# sourceMappingURL=generic-gen1.js.map

/***/ }),

/***/ 442:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createBaseGen2Properties = createBaseGen2Properties;
const imageWriter_js_1 = __webpack_require__(3845);
const headerGenerator_js_1 = __webpack_require__(3117);
const default_js_1 = __webpack_require__(9826);
const callback_hook_js_1 = __webpack_require__(659);
const gen2_js_1 = __webpack_require__(1352);
const jpeg_js_1 = __webpack_require__(3582);
const gen2_js_2 = __webpack_require__(2769);
const encoderLed_js_1 = __webpack_require__(4777);
function extendDevicePropertiesForGen2(rawProps) {
    return {
        ...rawProps,
        KEY_DATA_OFFSET: 3,
    };
}
function createBaseGen2Properties(device, options, properties, propertiesService, disableXYFlip) {
    const fullProperties = extendDevicePropertiesForGen2(properties);
    const events = new callback_hook_js_1.CallbackHook();
    return {
        deviceProperties: fullProperties,
        events,
        properties: propertiesService ?? new gen2_js_1.Gen2PropertiesService(device),
        buttonsLcd: new default_js_1.DefaultButtonsLcdService(new imageWriter_js_1.StreamdeckDefaultImageWriter(new headerGenerator_js_1.StreamdeckGen2ImageHeaderGenerator()), new jpeg_js_1.JpegButtonLcdImagePacker(options.encodeJPEG, !disableXYFlip), device, fullProperties),
        lcdSegmentDisplay: null,
        inputService: new gen2_js_2.Gen2InputService(fullProperties, events),
        encoderLed: new encoderLed_js_1.EncoderLedService(device, properties.CONTROLS),
    };
}
//# sourceMappingURL=generic-gen2.js.map

/***/ }),

/***/ 2321:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckMiniFactory = StreamDeckMiniFactory;
const generic_gen1_js_1 = __webpack_require__(9367);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const imageWriter_js_1 = __webpack_require__(3845);
const headerGenerator_js_1 = __webpack_require__(3117);
const miniProperties = {
    MODEL: id_js_1.DeviceModelId.MINI,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.MINI],
    SUPPORTS_RGB_KEY_FILL: false, // TODO - verify this
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)((0, controlsGenerator_js_1.generateButtonsGrid)(3, 2, { width: 80, height: 80 })),
    KEY_SPACING_HORIZONTAL: 28,
    KEY_SPACING_VERTICAL: 28,
    FULLSCREEN_PANELS: 0,
};
function StreamDeckMiniFactory(device, options) {
    return (0, generic_gen1_js_1.StreamDeckGen1Factory)(device, options, miniProperties, new imageWriter_js_1.StreamdeckDefaultImageWriter(new headerGenerator_js_1.StreamdeckGen1ImageHeaderGenerator()), { colorMode: 'bgr', rotate: true, yFlip: true }, 2835);
}
//# sourceMappingURL=mini.js.map

/***/ }),

/***/ 9350:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckNeoFactory = StreamDeckNeoFactory;
const base_js_1 = __webpack_require__(7067);
const id_js_1 = __webpack_require__(6444);
const generic_gen2_js_1 = __webpack_require__(442);
const controlsGenerator_js_1 = __webpack_require__(3794);
const neo_js_1 = __webpack_require__(7325);
const neoControls = (0, controlsGenerator_js_1.generateButtonsGrid)(4, 2, { width: 96, height: 96 });
neoControls.push({
    type: 'button',
    row: 2,
    column: 0,
    index: 8,
    hidIndex: 8,
    feedbackType: 'rgb',
}, {
    type: 'lcd-segment',
    row: 2,
    column: 1,
    columnSpan: 2,
    rowSpan: 1,
    id: 0,
    pixelSize: {
        width: 248,
        height: 58,
    },
    drawRegions: false,
}, {
    type: 'button',
    row: 2,
    column: 3,
    index: 9,
    hidIndex: 9,
    feedbackType: 'rgb',
});
const neoProperties = {
    MODEL: id_js_1.DeviceModelId.NEO,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.NEO],
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)(neoControls),
    KEY_SPACING_HORIZONTAL: 30,
    KEY_SPACING_VERTICAL: 30,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
    SUPPORTS_RGB_KEY_FILL: true,
};
const lcdSegmentControls = neoProperties.CONTROLS.filter((control) => control.type === 'lcd-segment');
function StreamDeckNeoFactory(device, options) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, neoProperties, null);
    services.lcdSegmentDisplay = new neo_js_1.StreamDeckNeoLcdService(options.encodeJPEG, device, lcdSegmentControls);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=neo.js.map

/***/ }),

/***/ 1158:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginalMK2Factory = StreamDeckOriginalMK2Factory;
const base_js_1 = __webpack_require__(7067);
const generic_gen2_js_1 = __webpack_require__(442);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const origMK2Properties = {
    MODEL: id_js_1.DeviceModelId.ORIGINALMK2,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.ORIGINALMK2],
    SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)((0, controlsGenerator_js_1.generateButtonsGrid)(5, 3, { width: 72, height: 72 })),
    KEY_SPACING_HORIZONTAL: 25,
    KEY_SPACING_VERTICAL: 25,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
};
function StreamDeckOriginalMK2Factory(device, options) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, origMK2Properties, null);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=original-mk2.js.map

/***/ }),

/***/ 745:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginalFactory = StreamDeckOriginalFactory;
const generic_gen1_js_1 = __webpack_require__(9367);
const id_js_1 = __webpack_require__(6444);
const imageWriter_js_1 = __webpack_require__(3845);
const controlsGenerator_js_1 = __webpack_require__(3794);
const originalProperties = {
    MODEL: id_js_1.DeviceModelId.ORIGINAL,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.ORIGINAL],
    SUPPORTS_RGB_KEY_FILL: false,
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)((0, controlsGenerator_js_1.generateButtonsGrid)(5, 3, { width: 72, height: 72 }, true)),
    KEY_SPACING_HORIZONTAL: 25,
    KEY_SPACING_VERTICAL: 25,
    FULLSCREEN_PANELS: 0,
};
function StreamDeckOriginalFactory(device, options) {
    return (0, generic_gen1_js_1.StreamDeckGen1Factory)(device, options, originalProperties, new imageWriter_js_1.StreamdeckOriginalImageWriter(), { colorMode: 'bgr', xFlip: true }, 3780);
}
//# sourceMappingURL=original.js.map

/***/ }),

/***/ 769:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckOriginalV2Factory = StreamDeckOriginalV2Factory;
const base_js_1 = __webpack_require__(7067);
const generic_gen2_js_1 = __webpack_require__(442);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const origV2Properties = {
    MODEL: id_js_1.DeviceModelId.ORIGINALV2,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.ORIGINALV2],
    SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)((0, controlsGenerator_js_1.generateButtonsGrid)(5, 3, { width: 72, height: 72 })),
    KEY_SPACING_HORIZONTAL: 25,
    KEY_SPACING_VERTICAL: 25,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
};
function StreamDeckOriginalV2Factory(device, options) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, origV2Properties, null);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=originalv2.js.map

/***/ }),

/***/ 7756:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckPedalFactory = StreamDeckPedalFactory;
const base_js_1 = __webpack_require__(7067);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const pedal_js_1 = __webpack_require__(3874);
const pedal_js_2 = __webpack_require__(7183);
const callback_hook_js_1 = __webpack_require__(659);
const gen1_js_1 = __webpack_require__(2632);
const pedalControls = [
    {
        type: 'button',
        row: 0,
        column: 0,
        index: 0,
        hidIndex: 0,
        feedbackType: 'none',
    },
    {
        type: 'button',
        row: 0,
        column: 1,
        index: 1,
        hidIndex: 1,
        feedbackType: 'none',
    },
    {
        type: 'button',
        row: 0,
        column: 2,
        index: 2,
        hidIndex: 2,
        feedbackType: 'none',
    },
];
const pedalProperties = {
    MODEL: id_js_1.DeviceModelId.PEDAL,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.PEDAL],
    KEY_DATA_OFFSET: 3,
    SUPPORTS_RGB_KEY_FILL: false,
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)(pedalControls),
    KEY_SPACING_HORIZONTAL: 0,
    KEY_SPACING_VERTICAL: 0,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
};
function StreamDeckPedalFactory(device, options) {
    const events = new callback_hook_js_1.CallbackHook();
    return new base_js_1.StreamDeckBase(device, options, {
        deviceProperties: pedalProperties,
        events,
        properties: new pedal_js_1.PedalPropertiesService(device),
        buttonsLcd: new pedal_js_2.PedalLcdService(),
        lcdSegmentDisplay: null,
        inputService: new gen1_js_1.ButtonOnlyInputService(pedalProperties, events),
        encoderLed: null,
    });
}
//# sourceMappingURL=pedal.js.map

/***/ }),

/***/ 1562:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckPlusFactory = StreamDeckPlusFactory;
const base_js_1 = __webpack_require__(7067);
const generic_gen2_js_1 = __webpack_require__(442);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const plus_js_1 = __webpack_require__(5864);
const plusControls = (0, controlsGenerator_js_1.generateButtonsGrid)(4, 2, { width: 120, height: 120 });
plusControls.push({
    type: 'lcd-segment',
    row: 2,
    column: 0,
    columnSpan: 4,
    rowSpan: 1,
    id: 0,
    pixelSize: Object.freeze({
        width: 800,
        height: 100,
    }),
    drawRegions: true,
}, {
    type: 'encoder',
    row: 3,
    column: 0,
    index: 0,
    hidIndex: 0,
    hasLed: false,
    ledRingSteps: 0,
}, {
    type: 'encoder',
    row: 3,
    column: 1,
    index: 1,
    hidIndex: 1,
    hasLed: false,
    ledRingSteps: 0,
}, {
    type: 'encoder',
    row: 3,
    column: 2,
    index: 2,
    hidIndex: 2,
    hasLed: false,
    ledRingSteps: 0,
}, {
    type: 'encoder',
    row: 3,
    column: 3,
    index: 3,
    hidIndex: 3,
    hasLed: false,
    ledRingSteps: 0,
});
const plusProperties = {
    MODEL: id_js_1.DeviceModelId.PLUS,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.PLUS],
    SUPPORTS_RGB_KEY_FILL: true,
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)(plusControls),
    KEY_SPACING_HORIZONTAL: 99,
    KEY_SPACING_VERTICAL: 40,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
};
const lcdSegmentControls = plusProperties.CONTROLS.filter((control) => control.type === 'lcd-segment');
function StreamDeckPlusFactory(device, options) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, plusProperties, null, true);
    services.lcdSegmentDisplay = new plus_js_1.StreamDeckPlusLcdService(options.encodeJPEG, device, lcdSegmentControls);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=plus.js.map

/***/ }),

/***/ 7724:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.studioProperties = void 0;
exports.StreamDeckStudioFactory = StreamDeckStudioFactory;
const base_js_1 = __webpack_require__(7067);
const generic_gen2_js_1 = __webpack_require__(442);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const studioControls = [
    {
        type: 'encoder',
        row: 0,
        column: 0,
        index: 0,
        hidIndex: 0,
        hasLed: true,
        ledRingSteps: 24,
    },
    ...(0, controlsGenerator_js_1.generateButtonsGrid)(16, 2, { width: 144, height: 112 }, false, 1),
    {
        type: 'encoder',
        row: 0,
        column: 17,
        index: 1,
        hidIndex: 1,
        hasLed: true,
        ledRingSteps: 24,
    },
];
exports.studioProperties = {
    MODEL: id_js_1.DeviceModelId.STUDIO,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.STUDIO],
    SUPPORTS_RGB_KEY_FILL: true,
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)(studioControls),
    KEY_SPACING_HORIZONTAL: 0, // TODO
    KEY_SPACING_VERTICAL: 0, // TODO
    FULLSCREEN_PANELS: 2,
    HAS_NFC_READER: true,
    SUPPORTS_CHILD_DEVICES: true,
};
function StreamDeckStudioFactory(device, options, propertiesService) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, exports.studioProperties, propertiesService ?? null, true);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=studio.js.map

/***/ }),

/***/ 2766:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckXLFactory = StreamDeckXLFactory;
const base_js_1 = __webpack_require__(7067);
const generic_gen2_js_1 = __webpack_require__(442);
const id_js_1 = __webpack_require__(6444);
const controlsGenerator_js_1 = __webpack_require__(3794);
const xlProperties = {
    MODEL: id_js_1.DeviceModelId.XL,
    PRODUCT_NAME: id_js_1.MODEL_NAMES[id_js_1.DeviceModelId.XL],
    SUPPORTS_RGB_KEY_FILL: false, // rev2 doesn't support it, even though rev1 does
    CONTROLS: (0, controlsGenerator_js_1.freezeDefinitions)((0, controlsGenerator_js_1.generateButtonsGrid)(8, 4, { width: 96, height: 96 })),
    KEY_SPACING_HORIZONTAL: 32,
    KEY_SPACING_VERTICAL: 39,
    FULLSCREEN_PANELS: 0,
    HAS_NFC_READER: false,
    SUPPORTS_CHILD_DEVICES: false,
};
function StreamDeckXLFactory(device, options) {
    const services = (0, generic_gen2_js_1.createBaseGen2Properties)(device, options, xlProperties, null);
    return new base_js_1.StreamDeckBase(device, options, services);
}
//# sourceMappingURL=xl.js.map

/***/ }),

/***/ 6481:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckProxy = void 0;
/**
 * A minimal proxy around a StreamDeck instance.
 * This is intended to be used by libraries wrapping this that want to add more methods to the StreamDeck
 */
class StreamDeckProxy {
    device;
    constructor(device) {
        this.device = device;
    }
    get CONTROLS() {
        return this.device.CONTROLS;
    }
    // public get KEY_SPACING_VERTICAL(): number {
    // 	return this.device.KEY_SPACING_VERTICAL
    // }
    // public get KEY_SPACING_HORIZONTAL(): number {
    // 	return this.device.KEY_SPACING_HORIZONTAL
    // }
    get MODEL() {
        return this.device.MODEL;
    }
    get PRODUCT_NAME() {
        return this.device.PRODUCT_NAME;
    }
    get HAS_NFC_READER() {
        return this.device.HAS_NFC_READER;
    }
    calculateFillPanelDimensions(...args) {
        return this.device.calculateFillPanelDimensions(...args);
    }
    async close() {
        return this.device.close();
    }
    async getHidDeviceInfo(...args) {
        return this.device.getHidDeviceInfo(...args);
    }
    async fillKeyColor(...args) {
        return this.device.fillKeyColor(...args);
    }
    async fillKeyBuffer(...args) {
        return this.device.fillKeyBuffer(...args);
    }
    async fillPanelBuffer(...args) {
        return this.device.fillPanelBuffer(...args);
    }
    async clearKey(...args) {
        return this.device.clearKey(...args);
    }
    async clearPanel(...args) {
        return this.device.clearPanel(...args);
    }
    async setBrightness(...args) {
        return this.device.setBrightness(...args);
    }
    async resetToLogo(...args) {
        return this.device.resetToLogo(...args);
    }
    async getFirmwareVersion() {
        return this.device.getFirmwareVersion();
    }
    async getSerialNumber() {
        return this.device.getSerialNumber();
    }
    async fillLcd(...args) {
        return this.device.fillLcd(...args);
    }
    async setEncoderColor(...args) {
        return this.device.setEncoderColor(...args);
    }
    async setEncoderRingSingleColor(...args) {
        return this.device.setEncoderRingSingleColor(...args);
    }
    async setEncoderRingColors(...args) {
        return this.device.setEncoderRingColors(...args);
    }
    async fillLcdRegion(...args) {
        return this.device.fillLcdRegion(...args);
    }
    async clearLcdSegment(...args) {
        return this.device.clearLcdSegment(...args);
    }
    async getChildDeviceInfo(...args) {
        return this.device.getChildDeviceInfo(...args);
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

/***/ 9826:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultButtonsLcdService = void 0;
class DefaultButtonsLcdService {
    #imageWriter;
    #imagePacker;
    #device;
    #deviceProperties;
    constructor(imageWriter, imagePacker, device, deviceProperties) {
        this.#imageWriter = imageWriter;
        this.#imagePacker = imagePacker;
        this.#device = device;
        this.#deviceProperties = deviceProperties;
    }
    getLcdButtonControls() {
        return this.#deviceProperties.CONTROLS.filter((control) => control.type === 'button' && control.feedbackType === 'lcd');
    }
    calculateLcdGridSpan(buttonsLcd) {
        if (buttonsLcd.length === 0)
            return null;
        const allRowValues = buttonsLcd.map((button) => button.row);
        const allColumnValues = buttonsLcd.map((button) => button.column);
        return {
            minRow: Math.min(...allRowValues),
            maxRow: Math.max(...allRowValues),
            minCol: Math.min(...allColumnValues),
            maxCol: Math.max(...allColumnValues),
        };
    }
    calculateDimensionsFromGridSpan(gridSpan, buttonPixelSize, withPadding) {
        if (withPadding) {
            // TODO: Implement padding
            throw new Error('Not implemented');
        }
        else {
            const rowCount = gridSpan.maxRow - gridSpan.minRow + 1;
            const columnCount = gridSpan.maxCol - gridSpan.minCol + 1;
            // TODO: Consider that different rows/columns could have different dimensions
            return {
                width: columnCount * buttonPixelSize.width,
                height: rowCount * buttonPixelSize.height,
            };
        }
    }
    calculateFillPanelDimensions(options) {
        const buttonLcdControls = this.getLcdButtonControls();
        const gridSpan = this.calculateLcdGridSpan(buttonLcdControls);
        if (!gridSpan || buttonLcdControls.length === 0)
            return null;
        return this.calculateDimensionsFromGridSpan(gridSpan, buttonLcdControls[0].pixelSize, options?.withPadding);
    }
    async clearPanel() {
        const ps = [];
        if (this.#deviceProperties.FULLSCREEN_PANELS > 0) {
            // TODO - should this be a separate property?
            for (let screenIndex = 0; screenIndex < this.#deviceProperties.FULLSCREEN_PANELS; screenIndex++) {
                const buffer = new Uint8Array(1024);
                buffer[0] = 0x03;
                buffer[1] = 0x05;
                buffer[2] = screenIndex; // TODO - index
                ps.push(this.#device.sendReports([buffer]));
            }
            // TODO - clear rgb?
        }
        else {
            for (const control of this.#deviceProperties.CONTROLS) {
                if (control.type !== 'button')
                    continue;
                switch (control.feedbackType) {
                    case 'rgb':
                        ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0));
                        break;
                    case 'lcd':
                        if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL) {
                            ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0));
                        }
                        else {
                            const pixels = new Uint8Array(control.pixelSize.width * control.pixelSize.height * 3);
                            ps.push(this.fillImageRangeControl(control, pixels, {
                                format: 'rgb',
                                offset: 0,
                                stride: control.pixelSize.width * 3,
                            }));
                        }
                        break;
                    case 'none':
                        // Do nothing
                        break;
                }
            }
        }
        await Promise.all(ps);
    }
    async clearKey(keyIndex) {
        const control = this.#deviceProperties.CONTROLS.find((control) => control.type === 'button' && control.index === keyIndex);
        if (!control || control.feedbackType === 'none')
            throw new TypeError(`Expected a valid keyIndex`);
        if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || control.feedbackType === 'rgb') {
            await this.sendKeyRgb(keyIndex, 0, 0, 0);
        }
        else {
            const pixels = new Uint8Array(control.pixelSize.width * control.pixelSize.height * 3);
            await this.fillImageRangeControl(control, pixels, {
                format: 'rgb',
                offset: 0,
                stride: control.pixelSize.width * 3,
            });
        }
    }
    async fillKeyColor(keyIndex, r, g, b) {
        this.checkRGBValue(r);
        this.checkRGBValue(g);
        this.checkRGBValue(b);
        const control = this.#deviceProperties.CONTROLS.find((control) => control.type === 'button' && control.index === keyIndex);
        if (!control || control.feedbackType === 'none')
            throw new TypeError(`Expected a valid keyIndex`);
        if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || control.feedbackType === 'rgb') {
            await this.sendKeyRgb(keyIndex, r, g, b);
        }
        else {
            // rgba is excessive here, but it makes the fill easier as it can be done in a 32bit uint
            const pixelCount = control.pixelSize.width * control.pixelSize.height;
            const pixels = new Uint8Array(pixelCount * 4);
            const view = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
            // write first pixel
            view.setUint8(0, r);
            view.setUint8(1, g);
            view.setUint8(2, b);
            view.setUint8(3, 255);
            // read computed pixel
            const sample = view.getUint32(0);
            // fill with computed pixel
            for (let i = 1; i < pixelCount; i++) {
                view.setUint32(i * 4, sample);
            }
            await this.fillImageRangeControl(control, pixels, {
                format: 'rgba',
                offset: 0,
                stride: control.pixelSize.width * 4,
            });
        }
    }
    async fillKeyBuffer(keyIndex, imageBuffer, options) {
        const sourceFormat = options?.format ?? 'rgb';
        this.checkSourceFormat(sourceFormat);
        const control = this.#deviceProperties.CONTROLS.find((control) => control.type === 'button' && control.index === keyIndex);
        if (!control || control.feedbackType === 'none')
            throw new TypeError(`Expected a valid keyIndex`);
        if (control.feedbackType !== 'lcd')
            throw new TypeError(`keyIndex ${control.index} does not support lcd feedback`);
        const imageSize = control.pixelSize.width * control.pixelSize.height * sourceFormat.length;
        if (imageBuffer.length !== imageSize) {
            throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`);
        }
        await this.fillImageRangeControl(control, imageBuffer, {
            format: sourceFormat,
            offset: 0,
            stride: control.pixelSize.width * sourceFormat.length,
        });
    }
    async fillPanelBuffer(imageBuffer, options) {
        const sourceFormat = options?.format ?? 'rgb';
        this.checkSourceFormat(sourceFormat);
        const buttonLcdControls = this.getLcdButtonControls();
        const panelGridSpan = this.calculateLcdGridSpan(buttonLcdControls);
        if (!panelGridSpan || buttonLcdControls.length === 0) {
            throw new Error(`Panel does not support being filled`);
        }
        const panelDimensions = this.calculateDimensionsFromGridSpan(panelGridSpan, buttonLcdControls[0].pixelSize, options?.withPadding);
        const expectedByteCount = sourceFormat.length * panelDimensions.width * panelDimensions.height;
        if (imageBuffer.length !== expectedByteCount) {
            throw new RangeError(`Expected image buffer of length ${expectedByteCount}, got length ${imageBuffer.length}`);
        }
        const stride = panelDimensions.width * sourceFormat.length;
        const ps = [];
        for (const control of buttonLcdControls) {
            const controlRow = control.row - panelGridSpan.minRow;
            const controlCol = control.column - panelGridSpan.minCol;
            // TODO: Consider that different rows/columns could have different dimensions
            const iconSize = control.pixelSize.width * sourceFormat.length;
            const rowOffset = stride * controlRow * control.pixelSize.height;
            const colOffset = controlCol * iconSize;
            // TODO: Implement padding
            ps.push(this.fillImageRangeControl(control, imageBuffer, {
                format: sourceFormat,
                offset: rowOffset + colOffset,
                stride,
            }));
        }
        await Promise.all(ps);
    }
    async sendKeyRgb(keyIndex, red, green, blue) {
        await this.#device.sendFeatureReport(new Uint8Array([0x03, 0x06, keyIndex, red, green, blue]));
    }
    async fillImageRangeControl(buttonControl, imageBuffer, sourceOptions) {
        if (buttonControl.feedbackType !== 'lcd')
            throw new TypeError(`keyIndex ${buttonControl.index} does not support lcd feedback`);
        const byteBuffer = await this.#imagePacker.convertPixelBuffer(imageBuffer, sourceOptions, buttonControl.pixelSize);
        const packets = this.#imageWriter.generateFillImageWrites({ keyIndex: buttonControl.hidIndex }, byteBuffer);
        await this.#device.sendReports(packets);
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
exports.DefaultButtonsLcdService = DefaultButtonsLcdService;
//# sourceMappingURL=default.js.map

/***/ }),

/***/ 7183:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PedalLcdService = void 0;
class PedalLcdService {
    calculateFillPanelDimensions(_options) {
        // Not supported
        return null;
    }
    async clearKey(_keyIndex) {
        // Not supported
    }
    async clearPanel() {
        // Not supported
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
}
exports.PedalLcdService = PedalLcdService;
//# sourceMappingURL=pedal.js.map

/***/ }),

/***/ 659:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CallbackHook = void 0;
/**
 * A simple helper that allows for the delayed registering of a listener, to avoid dependency cycles
 */
class CallbackHook {
    #listener = null;
    emit(key, ...args) {
        if (!this.#listener)
            throw new Error('No listener setup');
        this.#listener(key, ...args);
    }
    listen(fn) {
        this.#listener = fn;
    }
}
exports.CallbackHook = CallbackHook;
//# sourceMappingURL=callback-hook.js.map

/***/ }),

/***/ 4777:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EncoderLedService = void 0;
class EncoderLedService {
    #device;
    #encoderControls;
    constructor(device, allControls) {
        this.#device = device;
        this.#encoderControls = allControls.filter((control) => control.type === 'encoder');
    }
    async clearAll() {
        const ps = [];
        for (const control of this.#encoderControls) {
            if (control.hasLed)
                ps.push(this.setEncoderColor(control.index, 0, 0, 0));
            if (control.ledRingSteps > 0)
                ps.push(this.setEncoderRingSingleColor(control.index, 0, 0, 0));
        }
        await Promise.all(ps);
    }
    async setEncoderColor(encoder, red, green, blue) {
        const control = this.#encoderControls.find((c) => c.index === encoder);
        if (!control)
            throw new Error(`Invalid encoder index ${encoder}`);
        if (!control.hasLed)
            throw new Error('Encoder does not have an LED');
        const buffer = new Uint8Array(1024);
        buffer[0] = 0x02;
        buffer[1] = 0x10;
        buffer[2] = encoder;
        buffer[3] = red;
        buffer[4] = green;
        buffer[5] = blue;
        await this.#device.sendReports([buffer]);
    }
    async setEncoderRingSingleColor(encoder, red, green, blue) {
        const control = this.#encoderControls.find((c) => c.index === encoder);
        if (!control)
            throw new Error(`Invalid encoder index ${encoder}`);
        if (control.ledRingSteps <= 0)
            throw new Error('Encoder does not have an LED ring');
        const buffer = new Uint8Array(1024);
        buffer[0] = 0x02;
        buffer[1] = 0x0f;
        buffer[2] = encoder;
        for (let i = 0; i < control.ledRingSteps; i++) {
            const offset = 3 + i * 3;
            buffer[offset] = red;
            buffer[offset + 1] = green;
            buffer[offset + 2] = blue;
        }
        await this.#device.sendReports([buffer]);
    }
    async setEncoderRingColors(encoder, colors) {
        const control = this.#encoderControls.find((c) => c.index === encoder);
        if (!control)
            throw new Error(`Invalid encoder index ${encoder}`);
        if (control.ledRingSteps <= 0)
            throw new Error('Encoder does not have an LED ring');
        if (colors.length !== control.ledRingSteps * 3)
            throw new Error('Invalid colors length');
        const colorsBuffer = colors instanceof Uint8Array ? colors : new Uint8Array(colors);
        const buffer = new Uint8Array(1024);
        buffer[0] = 0x02;
        buffer[1] = 0x0f;
        buffer[2] = encoder;
        buffer.set(colorsBuffer, 3);
        await this.#device.sendReports([buffer]);
    }
}
exports.EncoderLedService = EncoderLedService;
//# sourceMappingURL=encoderLed.js.map

/***/ }),

/***/ 3483:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BitmapButtonLcdImagePacker = void 0;
const util_js_1 = __webpack_require__(4369);
class BitmapButtonLcdImagePacker {
    #targetOptions;
    #bmpImagePPM;
    constructor(targetOptions, bmpImagePPM) {
        this.#targetOptions = targetOptions;
        this.#bmpImagePPM = bmpImagePPM;
    }
    async convertPixelBuffer(sourceBuffer, sourceOptions, targetSize) {
        const byteBuffer = (0, util_js_1.transformImageBuffer)(sourceBuffer, sourceOptions, this.#targetOptions, util_js_1.BMP_HEADER_LENGTH, targetSize.width, targetSize.height);
        (0, util_js_1.writeBMPHeader)(byteBuffer, targetSize.width, targetSize.height, byteBuffer.length - util_js_1.BMP_HEADER_LENGTH, this.#bmpImagePPM);
        return byteBuffer;
    }
}
exports.BitmapButtonLcdImagePacker = BitmapButtonLcdImagePacker;
//# sourceMappingURL=bitmap.js.map

/***/ }),

/***/ 3582:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JpegButtonLcdImagePacker = void 0;
const util_js_1 = __webpack_require__(4369);
class JpegButtonLcdImagePacker {
    #encodeJPEG;
    #xyFlip;
    constructor(encodeJPEG, xyFlip) {
        this.#encodeJPEG = encodeJPEG;
        this.#xyFlip = xyFlip;
    }
    async convertPixelBuffer(sourceBuffer, sourceOptions, targetSize) {
        const byteBuffer = (0, util_js_1.transformImageBuffer)(sourceBuffer, sourceOptions, { colorMode: 'rgba', xFlip: this.#xyFlip, yFlip: this.#xyFlip }, 0, targetSize.width, targetSize.height);
        return this.#encodeJPEG(byteBuffer, targetSize.width, targetSize.height);
    }
}
exports.JpegButtonLcdImagePacker = JpegButtonLcdImagePacker;
//# sourceMappingURL=jpeg.js.map

/***/ }),

/***/ 3117:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamdeckNeoLcdImageHeaderGenerator = exports.StreamdeckPlusLcdImageHeaderGenerator = exports.StreamdeckGen2ImageHeaderGenerator = exports.StreamdeckGen1ImageHeaderGenerator = void 0;
const util_js_1 = __webpack_require__(4369);
class StreamdeckGen1ImageHeaderGenerator {
    getFillImageCommandHeaderLength() {
        return 16;
    }
    writeFillImageCommandHeader(buffer, props, partIndex, isLast, _bodyLength) {
        const bufferView = (0, util_js_1.uint8ArrayToDataView)(buffer);
        bufferView.setUint8(0, 0x02);
        bufferView.setUint8(1, 0x01);
        bufferView.setUint16(2, partIndex, true);
        bufferView.setUint8(4, isLast ? 1 : 0);
        bufferView.setUint8(5, props.keyIndex + 1);
    }
}
exports.StreamdeckGen1ImageHeaderGenerator = StreamdeckGen1ImageHeaderGenerator;
class StreamdeckGen2ImageHeaderGenerator {
    getFillImageCommandHeaderLength() {
        return 8;
    }
    writeFillImageCommandHeader(buffer, props, partIndex, isLast, bodyLength) {
        const bufferView = (0, util_js_1.uint8ArrayToDataView)(buffer);
        bufferView.setUint8(0, 0x02);
        bufferView.setUint8(1, 0x07);
        bufferView.setUint8(2, props.keyIndex);
        bufferView.setUint8(3, isLast ? 1 : 0);
        bufferView.setUint16(4, bodyLength, true);
        bufferView.setUint16(6, partIndex++, true);
    }
}
exports.StreamdeckGen2ImageHeaderGenerator = StreamdeckGen2ImageHeaderGenerator;
class StreamdeckPlusLcdImageHeaderGenerator {
    getFillImageCommandHeaderLength() {
        return 16;
    }
    writeFillImageCommandHeader(buffer, props, partIndex, isLast, bodyLength) {
        const bufferView = (0, util_js_1.uint8ArrayToDataView)(buffer);
        bufferView.setUint8(0, 0x02);
        bufferView.setUint8(1, 0x0c);
        bufferView.setUint16(2, props.x, true);
        bufferView.setUint16(4, props.y, true);
        bufferView.setUint16(6, props.width, true);
        bufferView.setUint16(8, props.height, true);
        bufferView.setUint8(10, isLast ? 1 : 0);
        bufferView.setUint16(11, partIndex, true);
        bufferView.setUint16(13, bodyLength, true);
    }
}
exports.StreamdeckPlusLcdImageHeaderGenerator = StreamdeckPlusLcdImageHeaderGenerator;
class StreamdeckNeoLcdImageHeaderGenerator {
    getFillImageCommandHeaderLength() {
        return 8;
    }
    writeFillImageCommandHeader(buffer, _props, partIndex, isLast, bodyLength) {
        const bufferView = (0, util_js_1.uint8ArrayToDataView)(buffer);
        bufferView.setUint8(0, 0x02);
        bufferView.setUint8(1, 0x0b);
        bufferView.setUint8(2, 0);
        bufferView.setUint8(3, isLast ? 1 : 0);
        bufferView.setUint16(4, bodyLength, true);
        bufferView.setUint16(6, partIndex, true);
    }
}
exports.StreamdeckNeoLcdImageHeaderGenerator = StreamdeckNeoLcdImageHeaderGenerator;
//# sourceMappingURL=headerGenerator.js.map

/***/ }),

/***/ 3845:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamdeckDefaultImageWriter = exports.StreamdeckOriginalImageWriter = void 0;
const headerGenerator_js_1 = __webpack_require__(3117);
class StreamdeckOriginalImageWriter {
    headerGenerator = new headerGenerator_js_1.StreamdeckGen1ImageHeaderGenerator();
    generateFillImageWrites(props, byteBuffer) {
        const MAX_PACKET_SIZE = 8191;
        const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength();
        // The original uses larger packets, and splits the payload equally across 2
        const packet1Bytes = byteBuffer.length / 2;
        const packet1 = new Uint8Array(MAX_PACKET_SIZE);
        this.headerGenerator.writeFillImageCommandHeader(packet1, props, 0x01, false, packet1Bytes);
        packet1.set(byteBuffer.subarray(0, packet1Bytes), PACKET_HEADER_LENGTH);
        const packet2 = new Uint8Array(MAX_PACKET_SIZE);
        this.headerGenerator.writeFillImageCommandHeader(packet2, props, 0x02, true, packet1Bytes);
        packet2.set(byteBuffer.subarray(packet1Bytes), PACKET_HEADER_LENGTH);
        return [packet1, packet2];
    }
}
exports.StreamdeckOriginalImageWriter = StreamdeckOriginalImageWriter;
class StreamdeckDefaultImageWriter {
    headerGenerator;
    constructor(headerGenerator) {
        this.headerGenerator = headerGenerator;
    }
    generateFillImageWrites(props, byteBuffer) {
        const MAX_PACKET_SIZE = 1024;
        const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength();
        const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH;
        const result = [];
        let remainingBytes = byteBuffer.length;
        for (let part = 0; remainingBytes > 0; part++) {
            const packet = new Uint8Array(MAX_PACKET_SIZE);
            const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE);
            this.headerGenerator.writeFillImageCommandHeader(packet, props, part, remainingBytes <= MAX_PAYLOAD_SIZE, byteCount);
            const byteOffset = byteBuffer.length - remainingBytes;
            remainingBytes -= byteCount;
            packet.set(byteBuffer.subarray(byteOffset, byteOffset + byteCount), PACKET_HEADER_LENGTH);
            result.push(packet);
        }
        return result;
    }
}
exports.StreamdeckDefaultImageWriter = StreamdeckDefaultImageWriter;
//# sourceMappingURL=imageWriter.js.map

/***/ }),

/***/ 2632:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ButtonOnlyInputService = void 0;
class ButtonOnlyInputService {
    deviceProperties;
    #keyState;
    #eventSource;
    constructor(deviceProperties, eventSource) {
        this.deviceProperties = deviceProperties;
        this.#eventSource = eventSource;
        const maxButtonIndex = this.deviceProperties.CONTROLS.filter((control) => control.type === 'button').map((control) => control.index);
        this.#keyState = new Array(Math.max(-1, ...maxButtonIndex) + 1).fill(false);
    }
    handleInput(data) {
        const dataOffset = this.deviceProperties.KEY_DATA_OFFSET || 0;
        for (const control of this.deviceProperties.CONTROLS) {
            if (control.type !== 'button')
                continue;
            const keyPressed = Boolean(data[dataOffset + control.hidIndex]);
            const stateChanged = keyPressed !== this.#keyState[control.index];
            if (stateChanged) {
                this.#keyState[control.index] = keyPressed;
                if (keyPressed) {
                    this.#eventSource.emit('down', control);
                }
                else {
                    this.#eventSource.emit('up', control);
                }
            }
        }
    }
}
exports.ButtonOnlyInputService = ButtonOnlyInputService;
//# sourceMappingURL=gen1.js.map

/***/ }),

/***/ 2769:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gen2InputService = void 0;
const gen1_js_1 = __webpack_require__(2632);
const util_js_1 = __webpack_require__(4369);
class Gen2InputService extends gen1_js_1.ButtonOnlyInputService {
    #eventSource;
    #encoderControls;
    #encoderState;
    #lcdSegmentControls;
    constructor(deviceProperties, eventSource) {
        super(deviceProperties, eventSource);
        this.#eventSource = eventSource;
        this.#encoderControls = deviceProperties.CONTROLS.filter((control) => control.type === 'encoder');
        const maxIndex = Math.max(-1, ...this.#encoderControls.map((control) => control.index));
        this.#encoderState = new Array(maxIndex + 1).fill(false);
        this.#lcdSegmentControls = deviceProperties.CONTROLS.filter((control) => control.type === 'lcd-segment');
    }
    handleInput(data) {
        const inputType = data[0];
        switch (inputType) {
            case 0x00: // Button
                super.handleInput(data);
                break;
            case 0x02: // LCD
                this.#handleLcdSegmentInput(data);
                break;
            case 0x03: // Encoder
                this.#handleEncoderInput(data);
                break;
            case 0x04: // NFC
                this.#handleNfcRead(data);
                break;
        }
    }
    #handleLcdSegmentInput(data) {
        // Future: This will need to handle selecting the correct control
        const lcdSegmentControl = this.#lcdSegmentControls.find((control) => control.id === 0);
        if (!lcdSegmentControl)
            return;
        const bufferView = (0, util_js_1.uint8ArrayToDataView)(data);
        const position = {
            x: bufferView.getUint16(5, true),
            y: bufferView.getUint16(7, true),
        };
        switch (data[3]) {
            case 1: // short press
                this.#eventSource.emit('lcdShortPress', lcdSegmentControl, position);
                break;
            case 2: // long press
                this.#eventSource.emit('lcdLongPress', lcdSegmentControl, position);
                break;
            case 3: {
                // swipe
                const positionTo = {
                    x: bufferView.getUint16(9, true),
                    y: bufferView.getUint16(11, true),
                };
                this.#eventSource.emit('lcdSwipe', lcdSegmentControl, position, positionTo);
                break;
            }
        }
    }
    #handleEncoderInput(data) {
        switch (data[3]) {
            case 0x00: // press/release
                for (const encoderControl of this.#encoderControls) {
                    const keyPressed = Boolean(data[4 + encoderControl.hidIndex]);
                    const stateChanged = keyPressed !== this.#encoderState[encoderControl.index];
                    if (stateChanged) {
                        this.#encoderState[encoderControl.index] = keyPressed;
                        if (keyPressed) {
                            this.#eventSource.emit('down', encoderControl);
                        }
                        else {
                            this.#eventSource.emit('up', encoderControl);
                        }
                    }
                }
                break;
            case 0x01: // rotate
                for (const encoderControl of this.#encoderControls) {
                    const intArray = new Int8Array(data.buffer, data.byteOffset, data.byteLength);
                    const value = intArray[4 + encoderControl.hidIndex];
                    if (value !== 0) {
                        this.#eventSource.emit('rotate', encoderControl, value);
                    }
                }
                break;
        }
    }
    #handleNfcRead(data) {
        if (!this.deviceProperties.HAS_NFC_READER)
            return;
        const length = data[1] + data[2] * 256;
        const id = new TextDecoder('ascii').decode(data.subarray(3, 3 + length));
        this.#eventSource.emit('nfcRead', id);
    }
}
exports.Gen2InputService = Gen2InputService;
//# sourceMappingURL=gen2.js.map

/***/ }),

/***/ 7325:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckNeoLcdService = void 0;
const headerGenerator_js_1 = __webpack_require__(3117);
const imageWriter_js_1 = __webpack_require__(3845);
const util_js_1 = __webpack_require__(4369);
class StreamDeckNeoLcdService {
    #encodeJPEG;
    #device;
    #lcdControls;
    #lcdImageWriter = new imageWriter_js_1.StreamdeckDefaultImageWriter(new headerGenerator_js_1.StreamdeckNeoLcdImageHeaderGenerator());
    constructor(encodeJPEG, device, lcdControls) {
        this.#encodeJPEG = encodeJPEG;
        this.#device = device;
        this.#lcdControls = lcdControls;
    }
    async fillLcdRegion(_index, _x, _y, _imageBuffer, _sourceOptions) {
        throw new Error('Not supported for this model');
    }
    async fillLcd(index, imageBuffer, sourceOptions) {
        const lcdControl = this.#lcdControls.find((control) => control.id === index);
        if (!lcdControl)
            throw new Error(`Invalid lcd segment index ${index}`);
        const imageSize = lcdControl.pixelSize.width * lcdControl.pixelSize.height * sourceOptions.format.length;
        if (imageBuffer.length !== imageSize) {
            throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`);
        }
        // A lot of this drawing code is heavily based on the normal button
        const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, lcdControl.pixelSize, sourceOptions);
        const packets = this.#lcdImageWriter.generateFillImageWrites(null, byteBuffer);
        await this.#device.sendReports(packets);
    }
    async clearLcdSegment(index) {
        const lcdControl = this.#lcdControls.find((control) => control.id === index);
        if (!lcdControl)
            throw new Error(`Invalid lcd segment index ${index}`);
        const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4);
        await this.fillLcd(index, buffer, {
            format: 'rgba',
        });
    }
    async clearAllLcdSegments() {
        const ps = [];
        for (const control of this.#lcdControls) {
            ps.push(this.clearLcdSegment(control.id));
        }
        await Promise.all(ps);
    }
    async convertFillLcdBuffer(sourceBuffer, size, sourceOptions) {
        const sourceOptions2 = {
            format: sourceOptions.format,
            offset: 0,
            stride: size.width * sourceOptions.format.length,
        };
        const byteBuffer = (0, util_js_1.transformImageBuffer)(sourceBuffer, sourceOptions2, { colorMode: 'rgba', xFlip: true, yFlip: true }, 0, size.width, size.height);
        return this.#encodeJPEG(byteBuffer, size.width, size.height);
    }
}
exports.StreamDeckNeoLcdService = StreamDeckNeoLcdService;
//# sourceMappingURL=neo.js.map

/***/ }),

/***/ 5864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckPlusLcdService = void 0;
const headerGenerator_js_1 = __webpack_require__(3117);
const imageWriter_js_1 = __webpack_require__(3845);
const util_js_1 = __webpack_require__(4369);
class StreamDeckPlusLcdService {
    #encodeJPEG;
    #device;
    #lcdControls;
    #lcdImageWriter = new imageWriter_js_1.StreamdeckDefaultImageWriter(new headerGenerator_js_1.StreamdeckPlusLcdImageHeaderGenerator());
    constructor(encodeJPEG, device, lcdControls) {
        this.#encodeJPEG = encodeJPEG;
        this.#device = device;
        this.#lcdControls = lcdControls;
    }
    async fillLcd(index, buffer, sourceOptions) {
        const lcdControl = this.#lcdControls.find((control) => control.id === index);
        if (!lcdControl)
            throw new Error(`Invalid lcd segment index ${index}`);
        return this.fillControlRegion(lcdControl, 0, 0, buffer, {
            format: sourceOptions.format,
            width: lcdControl.pixelSize.width,
            height: lcdControl.pixelSize.height,
        });
    }
    async fillLcdRegion(index, x, y, imageBuffer, sourceOptions) {
        const lcdControl = this.#lcdControls.find((control) => control.id === index);
        if (!lcdControl)
            throw new Error(`Invalid lcd segment index ${index}`);
        return this.fillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions);
    }
    async clearLcdSegment(index) {
        const lcdControl = this.#lcdControls.find((control) => control.id === index);
        if (!lcdControl)
            throw new Error(`Invalid lcd segment index ${index}`);
        const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4);
        await this.fillControlRegion(lcdControl, 0, 0, buffer, {
            format: 'rgba',
            width: lcdControl.pixelSize.width,
            height: lcdControl.pixelSize.height,
        });
    }
    async clearAllLcdSegments() {
        const ps = [];
        for (const control of this.#lcdControls) {
            ps.push(this.clearLcdSegment(control.id));
        }
        await Promise.all(ps);
    }
    async fillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions) {
        // Basic bounds checking
        const maxSize = lcdControl.pixelSize;
        if (x < 0 || x + sourceOptions.width > maxSize.width) {
            throw new TypeError(`Image will not fit within the lcd segment`);
        }
        if (y < 0 || y + sourceOptions.height > maxSize.height) {
            throw new TypeError(`Image will not fit within the lcd segment`);
        }
        const imageSize = sourceOptions.width * sourceOptions.height * sourceOptions.format.length;
        if (imageBuffer.length !== imageSize) {
            throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`);
        }
        // A lot of this drawing code is heavily based on the normal button
        const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, sourceOptions);
        const packets = this.#lcdImageWriter.generateFillImageWrites({ ...sourceOptions, x, y }, byteBuffer);
        await this.#device.sendReports(packets);
    }
    async convertFillLcdBuffer(sourceBuffer, sourceOptions) {
        const sourceOptions2 = {
            format: sourceOptions.format,
            offset: 0,
            stride: sourceOptions.width * sourceOptions.format.length,
        };
        const byteBuffer = (0, util_js_1.transformImageBuffer)(sourceBuffer, sourceOptions2, { colorMode: 'rgba' }, 0, sourceOptions.width, sourceOptions.height);
        return this.#encodeJPEG(byteBuffer, sourceOptions.width, sourceOptions.height);
    }
}
exports.StreamDeckPlusLcdService = StreamDeckPlusLcdService;
//# sourceMappingURL=plus.js.map

/***/ }),

/***/ 993:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gen1PropertiesService = void 0;
class Gen1PropertiesService {
    #device;
    constructor(device) {
        this.#device = device;
    }
    async setBrightness(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new RangeError('Expected brightness percentage to be between 0 and 100');
        }
        // prettier-ignore
        const brightnessCommandBuffer = new Uint8Array([
            0x05,
            0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.#device.sendFeatureReport(brightnessCommandBuffer);
    }
    async resetToLogo() {
        // prettier-ignore
        const resetCommandBuffer = new Uint8Array([
            0x0b,
            0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.#device.sendFeatureReport(resetCommandBuffer);
    }
    async getFirmwareVersion() {
        let val;
        try {
            val = await this.#device.getFeatureReport(4, 32);
        }
        catch (_e) {
            // In case some devices can't handle the different report length
            val = await this.#device.getFeatureReport(4, 17);
        }
        const end = val.indexOf(0, 5);
        return new TextDecoder('ascii').decode(val.subarray(5, end === -1 ? undefined : end));
    }
    async getSerialNumber() {
        let val;
        try {
            val = await this.#device.getFeatureReport(3, 32);
        }
        catch (_e) {
            // In case some devices can't handle the different report length
            val = await this.#device.getFeatureReport(3, 17);
        }
        return new TextDecoder('ascii').decode(val.subarray(5, 17));
    }
}
exports.Gen1PropertiesService = Gen1PropertiesService;
//# sourceMappingURL=gen1.js.map

/***/ }),

/***/ 1352:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gen2PropertiesService = void 0;
class Gen2PropertiesService {
    #device;
    constructor(device) {
        this.#device = device;
    }
    async setBrightness(percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new RangeError('Expected brightness percentage to be between 0 and 100');
        }
        // prettier-ignore
        const brightnessCommandBuffer = new Uint8Array([
            0x03,
            0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.#device.sendFeatureReport(brightnessCommandBuffer);
    }
    async resetToLogo() {
        // prettier-ignore
        const resetCommandBuffer = new Uint8Array([
            0x03,
            0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        await this.#device.sendFeatureReport(resetCommandBuffer);
    }
    async getFirmwareVersion() {
        const val = await this.#device.getFeatureReport(5, 32);
        const end = val[1] + 2;
        return new TextDecoder('ascii').decode(val.subarray(6, end));
    }
    async getSerialNumber() {
        const val = await this.#device.getFeatureReport(6, 32);
        const end = val[1] + 2;
        return new TextDecoder('ascii').decode(val.subarray(2, end));
    }
}
exports.Gen2PropertiesService = Gen2PropertiesService;
//# sourceMappingURL=gen2.js.map

/***/ }),

/***/ 3874:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PedalPropertiesService = void 0;
class PedalPropertiesService {
    #device;
    constructor(device) {
        this.#device = device;
    }
    async setBrightness(_percentage) {
        // Not supported
    }
    async resetToLogo() {
        // Not supported
    }
    async getFirmwareVersion() {
        const val = await this.#device.getFeatureReport(5, 32);
        const end = val.indexOf(0, 6);
        return new TextDecoder('ascii').decode(val.subarray(6, end === -1 ? undefined : end));
    }
    async getSerialNumber() {
        const val = await this.#device.getFeatureReport(6, 32);
        return new TextDecoder('ascii').decode(val.subarray(2, 14));
    }
}
exports.PedalPropertiesService = PedalPropertiesService;
//# sourceMappingURL=pedal.js.map

/***/ }),

/***/ 5064:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=types.js.map

/***/ }),

/***/ 4369:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BMP_HEADER_LENGTH = void 0;
exports.transformImageBuffer = transformImageBuffer;
exports.writeBMPHeader = writeBMPHeader;
exports.uint8ArrayToDataView = uint8ArrayToDataView;
function transformImageBuffer(imageBuffer, sourceOptions, targetOptions, destPadding, imageWidth, imageHeight) {
    const imageBufferView = uint8ArrayToDataView(imageBuffer);
    const byteBuffer = new Uint8Array(destPadding + imageWidth * imageHeight * targetOptions.colorMode.length);
    const byteBufferView = uint8ArrayToDataView(byteBuffer);
    const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3);
    for (let y = 0; y < imageHeight; y++) {
        const rowOffset = destPadding + imageWidth * targetOptions.colorMode.length * y;
        for (let x = 0; x < imageWidth; x++) {
            // Apply x/y flips
            let x2 = targetOptions.xFlip ? imageWidth - x - 1 : x;
            let y2 = targetOptions.yFlip ? imageHeight - y - 1 : y;
            if (targetOptions.rotate) {
                // Swap x and y
                const tmpX = x2;
                x2 = y2;
                y2 = tmpX;
            }
            const srcOffset = y2 * sourceOptions.stride + sourceOptions.offset + x2 * sourceOptions.format.length;
            const red = imageBufferView.getUint8(srcOffset);
            const green = imageBufferView.getUint8(srcOffset + 1);
            const blue = imageBufferView.getUint8(srcOffset + 2);
            const targetOffset = rowOffset + x * targetOptions.colorMode.length;
            if (flipColours) {
                byteBufferView.setUint8(targetOffset, blue);
                byteBufferView.setUint8(targetOffset + 1, green);
                byteBufferView.setUint8(targetOffset + 2, red);
            }
            else {
                byteBufferView.setUint8(targetOffset, red);
                byteBufferView.setUint8(targetOffset + 1, green);
                byteBufferView.setUint8(targetOffset + 2, blue);
            }
            if (targetOptions.colorMode.length === 4) {
                byteBufferView.setUint8(targetOffset + 3, 255);
            }
        }
    }
    return byteBuffer;
}
exports.BMP_HEADER_LENGTH = 54;
function writeBMPHeader(buf, imageWidth, imageHeight, imageBytes, imagePPM) {
    const bufView = uint8ArrayToDataView(buf);
    // Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format
    // Bitmap file header
    bufView.setUint8(0, 0x42); // B
    bufView.setUint8(1, 0x4d); // M
    bufView.setUint32(2, imageBytes + 54, true);
    bufView.setInt16(6, 0, true);
    bufView.setInt16(8, 0, true);
    bufView.setUint32(10, 54, true); // Full header size
    // DIB header (BITMAPINFOHEADER)
    bufView.setUint32(14, 40, true); // DIB header size
    bufView.setInt32(18, imageWidth, true);
    bufView.setInt32(22, imageHeight, true);
    bufView.setInt16(26, 1, true); // Color planes
    bufView.setInt16(28, 24, true); // Bit depth
    bufView.setInt32(30, 0, true); // Compression
    bufView.setInt32(34, imageBytes, true); // Image size
    bufView.setInt32(38, imagePPM, true); // Horizontal resolution ppm
    bufView.setInt32(42, imagePPM, true); // Vertical resolution ppm
    bufView.setInt32(46, 0, true); // Colour pallette size
    bufView.setInt32(50, 0, true); // 'Important' Colour count
}
function uint8ArrayToDataView(buffer) {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
//# sourceMappingURL=util.js.map

/***/ }),

/***/ 2863:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebHIDDevice = void 0;
const eventemitter3_1 = __webpack_require__(2646);
const p_queue_1 = __webpack_require__(4968);
/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
class WebHIDDevice extends eventemitter3_1.EventEmitter {
    device;
    reportQueue = new p_queue_1.default({ concurrency: 1 });
    constructor(device) {
        super();
        this.device = device;
        // this.device.on('data', data => this.emit('data', data))
        // this.device.on('error', error => this.emit('error', error))
        this.device.addEventListener('inputreport', (event) => {
            // Button press
            if (event.reportId === 0x01) {
                const data = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
                this.emit('input', data);
            }
        });
    }
    async close() {
        return this.device.close();
    }
    async forget() {
        return this.device.forget();
    }
    async sendFeatureReport(data) {
        return this.device.sendFeatureReport(data[0], data.subarray(1));
    }
    async getFeatureReport(reportId, _reportLength) {
        const view = await this.device.receiveFeatureReport(reportId);
        return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
    async sendReports(buffers) {
        return this.reportQueue.add(async () => {
            for (const data of buffers) {
                await this.device.sendReport(data[0], data.subarray(1));
            }
        });
    }
    async getDeviceInfo() {
        return {
            path: undefined,
            productId: this.device.productId,
            vendorId: this.device.vendorId,
        };
    }
    async getChildDeviceInfo() {
        // Not supported
        return null;
    }
}
exports.WebHIDDevice = WebHIDDevice;
//# sourceMappingURL=hid-device.js.map

/***/ }),

/***/ 8253:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/* eslint-disable n/no-unsupported-features/node-builtins */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckWeb = exports.DeviceModelId = exports.VENDOR_ID = void 0;
exports.requestStreamDecks = requestStreamDecks;
exports.getStreamDecks = getStreamDecks;
exports.openDevice = openDevice;
const core_1 = __webpack_require__(8601);
const hid_device_js_1 = __webpack_require__(2863);
const jpeg_js_1 = __webpack_require__(8443);
const wrapper_js_1 = __webpack_require__(3026);
var core_2 = __webpack_require__(8601);
Object.defineProperty(exports, "VENDOR_ID", ({ enumerable: true, get: function () { return core_2.VENDOR_ID; } }));
Object.defineProperty(exports, "DeviceModelId", ({ enumerable: true, get: function () { return core_2.DeviceModelId; } }));
var wrapper_js_2 = __webpack_require__(3026);
Object.defineProperty(exports, "StreamDeckWeb", ({ enumerable: true, get: function () { return wrapper_js_2.StreamDeckWeb; } }));
/**
 * Request the user to select some streamdecks to open
 * @param userOptions Options to customise the device behvaiour
 */
async function requestStreamDecks(options) {
    // TODO - error handling
    const browserDevices = await navigator.hid.requestDevice({
        filters: [
            {
                vendorId: core_1.VENDOR_ID,
            },
        ],
    });
    return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)));
}
/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
async function getStreamDecks(options) {
    const browserDevices = await navigator.hid.getDevices();
    const validDevices = browserDevices.filter((d) => d.vendorId === core_1.VENDOR_ID);
    const resultDevices = await Promise.all(validDevices.map(async (dev) => openDevice(dev, options).catch((_) => null)));
    return resultDevices.filter((v) => !!v);
}
/**
 * Open a StreamDeck from a manually selected HIDDevice handle
 * @param browserDevice The unopened browser HIDDevice
 * @param userOptions Options to customise the device behvaiour
 */
async function openDevice(browserDevice, userOptions) {
    const model = core_1.DEVICE_MODELS.find((m) => browserDevice.vendorId === core_1.VENDOR_ID && m.productIds.includes(browserDevice.productId));
    if (!model) {
        throw new Error('Stream Deck is of unexpected type.');
    }
    await browserDevice.open();
    try {
        const options = {
            encodeJPEG: jpeg_js_1.encodeJPEG,
            ...userOptions,
        };
        const browserHid = new hid_device_js_1.WebHIDDevice(browserDevice);
        const device = model.factory(browserHid, options || {});
        return new wrapper_js_1.StreamDeckWeb(device, browserHid);
    }
    catch (e) {
        await browserDevice.close().catch(() => null); // Suppress error
        throw e;
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8443:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.encodeJPEG = encodeJPEG;
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
                    reject(new Error('No image generated'));
                }
            }, 'image/jpeg', 0.9);
        }
        else {
            reject(new Error('Failed to get canvas context'));
        }
    });
    return new Uint8Array(await blob.arrayBuffer());
}
//# sourceMappingURL=jpeg.js.map

/***/ }),

/***/ 3026:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDeckWeb = void 0;
const core_1 = __webpack_require__(8601);
/**
 * A StreamDeck instance.
 * This is an extended variant of the class, to provide some more web friendly helpers, such as accepting a canvas
 */
class StreamDeckWeb extends core_1.StreamDeckProxy {
    hid;
    constructor(device, hid) {
        super(device);
        this.hid = hid;
    }
    /**
     * Instruct the browser to close and forget the device. This will revoke the website's permissions to access the device.
     */
    async forget() {
        await this.hid.forget();
    }
    async fillKeyCanvas(keyIndex, canvas) {
        // this.checkValidKeyIndex(keyIndex)
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get canvas context');
        const control = this.CONTROLS.find((control) => control.type === 'button' && control.index === keyIndex);
        if (!control || control.feedbackType === 'none')
            throw new TypeError(`Expected a valid keyIndex`);
        if (control.feedbackType !== 'lcd')
            throw new TypeError(`keyIndex ${control.index} does not support lcd feedback`);
        const data = ctx.getImageData(0, 0, control.pixelSize.width, control.pixelSize.height);
        return this.device.fillKeyBuffer(keyIndex, data.data, { format: 'rgba' });
    }
    async fillPanelCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get canvas context');
        const dimensions = this.device.calculateFillPanelDimensions();
        if (!dimensions)
            throw new Error('Panel does not support filling');
        const data = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
        return this.device.fillPanelBuffer(data.data, { format: 'rgba' });
    }
}
exports.StreamDeckWeb = StreamDeckWeb;
//# sourceMappingURL=wrapper.js.map

/***/ }),

/***/ 5823:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __addDisposableResource: () => (/* binding */ __addDisposableResource),
/* harmony export */   __assign: () => (/* binding */ __assign),
/* harmony export */   __asyncDelegator: () => (/* binding */ __asyncDelegator),
/* harmony export */   __asyncGenerator: () => (/* binding */ __asyncGenerator),
/* harmony export */   __asyncValues: () => (/* binding */ __asyncValues),
/* harmony export */   __await: () => (/* binding */ __await),
/* harmony export */   __awaiter: () => (/* binding */ __awaiter),
/* harmony export */   __classPrivateFieldGet: () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   __classPrivateFieldIn: () => (/* binding */ __classPrivateFieldIn),
/* harmony export */   __classPrivateFieldSet: () => (/* binding */ __classPrivateFieldSet),
/* harmony export */   __createBinding: () => (/* binding */ __createBinding),
/* harmony export */   __decorate: () => (/* binding */ __decorate),
/* harmony export */   __disposeResources: () => (/* binding */ __disposeResources),
/* harmony export */   __esDecorate: () => (/* binding */ __esDecorate),
/* harmony export */   __exportStar: () => (/* binding */ __exportStar),
/* harmony export */   __extends: () => (/* binding */ __extends),
/* harmony export */   __generator: () => (/* binding */ __generator),
/* harmony export */   __importDefault: () => (/* binding */ __importDefault),
/* harmony export */   __importStar: () => (/* binding */ __importStar),
/* harmony export */   __makeTemplateObject: () => (/* binding */ __makeTemplateObject),
/* harmony export */   __metadata: () => (/* binding */ __metadata),
/* harmony export */   __param: () => (/* binding */ __param),
/* harmony export */   __propKey: () => (/* binding */ __propKey),
/* harmony export */   __read: () => (/* binding */ __read),
/* harmony export */   __rest: () => (/* binding */ __rest),
/* harmony export */   __runInitializers: () => (/* binding */ __runInitializers),
/* harmony export */   __setFunctionName: () => (/* binding */ __setFunctionName),
/* harmony export */   __spread: () => (/* binding */ __spread),
/* harmony export */   __spreadArray: () => (/* binding */ __spreadArray),
/* harmony export */   __spreadArrays: () => (/* binding */ __spreadArrays),
/* harmony export */   __values: () => (/* binding */ __values),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
  __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
  }
  return __assign.apply(this, arguments);
}

function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
      }
  return t;
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); }
}

function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
      }
      else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
      }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};

function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};

function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
};

function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

/** @deprecated */
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
  return ar;
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
  function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
  function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
  function fulfill(value) { resume("next", value); }
  function reject(value) { resume("throw", value); }
  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
  return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}

function __importDefault(mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
    env.stack.push({ value: value, dispose: dispose, async: async });
  }
  else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  var r, s = 0;
  function next() {
    while (r = env.stack.pop()) {
      try {
        if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
        if (r.dispose) {
          var result = r.dispose.call(r.value);
          if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
        }
        else s |= 1;
      }
      catch (e) {
        fail(e);
      }
    }
    if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
    if (env.hasError) throw env.error;
  }
  return next();
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __createBinding,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __spreadArray,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  __classPrivateFieldIn,
  __addDisposableResource,
  __disposeResources,
});


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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const webhid_1 = __webpack_require__(8253);
const dom_1 = __webpack_require__(2035);
const fill_when_pressed_1 = __webpack_require__(4964);
const rapid_fill_1 = __webpack_require__(1215);
const chase_1 = __webpack_require__(1889);
if (true) {
    const elm = document.querySelector('#version_str');
    if (elm) {
        elm.innerHTML = `v${"7.0.2"}`;
    }
}
function appendLog(str) {
    const logElm = document.getElementById('log');
    if (logElm) {
        logElm.textContent = `${str}\n${logElm.textContent ?? ''}`;
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
    device.on('down', (control) => {
        if (control.type === 'button') {
            appendLog(`Key ${control.index} down`);
            currentDemo.keyDown(device, control.index).catch(console.error);
        }
        else {
            appendLog(`Encoder ${control.index} down`);
        }
    });
    device.on('up', (control) => {
        if (control.type === 'button') {
            appendLog(`Key ${control.index} up`);
            currentDemo.keyUp(device, control.index).catch(console.error);
        }
        else {
            appendLog(`Encoder ${control.index} down`);
        }
    });
    device.on('rotate', (control, amount) => {
        appendLog(`Encoder ${control.index} rotate (${amount})`);
    });
    device.on('lcdShortPress', (control, position) => {
        appendLog(`LCD (${control.id}) short press (${position.x},${position.y})`);
    });
    device.on('lcdLongPress', (control, position) => {
        appendLog(`LCD (${control.id}) long press (${position.x},${position.y})`);
    });
    device.on('lcdSwipe', (control, fromPosition, toPosition) => {
        appendLog(`LCD (${control.id}) swipe (${fromPosition.x},${fromPosition.y}) -> (${toPosition.x},${toPosition.y})`);
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