import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { message, Modal } from 'antd';
import { EventEmitter } from 'events';
import React from 'react';
import {
	CALL_STATUS_ANSWERING,
	CALL_STATUS_FREE,
	CALL_STATUS_OFFERING,
	CHAT_PRIVATE_WEBRTC_ANSWER,
	CHAT_PRIVATE_WEBRTC_CANDIDATE,
	CHAT_PRIVATE_WEBRTC_DISCONNECT,
	CHAT_PRIVATE_WEBRTC_OFFER,
} from 'Utils/Constraints';
import { setCallStatus } from 'Utils/Store/actions';
import store from 'Utils/Store/store';

export class ChatRTC extends EventEmitter {
	constructor(props) {
		super(props);
		this.socket = props.socket;
		this.myId = props.myId;
		this.remoteStream = new MediaStream();

		const peer = new RTCPeerConnection({
			iceServers: [
				{
					urls: 'stun:stun.stunprotocol.org:3478',
				},
			],
		});
		peer.onicecandidate = (evt) => {
			if (evt) {
				const message = {
					type: CHAT_PRIVATE_WEBRTC_CANDIDATE,
					candidate: evt.candidate.candidate,
					sdpMid: evt.candidate.sdpMid,
					sdpMLineIndex: evt.candidate.sdpMLineIndex,
					sender: this.sender,
					receiver: this.receiver,
					target: this.otherId,
				};
				this.socket.send(message);
			}
		};
		peer.ontrack = (evt) => {
			this.remoteStream.addTrack(evt.track);
		};
		this.peer = peer;

		this.socket.on('ON_PRIVATE_WEBRTC_OFFER', (msg) => {
			const rejectOffer = () => {
				store.dispatch(setCallStatus(CALL_STATUS_FREE));
				this.socket.send({
					type: CHAT_PRIVATE_WEBRTC_ANSWER,
					accept: false,
					sender: msg.sender,
					receiver: msg.receiver,
				});
			};
			if (store.getState().callStatus === CALL_STATUS_FREE) {
				store.dispatch(setCallStatus(CALL_STATUS_ANSWERING));
				Modal.confirm({
					title: '视频通话邀请',
					content: `用户 id 为 ${msg.sender} 的用户向您发出视频通话请求，是否接受？`,
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
					centered: true,
				});
			} else rejectOffer();
		});

		this.socket.on('ON_PRIVATE_WEBRTC_ANSWER', (msg) => {
			this.modal.destroy();
			this.modal = null;
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

		this.socket.on('ON_PRIVATE_WEBRTC_CANDIDATE', this.handleCandidate);
	}

	createOffer(targetId, modal) {
		store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
		this.sender = this.myId;
		this.receiver = targetId;
		this.otherId = targetId;
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
					receiver: targetId,
				});
			});
		this.modal = modal;
	}

	createAnswer(sender, remoteSdp) {
		this.sender = sender;
		this.otherId = sender;
		this.receiver = this.myId;
		this.peer.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'offer',
			})
		);
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
			});
	}

	receiveAnswer(remoteSdp) {
		this.peer.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'answer',
			})
		);
	}

	handleCandidate(data) {
		if (!data.candidate) {
			this.peer.addIceCandidate(null);
		} else {
			const { candidate, sdpMLineIndex, sdpMid } = data;
			console.log(data);
			this.peer.addIceCandidate(data);
		}
	}

	hangUp() {
		this.socket.send({
			type: CHAT_PRIVATE_WEBRTC_DISCONNECT,
			sender: this.sender,
			receiver: this.receiver,
			target: this.otherId,
		});
		this.sender = null;
		this.receiver = null;
		this.otherId = null;
		this.remoteStream = new MediaStream();
	}
}
