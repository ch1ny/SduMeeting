import { combineReducers } from 'redux';
import {
	UPDATE_AVAILABLE_VIDEO_DEVICES,
	UPDATE_AVAILABLE_AUDIO_DEVICES,
	EXCHANGE_AUDIO_DEVICE,
	EXCHANGE_VIDEO_DEVICE,
} from './actions';

function updateAvailableVideoDevices(state = [], action) {
	switch (action.type) {
		case UPDATE_AVAILABLE_VIDEO_DEVICES:
			return action.devices;
		default:
			return state;
	}
}

function updateAvailableAudioDevices(state = [], action) {
	switch (action.type) {
		case UPDATE_AVAILABLE_AUDIO_DEVICES:
			return action.devices;
		default:
			return state;
	}
}

function exchangeVideoDevice(state = null, action) {
	switch (action.type) {
		case EXCHANGE_VIDEO_DEVICE:
			localStorage.setItem('usingVideoDevice', action.deviceInfo.key);
			return action.deviceInfo;
		default:
			return state;
	}
}

function exchangeAudioDevice(state = null, action) {
	switch (action.type) {
		case EXCHANGE_AUDIO_DEVICE:
			localStorage.setItem('usingAudioDevice', action.deviceInfo.key);
			return action.deviceInfo;
		default:
			return state;
	}
}

const reducers = combineReducers({
	availableVideoDevices: updateAvailableVideoDevices,
	availableAudioDevices: updateAvailableAudioDevices,
	usingVideoDevice: exchangeVideoDevice,
	usingAudioDevice: exchangeAudioDevice,
});

export default reducers;
