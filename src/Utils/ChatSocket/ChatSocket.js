import { message } from 'antd';
import { EventEmitter } from 'events';
import { getMainContent } from 'Utils/Global';
import { ADD_MESSAGE_HISTORY, setMessageHistory } from 'Utils/Store/actions';
import store from 'Utils/Store/store';

let chatSocket;
function invokeSocket(token) {
	if (chatSocket) return chatSocket;
	chatSocket = new ChatSocket(token);
	return chatSocket;
}

class ChatSocket extends EventEmitter {
	socket;
	constructor(token) {
		super();
		const socket = new WebSocket('ws://meeting.aiolia.top:8006/ws', [token]);
		socket.onopen = (evt) => {
			console.log('websocket连接成功');
			this.emit('onopen');
		};
		socket.onmessage = (evt) => {
			console.log('----您有新的消息----');
			console.log(evt);
			const msg = JSON.parse(evt.data);
			switch (msg.type) {
				case 'REQUEST_SENDER_OK':
					message.success({
						content: '已成功发送好友请求',
						getPopupContainer: getMainContent,
					});
					break;
				case 'HAVE_ALREADY_REQUESTED':
					message.warn({
						content: '已向该用户发送好友请求，请勿重复发送',
						getPopupContainer: getMainContent,
					});
					break;
				case 'IS_ALREADY_FRIEND':
					message.warn({
						content: '该用户已成为您的好友，无需重复添加',
						getPopupContainer: getMainContent,
					});
					break;
				case 'REPLY_SENDER_OK':
					message.success({
						content: '已成功回复好友请求',
						getPopupContainer: getMainContent,
					});
					break;
				case 'MESSAGE_RECEIVER_OK':
					// NOTE: 接收消息
					this.emit('MESSAGE_RECEIVER_OK', msg);
					break;
				case 'MESSAGE_SENDER_OK':
					//NOTE: 成功发送消息
					msg.data.message.myId = msg.data.message.fromId;
					store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, msg.data.message));
					this.emit('MESSAGE_SENDER_OK', msg.data.message.toId);
					break;
			}
		};
		socket.onerror = (evt) => {
			console.warn('websocket出错');
			console.log(evt);
			socket = undefined;
		};
		socket.onclose = (evt) => {
			console.log('websocket断开连接');
			console.log(evt);
			socket = undefined;
		};
		this.socket = socket;
	}

	send(msg) {
		console.log('----发送了一条消息----');
		console.log(msg);
		this.socket.send(JSON.stringify(msg));
	}
}

export default invokeSocket;
