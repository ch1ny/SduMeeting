import { combineReducers } from '@reduxjs/toolkit';
import { updateToken } from 'Utils/Axios/Axios';
import { CALL_STATUS_FREE, ChatWebSocketType } from 'Utils/Constraints';
import { ChatMessage, DeviceInfo } from 'Utils/Types';
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
	SET_NOW_CHATTING_ID,
	SET_NOW_WEBRTC_FRIEND_ID,
	SYNC_CLOUD_MESSAGE_HISTORY,
	UPDATE_AVAILABLE_AUDIO_DEVICES,
	UPDATE_AVAILABLE_VIDEO_DEVICES,
} from './actions';

function setNowChattingId(state = null, action: { type: string; nowChattingId: number | null }) {
	if (action.type === SET_NOW_CHATTING_ID) {
		return action.nowChattingId;
	}
	return state;
}

function setNowWebrtcFriendId(
	state = null,
	action: { type: string; nowWebrtcFriendId: number | null }
) {
	if (action.type === SET_NOW_WEBRTC_FRIEND_ID) {
		return action.nowWebrtcFriendId;
	}
	return state;
}

function updateAvailableVideoDevices(
	state = new Array(),
	action: { type: string; devices: DeviceInfo[] }
): Array<DeviceInfo> {
	switch (action.type) {
		case UPDATE_AVAILABLE_VIDEO_DEVICES:
			return action.devices;
		default:
			return state;
	}
}

function updateAvailableAudioDevices(
	state = new Array(),
	action: { type: string; devices: DeviceInfo[] }
): Array<DeviceInfo> {
	switch (action.type) {
		case UPDATE_AVAILABLE_AUDIO_DEVICES:
			return action.devices;
		default:
			return state;
	}
}

function exchangeVideoDevice(state = null, action: { type: string; deviceInfo: DeviceInfo }) {
	switch (action.type) {
		case EXCHANGE_VIDEO_DEVICE:
			localStorage.setItem('usingVideoDevice', action.deviceInfo.deviceId);
			return action.deviceInfo;
		default:
			return state;
	}
}

function exchangeAudioDevice(state = null, action: { type: string; deviceInfo: DeviceInfo }) {
	switch (action.type) {
		case EXCHANGE_AUDIO_DEVICE:
			localStorage.setItem('usingAudioDevice', action.deviceInfo.deviceId);
			return action.deviceInfo;
		default:
			return state;
	}
}

function setAuthToken(state = null, action: { type: string; token: string }) {
	if (action.type === SET_AUTH_TOKEN) {
		updateToken(action.token);
		return action.token;
	}
	return state;
}

function setUnreadMessages(
	state = {},
	action: { type: string; payload: any }
): {
	[user: string]: ChatMessage[];
} {
	switch (action.type) {
		case ADD_UNREAD_MESSAGE:
			const { fromId, toId, myId } = action.payload;
			const messageOwnerId = fromId === myId ? toId : fromId;
			const newArr = state[`${messageOwnerId}` as keyof typeof state]
				? [...state[`${messageOwnerId}` as keyof typeof state]]
				: new Array();
			newArr.push(action.payload);
			return Object.assign({}, state, {
				[`${messageOwnerId}`]: newArr,
			});
		case REMOVE_UNREAD_MESSAGES:
			const { userId } = action.payload;
			const newState = Object.assign({}, state);
			delete newState[`${userId}` as keyof typeof newState];
			return newState;
		default:
			return state;
	}
}

function setMessageHistory(state = {}, action: { type: string; payload: any }) {
	switch (action.type) {
		case INIT_MESSAGE_HISTORY:
			return action.payload;
		case SYNC_CLOUD_MESSAGE_HISTORY:
			return Object.assign({}, state, action.payload);
		case GET_MORE_MESSAGE_HISTORY:
			const chatId = action.payload.chatId as keyof typeof state;
			const newArr1 = state[`${chatId}`] ? [...state[`${chatId}`]] : new Array();
			newArr1.unshift(action.payload);
			return Object.assign({}, state, {
				[`${chatId}`]: newArr1,
			});
		case ADD_MESSAGE_HISTORY:
			const { fromId, toId, myId } = action.payload;
			const messageOwnerId = (fromId === myId ? toId : fromId) as keyof typeof state;
			const newArr2 = state[`${messageOwnerId}`]
				? [...state[`${messageOwnerId}`]]
				: new Array();
			newArr2.push(action.payload);
			const newMessages = Object.assign({}, state, {
				[`${messageOwnerId}`]: newArr2,
			});
			return newMessages;
		case REMOVE_MESSAGE_HISTORY:
			const newState = Object.assign({}, state);
			const userId = action.payload.userId as keyof typeof newState;
			delete newState[`${userId}`];
			return newState;
		default:
			return state;
	}
}

function setCallStatus(
	state = CALL_STATUS_FREE,
	action: { type: string; status: ChatWebSocketType }
) {
	if (action.type === SET_CALL_STATUS) {
		return action.status;
	}
	return state;
}

const reducers = combineReducers({
	nowChattingId: setNowChattingId,
	nowWebrtcFriendId: setNowWebrtcFriendId,
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
