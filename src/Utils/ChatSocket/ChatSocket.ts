import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { EventEmitter } from 'events';
import { ChatWebSocketType } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { getMainContent } from 'Utils/Global';
import { AUDIO_TYPE, buildPropmt } from 'Utils/Prompt/Prompt';
import { ADD_MESSAGE_HISTORY, setMessageHistory } from 'Utils/Store/actions';
import store from 'Utils/Store/store';

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
					break;
				case 'REPLY_RECEIVER_OK':
					playMessageAudio();
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
					(window as any).ipc.invoke('IS_MAIN_WINDOW_MINIMIZED').then((bool: boolean) => {
						if (bool) {
							new Notification('您的好友请求已通过', {
								body: `${username} 已同意您的好友请求`,
								icon: profile
									? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}`
									: '',
								silent: true,
							});
						}
					});
					this.emit('REPLY_RECEIVER_OK', newFriend);
					break;
				case 'MESSAGE_RECEIVER_OK':
					// NOTE: 接收消息
					this.emit('MESSAGE_RECEIVER_OK', msg);
					(window as any).ipc.invoke('IS_MAIN_WINDOW_MINIMIZED').then((bool: boolean) => {
						if (bool) {
							const friend = eventBus.invokeSync(
								'GET_FRIEND_INFO_BY_ID',
								msg.data.message.fromId
							);
							const profile = friend.profile;
							new Notification(`${friend.username} 向您发送了一条消息`, {
								body: `${msg.data.message.message}`,
								icon: profile
									? `http://meeting.aiolia.top:8080/file/pic/user/${msg.data.message.fromId}.${profile}`
									: '',
								silent: true,
							});
						}
					});
					playMessageAudio();
					break;
				case 'MESSAGE_SENDER_OK':
					// NOTE: 成功发送消息
					msg.data.message.myId = msg.data.message.fromId;
					store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, msg.data.message));
					this.emit('MESSAGE_SENDER_OK', msg.data.message.toId);
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
			}
		};
		socket.onerror = (evt) => {
			console.warn('websocket出错');
			console.log(evt);
			this.socket = this.buildSocket(token);
		};
		socket.onclose = (evt) => {
			console.log('websocket断开连接');
			console.log(evt);
		};
		return socket;
	}

	send(msg: object) {
		// console.log('----发送了一条消息----');
		// console.log(msg);
		this.socket.send(JSON.stringify(msg));
	}
}

export default invokeSocket;
