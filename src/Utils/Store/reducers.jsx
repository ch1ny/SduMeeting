import { combineReducers } from '@reduxjs/toolkit';
import { CALL_STATUS_FREE } from 'Utils/Constraints';
import {
	ADD_MESSAGE_HISTORY,
	ADD_UNREAD_MESSAGE,
	EXCHANGE_AUDIO_DEVICE,
	EXCHANGE_VIDEO_DEVICE,
	GET_MORE_MESSAGE_HISTORY,
	INIT_MESSAGE_HISTORY,
	REMOVE_MESSAGE_HISTORY,
	REMOVE_UNREAD_MESSAGES,
	SET_AUTH_TOKEN,
	SET_CALL_STATUS,
	UPDATE_AVAILABLE_AUDIO_DEVICES,
	UPDATE_AVAILABLE_VIDEO_DEVICES,
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

function setAuthToken(state = null, action) {
	if (action.type === SET_AUTH_TOKEN) {
		return action.token;
	}
	return state;
}

function setUnreadMessages(state = {}, action) {
	switch (action.type) {
		case ADD_UNREAD_MESSAGE:
			const { fromId, toId, myId } = action.payload;
			const messageOwnerId = fromId === myId ? toId : fromId;
			const newArr = state[`${messageOwnerId}`]
				? [...state[`${messageOwnerId}`]]
				: new Array();
			newArr.push(action.payload);
			return Object.assign({}, state, {
				[`${messageOwnerId}`]: newArr,
			});
		case REMOVE_UNREAD_MESSAGES:
			const { userId } = action.payload;
			const newState = Object.assign({}, state);
			delete newState[`${userId}`];
			return newState;
		default:
			return state;
	}
}

function setMessageHistory(state = {}, action) {
	switch (action.type) {
		case INIT_MESSAGE_HISTORY:
			return action.payload;
		case GET_MORE_MESSAGE_HISTORY:
			const { chatId } = action.payload;
			const newArr1 = state[`${chatId}`] ? [...state[`${chatId}`]] : new Array();
			newArr1.unshift(action.payload);
			return Object.assign({}, state, {
				[`${chatId}`]: newArr1,
			});
		case ADD_MESSAGE_HISTORY:
			const { fromId, toId, myId } = action.payload;
			const messageOwnerId = fromId === myId ? toId : fromId;
			const newArr2 = state[`${messageOwnerId}`]
				? [...state[`${messageOwnerId}`]]
				: new Array();
			newArr2.push(action.payload);
			const newMessages = Object.assign({}, state, {
				[`${messageOwnerId}`]: newArr2,
			});
			return newMessages;
		case REMOVE_MESSAGE_HISTORY:
			const { userId } = action.payload;
			const newState = Object.assign({}, state);
			delete newState[`${userId}`];
			return newState;
		default:
			return state;
	}
}

function setCallStatus(state = CALL_STATUS_FREE, action) {
	if (action.type === SET_CALL_STATUS) {
		return action.status;
	}
	return state;
}

const reducers = combineReducers({
	availableVideoDevices: updateAvailableVideoDevices,
	availableAudioDevices: updateAvailableAudioDevices,
	usingVideoDevice: exchangeVideoDevice,
	usingAudioDevice: exchangeAudioDevice,
	authToken: setAuthToken,
	unreadMessages: setUnreadMessages,
	messageHistory: setMessageHistory,
	callStatus: setCallStatus,
});

export default reducers;
