export const DEFAULT_TCP_PORT = 5343

export const RECONNECT_INTERVAL = 5000
export const TIMEOUT_DURATION = 5000 // Note: must be more than the

export const DEFAULT_MDNS_QUERY_INTERVAL = 10000

export const CORA_MAGIC = Buffer.from([0x43, 0x93, 0x8a, 0x41])

/**
 * The product id the Stream Deck Network Dock reports over tcp.
 * Note: This isn't a real usb product id, the dock is not a usb device
 */
export const NETWORK_DOCK_TCP_PRODUCT_ID = 0xffff
