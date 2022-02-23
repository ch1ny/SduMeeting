/**
 * action 类型
 */
export const UPDATE_AVAILABLE_VIDEO_DEVICES = 'UPDATE_AVAILABLE_VIDEO_DEVICES'
export const UPDATE_AVAILABLE_AUDIO_DEVICES = 'UPDATE_AVAILABLE_AUDIO_DEVICES'
export const EXCHANGE_VIDEO_DEVICE = 'EXCHANGE_VIDEO_DEVICE'
export const EXCHANGE_AUDIO_DEVICE = 'EXCHANGE_AUDIO_DEVICE'

/**
 * 其他常量
 */
export const DEVICE_TYPE = {
    VIDEO_DEVICE: 'video',
    AUDIO_DEVICE: 'audio'
}

/**
 * action 活动
 */
export function updateAvailableDevices(deviceType, devices) {
    switch (deviceType) {
        case DEVICE_TYPE.VIDEO_DEVICE:
            return { type: UPDATE_AVAILABLE_VIDEO_DEVICES, devices }
        case DEVICE_TYPE.AUDIO_DEVICE:
            return { type: UPDATE_AVAILABLE_AUDIO_DEVICES, devices }
    }
}
export function exchangeMediaDevice(deviceType, deviceInfo) {
    switch (deviceType) {
        case DEVICE_TYPE.VIDEO_DEVICE:
            return { type: EXCHANGE_VIDEO_DEVICE, deviceInfo }
        case DEVICE_TYPE.AUDIO_DEVICE:
            return { type: EXCHANGE_AUDIO_DEVICE, deviceInfo }
    }
}