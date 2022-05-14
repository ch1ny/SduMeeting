import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { message, Modal } from 'antd';
import { EventEmitter } from 'events';
import React from 'react';
import {
	CALL_STATUS_ANSWERING,
	CALL_STATUS_CALLING,
	CALL_STATUS_FREE,
	CALL_STATUS_OFFERING,
	CHAT_PRIVATE_WEBRTC_ANSWER,
	CHAT_PRIVATE_WEBRTC_CANDIDATE,
	CHAT_PRIVATE_WEBRTC_DISCONNECT,
	CHAT_PRIVATE_WEBRTC_OFFER,
} from 'Utils/Constraints';
import { getDeviceStream, getMainContent } from 'Utils/Global';
import { AUDIO_TYPE, buildPropmt } from 'Utils/Prompt/Prompt';
import {
	DEVICE_TYPE,
	setCallStatus,
	setNowChattingId,
	setNowWebrtcFriendId,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';

export class ChatRTC extends EventEmitter {
	constructor(props) {
		super(props);
		this.callAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_CALLING, true);
		this.answerAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_ANSWERING, true);

		this.socket = props.socket;
		this.myId = props.myId;
		this.localStream = null;
		this.remoteStream = null;

		this.peer = this.#buildPeer();

		this.socket.on('ON_PRIVATE_WEBRTC_OFFER', (msg) => {
			const rejectOffer = () => {
				store.dispatch(setCallStatus(CALL_STATUS_FREE));
				this.socket.send({
					type: CHAT_PRIVATE_WEBRTC_ANSWER,
					accept: false,
					sender: msg.sender,
					receiver: msg.receiver,
				});
				this.answerModal = null;
			};
			if (store.getState().callStatus === CALL_STATUS_FREE) {
				this.answerAudioPrompt[0]();
				store.dispatch(setCallStatus(CALL_STATUS_ANSWERING));
				store.dispatch(setNowChattingId(msg.sender));
				this.answerModal = Modal.confirm({
					title: '视频通话邀请',
					content: `用户 ${msg.senderName}(id: ${msg.sender}) 向您发出视频通话请求，是否接受？`,
					cancelText: (
						<>
							<CloseOutlined />
							拒绝接受
						</>
					),
					okText: (
						<>
							<CheckOutlined />
							同意请求
						</>
					),
					onOk: () => {
						this.createAnswer(msg.sender, msg.sdp);
					},
					onCancel: rejectOffer,
					afterClose: this.answerAudioPrompt[1],
					centered: true,
					getContainer: getMainContent,
				});
			} else rejectOffer();
		});

		this.socket.on('ON_PRIVATE_WEBRTC_ANSWER', (msg) => {
			this.callAudioPrompt[1]();
			if (this.offerModal) {
				this.offerModal.destroy();
				this.offerModal = null;
			}
			if (msg.accept) {
				this.receiveAnswer(msg.sdp);
			} else {
				message.error({
					content: '对方拒绝了您的通话邀请',
					duration: 2,
				});
				store.dispatch(setCallStatus(CALL_STATUS_FREE));
			}
		});

		this.socket.on('ON_PRIVATE_WEBRTC_CANDIDATE', this.handleCandidate.bind(this));

		this.socket.on('ON_PRIVATE_WEBRTC_DISCONNECT', this.onHangUp.bind(this));
	}

	async createOffer(targetId, myName, offerModal) {
		this.callAudioPrompt[0]();
		store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
		store.dispatch(setNowWebrtcFriendId(targetId));
		this.sender = this.myId;
		this.receiver = targetId;
		this.localStream = new MediaStream();
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE)).getAudioTracks()[0]
		);
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE)).getVideoTracks()[0]
		);
		for (const track of this.localStream.getTracks()) {
			this.peer.addTrack(track, this.localStream);
		}

		this.peer
			.createOffer({
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true,
				},
			})
			.then((sdp) => {
				this.peer.setLocalDescription(sdp);
				this.socket.send({
					type: CHAT_PRIVATE_WEBRTC_OFFER,
					sdp: sdp.sdp,
					sender: this.myId,
					senderName: myName,
					receiver: targetId,
				});
			});
		this.offerModal = offerModal;
	}

	async createAnswer(sender, remoteSdp) {
		this.sender = sender;
		store.dispatch(setNowWebrtcFriendId(sender));
		this.receiver = this.myId;
		this.peer.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'offer',
			})
		);
		while (this.candidateQueue.length > 0) {
			this.peer.addIceCandidate(this.candidateQueue.shift());
		}
		this.localStream = new MediaStream();
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE)).getAudioTracks()[0]
		);
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE)).getVideoTracks()[0]
		);
		this.emit('LOCAL_STREAM_READY', this.localStream);
		for (const track of this.localStream.getTracks()) {
			this.peer.addTrack(track, this.localStream);
		}
		this.peer
			.createAnswer({
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true,
				},
			})
			.then((sdp) => {
				this.peer.setLocalDescription(sdp);
				this.socket.send({
					type: CHAT_PRIVATE_WEBRTC_ANSWER,
					accept: true,
					sdp: sdp.sdp,
					sender: this.sender,
					receiver: this.receiver,
				});
				store.dispatch(setCallStatus(CALL_STATUS_CALLING));
			});
	}

	receiveAnswer(remoteSdp) {
		this.peer.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'answer',
			})
		);
		store.dispatch(setCallStatus(CALL_STATUS_CALLING));
		this.emit('LOCAL_STREAM_READY', this.localStream);
	}

	handleCandidate(data) {
		this.candidateQueue = this.candidateQueue || new Array();
		if (data.candidate) {
			// NOTE: 需要先设置 remote SDP 才能添加候选者
			if (this.peer.remoteDescription) {
				this.peer.addIceCandidate(data);
			} else {
				this.candidateQueue.push(data);
			}
		}
	}

	hangUp() {
		this.callAudioPrompt[1]();
		this.socket.send({
			type: CHAT_PRIVATE_WEBRTC_DISCONNECT,
			sender: this.sender,
			receiver: this.receiver,
			target: store.getState().nowWebrtcFriendId,
		});
		this.sender = null;
		this.receiver = null;
		store.dispatch(setNowWebrtcFriendId(null));
		this.offerModal = null;
		this.localStream = null;
		this.remoteStream = null;
		this.peer.close();
		this.peer = this.#buildPeer();
		store.dispatch(setCallStatus(CALL_STATUS_FREE));
	}

	onHangUp() {
		this.sender = null;
		this.receiver = null;
		store.dispatch(setNowWebrtcFriendId(null));
		if (this.answerModal) {
			this.answerAudioPrompt[1]();
			this.answerModal.destroy();
		}
		this.answerModal = null;
		this.localStream = null;
		this.remoteStream = null;
		this.peer.close();
		this.peer = this.#buildPeer();
		store.dispatch(setCallStatus(CALL_STATUS_FREE));
	}

	#buildPeer() {
		const peer = new RTCPeerConnection({
			iceServers: [
				{
					urls: 'stun:stun.stunprotocol.org:3478',
				},
			],
		});
		peer.onicecandidate = (evt) => {
			if (evt.candidate) {
				const message = {
					type: CHAT_PRIVATE_WEBRTC_CANDIDATE,
					candidate: evt.candidate.candidate,
					sdpMid: evt.candidate.sdpMid,
					sdpMLineIndex: evt.candidate.sdpMLineIndex,
					sender: this.sender,
					receiver: this.receiver,
					target: store.getState().nowWebrtcFriendId,
				};
				this.socket.send(message);
			}
		};
		peer.ontrack = (evt) => {
			if (this.remoteStream === null) {
				this.remoteStream = new MediaStream();
				this.emit('REMOTE_STREAM_READY', this.remoteStream);
			}
			this.remoteStream.addTrack(evt.track);
		};
		return peer;
	}
}
