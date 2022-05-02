import { EventEmitter } from 'events';

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
		this.socket.send(msg);
	}
}

export default invokeSocket;
