/**
 * 这个文件用来存放一些常量
 */
// 音视频设备
export const DEVICE_TYPE = {
    VIDEO_DEVICE: 'video',
    AUDIO_DEVICE: 'audio',
};

/**
 * 通话状态
 */
export const CALL_STATUS_FREE = 0;
export const CALL_STATUS_OFFERING = 1;
export const CALL_STATUS_OFFERED = 2;
export const CALL_STATUS_ANSWERING = 3;
export const CALL_STATUS_CALLING = 4;

/**
 * 回复好友申请
 */
export const ACCEPT_FRIEND_REQUEST = 2;
export const REJECT_FRIEND_REQUEST = 1;
export const NO_OPERATION_FRIEND_REQUEST = -1;

/**
 * 聊天系统 WebSocket type 参数
 */
export enum ChatWebSocketType {
    UNDEFINED_0, // 未定义 0 占位
    CHAT_SEND_PRIVATE_MESSAGE, // 发送私聊消息
    CHAT_READ_MESSAGE, // 签收私聊消息
    CHAT_SEND_FRIEND_REQUEST, // 发送好友请求
    CHAT_ANSWER_FRIEND_REQUEST, // 响应好友请求
    CHAT_PRIVATE_WEBRTC_OFFER, // 发送视频聊天请求 OFFER
    CHAT_PRIVATE_WEBRTC_ANSWER, // 响应视频聊天请求 ANSWER
    CHAT_PRIVATE_WEBRTC_CANDIDATE, // 视频聊天 ICE 候选者
    CHAT_PRIVATE_WEBRTC_DISCONNECT, // 断开视频聊天
}