import { combineReducers } from "redux";
import {
    UPDATE_AVAILABLE_VIDEO_DEVICES,
    UPDATE_AVAILABLE_AUDIO_DEVICES,
    EXCHANGE_AUDIO_DEVICE,
    EXCHANGE_VIDEO_DEVICE,
} from './actions'

function updateAvailableVideoDevices(state = [{ label: 'screen', webLabel: '屏幕抓取', deviceId: 'screen' }], action) {
    switch (action.type) {
        case UPDATE_AVAILABLE_VIDEO_DEVICES:
            action.devices.push()
            return [{ label: 'screen', webLabel: '屏幕抓取', deviceId: 'screen' }].concat(action.devices)
        default:
            return state
    }
}

function updateAvailableAudioDevices(state = [], action) {
    switch (action.type) {
        case UPDATE_AVAILABLE_AUDIO_DEVICES:
            return action.devices
        default:
            return state
    }
}

function exchangeVideoDevice(state = null, action) {
    switch (action.type) {
        case EXCHANGE_VIDEO_DEVICE:
            return action.deviceInfo
        default:
            return state
    }
}

function exchangeAudioDevice(state = null, action) {
    switch (action.type) {
        case EXCHANGE_AUDIO_DEVICE:
            return action.deviceInfo
        default:
            return state
    }
}

const reducers = combineReducers({
    availableVideoDevices: updateAvailableVideoDevices,
    availableAudioDevices: updateAvailableAudioDevices,
    usingVideoDevice: exchangeVideoDevice,
    usingAudioDevice: exchangeAudioDevice
})

export default reducers