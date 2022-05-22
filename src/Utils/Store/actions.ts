/**
 * action 类型
 */

import { ChatWebSocketType, DEVICE_TYPE } from "Utils/Constraints";
import { DeviceInfo } from "Utils/Types";

const UNDEFINED_ACTION = 'UNDEFINED_ACTION'

// 选择当前聊天的对象 ID
export const SET_NOW_CHATTING_ID = 'SET_NOW_CHATTING_ID';
export function setNowChattingId(nowChattingId: number | null) {
    return { type: SET_NOW_CHATTING_ID, nowChattingId };
}

export const SET_NOW_WEBRTC_FRIEND_ID = 'SET_NOW_WEBRTC_FRIEND_ID';
export function setNowWebrtcFriendId(nowWebrtcFriendId: number | null) {
    return { type: SET_NOW_WEBRTC_FRIEND_ID, nowWebrtcFriendId };
}


// 更新可用的音视频设备
export const UPDATE_AVAILABLE_VIDEO_DEVICES = 'UPDATE_AVAILABLE_VIDEO_DEVICES';
export const UPDATE_AVAILABLE_AUDIO_DEVICES = 'UPDATE_AVAILABLE_AUDIO_DEVICES';
export function updateAvailableDevices(deviceType: string, devices: DeviceInfo[]) {
    switch (deviceType) {
        case DEVICE_TYPE.VIDEO_DEVICE:
            return { type: UPDATE_AVAILABLE_VIDEO_DEVICES, devices };
        case DEVICE_TYPE.AUDIO_DEVICE:
            return { type: UPDATE_AVAILABLE_AUDIO_DEVICES, devices };
        default:
            return { type: UNDEFINED_ACTION };
    }
}

// 更换选中的音视频设备
export const EXCHANGE_VIDEO_DEVICE = 'EXCHANGE_VIDEO_DEVICE';
export const EXCHANGE_AUDIO_DEVICE = 'EXCHANGE_AUDIO_DEVICE';
export function exchangeMediaDevice(deviceType: string, deviceInfo: DeviceInfo) {
    switch (deviceType) {
        case DEVICE_TYPE.VIDEO_DEVICE:
            return { type: EXCHANGE_VIDEO_DEVICE, deviceInfo };
        case DEVICE_TYPE.AUDIO_DEVICE:
            return { type: EXCHANGE_AUDIO_DEVICE, deviceInfo };
        default:
            return { type: UNDEFINED_ACTION };
    }
}

// 设置用户 Token
export const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
export function setAuthToken(token: string) {
    return { type: SET_AUTH_TOKEN, token };
}

// 管理未读消息
export const ADD_UNREAD_MESSAGE = 'ADD_UNREAD_MESSAGE';
export const REMOVE_UNREAD_MESSAGES = 'REMOVE_UNREAD_MESSAGES';
export function setUnreadMessages(operation: string, payload: any) {
    return { type: operation, payload };
}

// 管理消息记录
export const INIT_MESSAGE_HISTORY = 'INIT_MESSAGE_HISTORY';
export const SYNC_CLOUD_MESSAGE_HISTORY = 'SYNC_CLOUD_MESSAGE_HISTORY';
export const GET_MORE_MESSAGE_HISTORY = 'GET_MORE_MESSAGE_HISTORY';
export const ADD_MESSAGE_HISTORY = 'ADD_MESSAGE_HISTORY';
export const REMOVE_MESSAGE_HISTORY = 'REMOVE_MESSAGE_HISTORY';
export function setMessageHistory(operation: string, payload: any) {
    return { type: operation, payload };
}

// 应用通话状态
export const SET_CALL_STATUS = 'SET_CALL_STATUS';
export function setCallStatus(status: ChatWebSocketType) {
    return { type: SET_CALL_STATUS, status };
}
