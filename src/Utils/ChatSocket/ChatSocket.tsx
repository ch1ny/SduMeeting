import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { EventEmitter } from 'events';
import { ChatWebSocketType } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { getMainContent } from 'Utils/Global';
import { AUDIO_TYPE, buildPropmt } from 'Utils/Prompt/Prompt';
import { ADD_MESSAGE_HISTORY, setMessageHistory } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';

let chatSocket: ChatSocket;

function invokeSocket(token?: string) {
	if (!token || chatSocket) return chatSocket;
	chatSocket = new ChatSocket(token);
	return chatSocket;
}

export class ChatSocket extends EventEmitter {
	socket;
	constructor(token: string) {
		super();
		this.socket = this.buildSocket(token);
	}

	private buildSocket(token: string): WebSocket {
		const [playMessageAudio] = buildPropmt(AUDIO_TYPE.MESSAGE_RECEIVED);
		let socket = new WebSocket('ws://meeting.aiolia.top:8006/ws', [token]);
		socket.onopen = (evt) => {
			console.log('websocket连接成功');
			this.emit('onopen');
		};
		socket.onmessage = (evt) => {
			const msg = JSON.parse(evt.data);
			switch (msg.type) {
				case 'REQUEST_SENDER_OK':
					globalMessage.success({
						content: '已成功发送好友请求',
						getPopupContainer: getMainContent,
					});
					break;
				case 'REQUEST_RECEIVER_OK':
					new Notification('好友请求', {
						body: `${msg.data.username} 想要成为您的好友`,
						icon: msg.data.profile
							? `http://meeting.aiolia.top:8080/file/pic/user/${msg.data.userId}.${msg.data.profile}`
							: drawUserProfile(msg.data.username),
						silent: true,
					});
					this.emit('ON_REQUEST_RECEIVER_OK', msg.data);
					playMessageAudio();
					break;
				case 'HAVE_ALREADY_REQUESTED':
					globalMessage.warn({
						content: '已向该用户发送好友请求，请勿重复发送',
						getPopupContainer: getMainContent,
					});
					break;
				case 'IS_ALREADY_FRIEND':
					globalMessage.warn({
						content: '该用户已成为您的好友，无需重复添加',
						getPopupContainer: getMainContent,
					});
					break;
				case 'REPLY_SENDER_OK':
					globalMessage.success({
						content: '已成功回复好友请求',
						getPopupContainer: getMainContent,
					});
					this.send({
						toId: msg.data.id,
						message: '嘿，我们已经是好友了，快来和我聊天吧！',
						type: ChatWebSocketType.CHAT_SEND_PRIVATE_MESSAGE,
					});
					break;
				case 'REPLY_RECEIVER_OK':
					const { id, username, email, profile } = msg.data;
					globalMessage.success({
						content: `用户 ${username} 已成为您的好友`,
						getPopupContainer: getMainContent,
					});
					const newFriend = {
						uid: id,
						username,
						email,
						profile,
					};
					this.emit('REPLY_RECEIVER_OK', newFriend);
					break;
				case 'MESSAGE_RECEIVER_OK':
					// NOTE: 接收消息
					this.emit('MESSAGE_RECEIVER_OK', msg);
					const friend = eventBus.invokeSync(
						'GET_FRIEND_INFO_BY_ID',
						msg.data.message.fromId
					);
					new Notification(`${friend.username} 向您发送了一条消息`, {
						body: `${msg.data.message.message}`,
						icon: friend.profile
							? `http://meeting.aiolia.top:8080/file/pic/user/${msg.data.message.fromId}.${friend.profile}`
							: drawUserProfile(friend.username),
						silent: true,
					});
					playMessageAudio();
					break;
				case 'MESSAGE_SENDER_OK':
					// NOTE: 成功发送消息
					msg.data.message.myId = msg.data.message.fromId;
					store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, msg.data.message));
					this.emit('MESSAGE_SENDER_OK', msg.data.message.toId);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_REQUEST:
					// NOTE: 接到私人视频通话请求
					this.emit('ON_PRIVATE_WEBRTC_REQUEST', msg);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_RESPONSE:
					// NOTE: 接到私人视频通话响应
					this.emit('ON_PRIVATE_WEBRTC_RESPONSE', msg);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_OFFER:
					// NOTE: 接到 OFFER 请求
					this.emit('ON_PRIVATE_WEBRTC_OFFER', msg);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_ANSWER:
					// NOTE: 接到 ANSWER 响应
					this.emit('ON_PRIVATE_WEBRTC_ANSWER', msg);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_CANDIDATE:
					// NOTE: ICE候选者
					this.emit('ON_PRIVATE_WEBRTC_CANDIDATE', msg);
					break;
				case ChatWebSocketType.CHAT_PRIVATE_WEBRTC_DISCONNECT:
					this.emit('ON_PRIVATE_WEBRTC_DISCONNECT', msg);
					break;
				case 'REMOVE_FRIEND_RECEIVER_OK':
					this.emit('ON_REMOVED_BY_A_FRIEND', msg.data);
					break;
				case 'NEW_CONNECTION':
					socket.close(1000, '异地登录');
					new Notification('异地登录', {
						body: '您的账号已在其他机器上登录，您已被挤下线',
					});
					eWindow.ipc.send('LOG_OUT');
					break;
				case 'SIGN_OK':
					// NOTE: 签收消息确认
					break;
				default:
					console.log('未知 chat socket 消息');
					console.log(msg);
					break;
			}
		};
		socket.onerror = (evt) => {
			console.warn('websocket出错');
			console.log(evt);
		};
		socket.onclose = (evt) => {
			console.log('websocket断开连接');
			console.log(evt);
			if (evt.code === 1000 && evt.reason === '异地登录') {
				// 客户端因为异地登录主动断开连接
			}

			globalMessage.error('与服务器断开连接，正在为您退出登录', 3, () => {
				eWindow.ipc.send('LOG_OUT');
			});
		};
		return socket;
	}

	send(msg: object) {
		// console.log('----发送了一条消息----');
		// console.log(msg);
		this.socket.send(JSON.stringify(msg));
	}
}

function drawUserProfile(username: string) {
	const canvas = document.createElement('canvas');
	canvas.width = 500;
	canvas.height = 500;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#fff';
	ctx.font = "bold 100px 'Times New Roman', Times, serif";
	ctx.fillText(username, 250, 250);
	return canvas.toDataURL('image/png');
}

export default invokeSocket;
