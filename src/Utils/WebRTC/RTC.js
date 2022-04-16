import { EventEmitter } from 'events';

const ices = 'stun:stun.stunprotocol.org:3478'; // INFO: 一个免费的 STUN 服务器

export default class RTC extends EventEmitter {
	constructor() {
		super();
		this._sender = {};
		this._receivers = new Map();
	}

	getSender() {
		return this._sender;
	}

	getReceivers(pubId) {
		return this._receivers.get(pubId);
	}

	createSender(pubId, stream) {
		let sender = {
			offerSent: false,
			pc: null,
		};
		sender.pc = new RTCPeerConnection({ iceServers: [{ urls: ices }] });
		sender.pc.addStream(stream);
		this.emit('localstream', pubId, stream);
		this._sender = sender;
		return sender;
	}

	createReceiver(pubId) {
		const _receiver = this._receivers.get(pubId);
		// INFO: 阻止重复建立接收器
		if (_receiver) return _receiver;
		try {
			let receiver = {
				offerSent: false,
				pc: undefined,
				id: pubId,
				streams: [],
			};
			const pc = new RTCPeerConnection({ iceServers: [{ urls: ices }] });
			pc.onicecandidate = (e) => {
				console.log(`receiver.pc.onicecandidate => ${e.candidate}`);
			};

			// 添加收发器
			pc.addTransceiver('audio', { direction: 'recvonly' });
			pc.addTransceiver('audio', { direction: 'recvonly' });
			pc.addTransceiver('video', { direction: 'recvonly' });

			pc.onaddstream = (e) => {
				const stream = e.stream;
				console.log(`receiver.pc.onaddstream => ${stream.id}`);
				const receiver = this._receivers.get(pubId);
				receiver.streams.push(stream);
				this.emit('addstream', pubId, stream);
			};

			pc.onremovestream = (e) => {
				const stream = e.stream;
				console.log(`receiver.pc.onremovestream => ${stream.id}`);
				this.emit('removestream', pubId, stream);
			};

			receiver.pc = pc;
			console.log(`createReceiver::id => ${pubId}`);
			this._receivers.set(pubId, receiver);
			return receiver;
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	closeReceiver(pubId) {
		const receiver = this._receivers.get(pubId);
		if (receiver) {
			receiver.streams.forEach((stream) => {
				this.emit('removestream', pubId, stream);
			});
			receiver.pc.close();
			this._receivers.delete(pubId);
		}
	}
}
