/**
 * 这个文件用来存放一些常量
 */

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
export const CHAT_SEND_PRIVATE_MESSAGE = 1; // 发送私聊消息
export const CHAT_READ_MESSAGE = 2; // 签收私聊消息
export const CHAT_SEND_FRIEND_REQUEST = 3; // 发送好友请求
export const CHAT_ANSWER_FRIEND_REQUEST = 4; // 响应好友请求
export const CHAT_PRIVATE_WEBRTC_OFFER = 5; // 发送视频聊天请求 OFFER
export const CHAT_PRIVATE_WEBRTC_ANSWER = 6; // 响应视频聊天请求 ANSWER
export const CHAT_PRIVATE_WEBRTC_CANDIDATE = 7; // 视频聊天 ICE 候选者
export const CHAT_PRIVATE_WEBRTC_DISCONNECT = 8; // 断开视频聊天
