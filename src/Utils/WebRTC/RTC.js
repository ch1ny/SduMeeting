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

	getReceivers(pubid) {
		return this._receivers.get(pubid);
	}

	createSender(pubid, stream) {
		let sender = {
			offerSent: false,
			pc: null,
		};
		sender.pc = new RTCPeerConnection({ iceServers: [{ urls: ices }] });
		sender.pc.addStream(stream);
		this.emit('localstream', pubid, stream);
		this._sender = sender;
		return sender;
	}

	createReceiver(pubid) {
		const _receiver = this._receivers.get(pubid);
		// INFO: 阻止重复建立接收器
		if (_receiver) return _receiver;
		try {
			let receiver = {
				offerSent: false,
				pc: undefined,
				id: pubid,
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
				const receiver = this._receivers.get(pubid);
				receiver.streams.push(stream);
				this.emit('addstream', pubid, stream);
			};

			pc.onremovestream = (e) => {
				const stream = e.stream;
				console.log(`receiver.pc.onremovestream => ${stream.id}`);
				this.emit('removestream', pubid, stream);
			};

			receiver.pc = pc;
			console.log(`createReceiver::id => ${pubid}`);
			this._receivers.set(pubid, receiver);
			return receiver;
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	closeReceiver(pubid) {
		const receiver = this._receivers.get(pubid);
		if (receiver) {
			receiver.streams.forEach((stream) => {
				this.emit('removestream', pubid, stream);
			});
			receiver.pc.close();
			this._receivers.delete(pubid);
		}
	}
}
