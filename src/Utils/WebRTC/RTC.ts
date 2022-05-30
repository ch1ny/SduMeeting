import { EventEmitter } from 'events';
import { receiverCodecs, senderCodecs } from 'Utils/Constraints';
import { setupReceiverTransform, setupSenderTransform } from './RtcEncrypt';

const ices = 'stun:stun.stunprotocol.org:3478'; // INFO: 一个免费的 STUN 服务器

export interface RTCSender {
	pc: RTCPeerConnection;
	offerSent: boolean;
}
export interface RTCReceiver {
	offerSent: boolean;
	pc: RTCPeerConnection;
	id: number;
	stream?: MediaStream;
}

export default class RTC extends EventEmitter {
	_sender!: RTCSender;
	_receivers: Map<number, RTCReceiver>;
	psw?: string;

	constructor(psw?: string) {
		super();
		this._receivers = new Map();
		this.psw = psw;
	}

	getSender() {
		return this._sender;
	}

	getReceivers(pubId: number) {
		return this._receivers.get(pubId);
	}

	createSender(pubId: number, stream: MediaStream): RTCSender {
		let sender = {
			offerSent: false,
			pc: new (RTCPeerConnection as any)({
				iceServers: [{ urls: ices }],
				encodedInsertableStreams: Boolean(this.psw),
			}) as RTCPeerConnection,
		};
		for (const track of stream.getTracks()) {
			sender.pc.addTrack(track);
		}

		if (Boolean(this.psw))
			sender.pc.getSenders().forEach((sender) => {
				setupSenderTransform(sender, this.psw);
			});
		else if (senderCodecs) {
			sender.pc
				.getTransceivers()
				.find((t) => t.sender.track?.kind === 'video')
				?.setCodecPreferences(senderCodecs);
		}

		this.emit('localstream', pubId, stream);
		this._sender = sender;
		return sender;
	}

	createReceiver(pubId: number): RTCReceiver {
		const _receiver = this._receivers.get(pubId);
		// INFO: 阻止重复建立接收器
		if (_receiver) return _receiver;
		try {
			const pc = new (RTCPeerConnection as any)({
				iceServers: [{ urls: ices }],
				encodedInsertableStreams: Boolean(this.psw),
			}) as RTCPeerConnection;

			pc.onicecandidate = (e) => {
				// console.log(`receiver.pc.onicecandidate => ${e.candidate}`);
			};

			// 添加收发器
			pc.addTransceiver('audio', { direction: 'recvonly' });
			pc.addTransceiver('video', { direction: 'recvonly' });

			pc.ontrack = (e) => {
				if (Boolean(this.psw)) setupReceiverTransform(e.receiver, this.psw);
				else if (receiverCodecs) {
					pc.getTransceivers()
						.find((t) => t.receiver.track.kind === 'video')
						?.setCodecPreferences(receiverCodecs);
				}
				// console.log(`ontrack`);
				const receiver = this._receivers.get(pubId) as RTCReceiver;
				if (!receiver.stream) {
					receiver.stream = new MediaStream();
					// console.log(`receiver.pc.onaddtrack => ${receiver.stream.id}`);
					this.emit('addtrack', pubId, receiver.stream);
				}
				receiver.stream.addTrack(e.track);
			};

			let receiver = {
				offerSent: false,
				pc: pc,
				id: pubId,
				stream: undefined,
			};

			// console.log(`createReceiver::id => ${pubId}`);
			this._receivers.set(pubId, receiver);
			return receiver;
		} catch (e) {
			// console.log(e);
			throw e;
		}
	}

	closeReceiver(pubId: number) {
		const receiver = this._receivers.get(pubId);
		if (receiver) {
			this.emit('removestream', pubId, receiver.stream);
			receiver.pc.close();
			this._receivers.delete(pubId);
		}
	}
}
