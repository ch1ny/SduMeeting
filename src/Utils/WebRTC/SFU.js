import { EventEmitter } from 'events';
import RTC from './RTC';

export default class SFU extends EventEmitter {
	constructor(userId, userName, roomId) {
		super();
		this._rtc = new RTC();
		this.userId = userId;
		this.userName = userName;
		this.roomId = roomId;

		const sfuUrl = 'ws://localhost:3000/ws?userId=' + userId + '&roomId=' + roomId;

		this.socket = new WebSocket(sfuUrl);

		this.socket.onopen = () => {
			console.log('WebSocket连接成功...');
			this._onRoomConnect();
		};

		this.socket.onmessage = (e) => {
			const parseMessage = JSON.parse(e.data);
			// console.log(parseMessage);

			switch (parseMessage.type) {
				case 'joinRoom':
					// TODO: 这个好像从未触发过，希望能改成有新人加入后能接受新入会用户的id对应关系
					console.log(parseMessage);
					break;
				case 'onJoinRoom':
					// TODO: 希望在这里返回当前所有用户对应的ID和个人信息
					console.log(parseMessage);
					break;
				case 'onPublish':
					// 这里是接到有人推流的信息
					this.onPublish(parseMessage);
					break;
				case 'onUnpublish':
					// 这里是有人停止推流
					this.onUnpublish(parseMessage);
					break;
				case 'onSubscribe':
					// 这里是加入会议后接到已推流的消息进行订阅
					this.onSubscribe(parseMessage);
					break;
				case 'heartPackage':
					// 心跳包
					// console.log('heartPackage:::');
					break;
				default:
					console.error('未知消息', parseMessage);
			}
		};

		this.socket.onerror = (e) => {
			console.log('onerror::');
			console.warn(e);
			this.emit('error');
		};

		this.socket.onclose = (e) => {
			console.log('onclose::');
			console.warn(e);
		};
	}

	_onRoomConnect = () => {
		console.log('onRoomConnect');

		this._rtc.on('localstream', (id, stream) => {
			this.emit('addLocalStream', id, stream);
		});

		this._rtc.on('addstream', (id, stream) => {
			this.emit('addRemoteStream', id, stream);
		});

		this._rtc.on('removestream', (id, stream) => {
			this.emit('removeRemoteStream', id, stream);
		});

		this.emit('connect');
	};

	join() {
		console.log(`Join to [${this.roomId}] as [${this.userName}:${this.userId}]`);
		let message = {
			type: 'join',
			data: {
				userName: this.userName,
				userId: this.userId,
				roomId: this.roomId,
			},
		};
		this.send(message);
	}

	send(data) {
		this.socket.send(JSON.stringify(data));
	}

	publish(stream) {
		this._createSender(this.userId, stream);
	}

	_createSender(pubid, stream) {
		try {
			// 创建一个sender
			let sender = this._rtc.createSender(pubid, stream);
			this.sender = sender;
			// 监听IceCandidate回调
			sender.pc.onicecandidate = async (e) => {
				if (!sender.senderOffer) {
					const offer = sender.pc.localDescription;
					sender.senderOffer = true;
					this.publishToServer(offer, pubid);
				}
			};
			// 创建Offer
			sender.pc
				.createOffer({
					offerToReceiveVideo: false,
					offerToReceiveAudio: false,
				})
				.then((desc) => {
					sender.pc.setLocalDescription(desc);
				});
		} catch (error) {
			console.log('onCreateSender error =>' + error);
		}
	}

	publishToServer(offer, pubid) {
		let message = {
			type: 'publish',
			data: {
				jsep: offer,
				pubid,
				userName: this.userName,
				userId: this.userId,
				roomId: this.roomId,
			},
		};
		console.log('===publish===');
		console.log(message);
		this.send(message);
	}

	onPublish(message) {
		// 服务器返回的Answer信息 如A ---> Offer---> SFU---> Answer ---> A
		console.log(message);
		if (this.sender && message['data']['userId'] == this.userId) {
			console.log('onPublish:::自已发布的Id:::' + message['data']['userId']);
			this.sender.pc.setRemoteDescription(message['data']['jsep']);
		}

		// 服务器返回其他人发布的信息 如 A ---> Pub ---> SFU ---> B
		if (message['data']['userId'] != this.userId) {
			console.log('onPublish:::其他人发布的Id:::' + message['data']['userId']);
			// 使用发布者的userId创建Receiver
			this._onRtcCreateReceiver(message['data']['userId']);
		}
	}

	onUnpublish(meesage) {
		console.log('退出用户:' + meesage['data']['pubid']);
		this._rtc.closeReceiver(meesage['data']['pubid']);
	}

	_onRtcCreateReceiver(pubid) {
		try {
			let receiver = this._rtc.createReceiver(pubid);

			receiver.pc.onicecandidate = async (e) => {
				if (!receiver.senderOffer) {
					const offer = receiver.pc.localDescription;
					receiver.senderOffer = true;
					this.subscribeFromServer(offer, pubid);
				}
			};
			// 创建Offer
			receiver.pc.createOffer().then((desc) => {
				receiver.pc.setLocalDescription(desc);
			});
		} catch (error) {
			console.log('onRtcCreateReceiver error =>' + error);
		}
	}

	subscribeFromServer(offer, pubid) {
		let message = {
			type: 'subscribe',
			data: {
				jsep: offer,
				pubid,
				userName: this.userName,
				userId: this.userId,
				roomId: this.roomId,
			},
		};
		console.log('===subscribe===');
		console.log(message);
		this.send(message);
	}

	onSubscribe(message) {
		// 使用发布者的Id获取Receiver
		const receiver = this._rtc.getReceivers(message['data']['pubid']);
		if (receiver) {
			console.log('服务器应答Id:' + message['data']['pubid']);
			if (receiver.pc.remoteDescription) {
				console.warn('已建立远程连接！');
			} else {
				receiver.pc.setRemoteDescription(message['data']['jsep']);
			}
		} else {
			console.log('receiver == null');
		}
	}
}
