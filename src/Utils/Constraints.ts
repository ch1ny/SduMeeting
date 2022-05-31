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
	CHAT_PRIVATE_WEBRTC_REQUEST, // 发送视频通话请求
	CHAT_PRIVATE_WEBRTC_RESPONSE, // 响应视频通话请求
}

/**
 * 私人聊天响应常量
 */
export const PRIVATE_WEBRTC_ANSWER_TYPE = {
	NO_USER: -2, // 不存在的用户
	REJECT: -1, // 拒绝请求
	BUSY: 0, // 占线中
	ACCEPT: 1, // 接受请求
};

// NOTE: 支持的编码器
const senderCodecs = RTCRtpSender.getCapabilities('video')?.codecs;
const receiverCodecs = RTCRtpReceiver.getCapabilities('video')?.codecs;
(() => {
	const senderH264Index = senderCodecs?.findIndex((c) => c.mimeType === 'video/H264');
	const senderH264 = (senderCodecs as Array<RTCRtpCodecCapability>)[
		senderH264Index ? senderH264Index : 0
	];
	senderCodecs?.splice(senderH264Index ? senderH264Index : 0, 1);
	senderCodecs?.unshift(senderH264);

	const receiverH264Index = receiverCodecs?.findIndex((c) => c.mimeType === 'video/H264');
	const receiverH264 = (receiverCodecs as Array<RTCRtpCodecCapability>)[
		receiverH264Index ? receiverH264Index : 0
	];
	receiverCodecs?.splice(receiverH264Index ? receiverH264Index : 0, 1);
	receiverCodecs?.unshift(receiverH264);
})();
export { senderCodecs, receiverCodecs };
