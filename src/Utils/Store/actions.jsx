/**
 * action 类型
 */
// 更新可用的音视频设备
export const UPDATE_AVAILABLE_VIDEO_DEVICES = 'UPDATE_AVAILABLE_VIDEO_DEVICES';
export const UPDATE_AVAILABLE_AUDIO_DEVICES = 'UPDATE_AVAILABLE_AUDIO_DEVICES';
// 更换选中的音视频设备
export const EXCHANGE_VIDEO_DEVICE = 'EXCHANGE_VIDEO_DEVICE';
export const EXCHANGE_AUDIO_DEVICE = 'EXCHANGE_AUDIO_DEVICE';
// 设置用户 Token
export const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
// 管理未读消息
export const ADD_UNREAD_MESSAGE = 'ADD_UNREAD_MESSAGE';
export const REMOVE_UNREAD_MESSAGES = 'REMOVE_UNREAD_MESSAGES';
// 管理消息记录
export const INIT_MESSAGE_HISTORY = 'INIT_MESSAGE_HISTORY';
export const GET_MORE_MESSAGE_HISTORY = 'GET_MORE_MESSAGE_HISTORY';
export const ADD_MESSAGE_HISTORY = 'ADD_MESSAGE_HISTORY';
export const REMOVE_MESSAGE_HISTORY = 'REMOVE_MESSAGE_HISTORY';
// 应用通话状态
export const SET_CALL_STATUS = 'SET_CALL_STATUS';

/**
 * 其他常量
 */
// 音视频设备
export const DEVICE_TYPE = {
	VIDEO_DEVICE: 'video',
	AUDIO_DEVICE: 'audio',
};

/**
 * action 活动
 */
export function updateAvailableDevices(deviceType, devices) {
	switch (deviceType) {
		case DEVICE_TYPE.VIDEO_DEVICE:
			return { type: UPDATE_AVAILABLE_VIDEO_DEVICES, devices };
		case DEVICE_TYPE.AUDIO_DEVICE:
			return { type: UPDATE_AVAILABLE_AUDIO_DEVICES, devices };
		default:
			return null;
	}
}
export function exchangeMediaDevice(deviceType, deviceInfo) {
	switch (deviceType) {
		case DEVICE_TYPE.VIDEO_DEVICE:
			return { type: EXCHANGE_VIDEO_DEVICE, deviceInfo };
		case DEVICE_TYPE.AUDIO_DEVICE:
			return { type: EXCHANGE_AUDIO_DEVICE, deviceInfo };
		default:
			return null;
	}
}

export function setAuthToken(token) {
	return { type: SET_AUTH_TOKEN, token };
}

export function setUnreadMessages(operation, payload) {
	return { type: operation, payload };
}

export function setMessageHistory(operation, payload) {
	return { type: operation, payload };
}

export function setCallStatus(status) {
	return { type: SET_CALL_STATUS, status };
}
