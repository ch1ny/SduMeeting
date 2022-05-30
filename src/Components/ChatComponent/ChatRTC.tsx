import {
	AlertOutlined,
	CheckOutlined,
	CloseOutlined,
	ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { EventEmitter } from 'events';
import React from 'react';
import { ChatSocket } from 'Utils/ChatSocket/ChatSocket';
import {
	CALL_STATUS_ANSWERING,
	CALL_STATUS_CALLING,
	CALL_STATUS_FREE,
	CALL_STATUS_OFFERING,
	ChatWebSocketType,
	DEVICE_TYPE,
	PRIVATE_WEBRTC_ANSWER_TYPE,
} from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { getDeviceStream, getMainContent } from 'Utils/Global';
import { AUDIO_TYPE, buildPropmt } from 'Utils/Prompt/Prompt';
import { setCallStatus, setNowChattingId, setNowWebrtcFriendId } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { setupReceiverTransform, setupSenderTransform } from 'Utils/WebRTC/RtcEncrypt';

interface ChatRtcProps {
	socket: ChatSocket;
	myId: number;
}

export class ChatRTC extends EventEmitter {
	callAudioPrompt: (() => void)[];
	answerAudioPrompt: (() => void)[];
	socket: ChatSocket;
	myId: number;
	localStream: null | MediaStream;
	remoteStream: null | MediaStream;
	sender?: number;
	receiver?: number;
	peer!: RTCPeerConnection;
	answerModal!: null | {
		destroy: () => void;
	};
	offerModal!: null | {
		destroy: () => void;
	};
	candidateQueue!: Array<any>;
	useSecurity: boolean;

	constructor(props: ChatRtcProps) {
		super();
		this.callAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_CALLING, true);
		this.answerAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_ANSWERING, true);

		this.socket = props.socket;
		this.myId = props.myId;
		this.localStream = null;
		this.remoteStream = null;
		this.useSecurity = false;

		this.socket.on('ON_PRIVATE_WEBRTC_OFFER', (msg) => {
			this.sender = msg.sender;
			this.receiver = this.myId;

			const rejectOffer = (reason: number) => {
				this.socket.send({
					type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_ANSWER,
					accept: reason,
					sender: msg.sender,
					receiver: msg.receiver,
				});
			};

			if (store.getState().callStatus === CALL_STATUS_FREE) {
				eventBus.emit('GET_PRIVATE_CALLED');
				this.answerAudioPrompt[0]();
				store.dispatch(setNowChattingId(msg.sender));
				this.answerModal = Modal.confirm({
					icon: msg.security ? <AlertOutlined /> : <ExclamationCircleOutlined />,
					title: '视频通话邀请',
					content: (
						<span>
							用户 {msg.senderName}(id: {msg.sender})向您发出视频通话请求，是否接受？
							{msg.security ? (
								<span>
									<br />
									注意：对方启用了私聊视频会话加密功能，接受此会话可能会导致您的CPU占用被大幅度提高，请与对方确认后选择是否接受此会话
								</span>
							) : (
								''
							)}
						</span>
					),
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
						this.useSecurity = msg.security;
						this.createAnswer(msg.sender, msg.sdp);
					},
					onCancel: () => {
						rejectOffer(PRIVATE_WEBRTC_ANSWER_TYPE.REJECT);
						this.answerModal = null;
						this.sender = undefined;
						this.receiver = undefined;
					},
					afterClose: this.answerAudioPrompt[1],
					centered: true,
					getContainer: getMainContent,
				});
			} else rejectOffer(PRIVATE_WEBRTC_ANSWER_TYPE.BUSY);
		});

		this.socket.on('ON_PRIVATE_WEBRTC_ANSWER', ({ accept, sdp, sender, receiver }) => {
			if (sender === this.sender && receiver === this.receiver) {
				this.callAudioPrompt[1]();
				if (this.offerModal) {
					this.offerModal.destroy();
					this.offerModal = null;
				}
				if (accept === PRIVATE_WEBRTC_ANSWER_TYPE.ACCEPT) {
					this.receiveAnswer(sdp);
				} else {
					switch (accept) {
						case PRIVATE_WEBRTC_ANSWER_TYPE.BUSY:
							globalMessage.error({
								content: '对方正在通话中',
								duration: 1.5,
							});
							break;
						case PRIVATE_WEBRTC_ANSWER_TYPE.NO_USER:
							globalMessage.error({
								content: '呼叫的用户不存在',
								duration: 1.5,
							});
							break;
						case PRIVATE_WEBRTC_ANSWER_TYPE.REJECT:
							globalMessage.error({
								content: '对方拒绝了您的通话邀请',
								duration: 1.5,
							});
							break;
					}
					this.onEnded();
				}
			}
		});

		this.socket.on('ON_PRIVATE_WEBRTC_CANDIDATE', this.handleCandidate.bind(this));

		this.socket.on('ON_PRIVATE_WEBRTC_DISCONNECT', (msg) => {
			this.onHangUp(msg);
		});
	}

	async createOffer(targetId: number, myName: string, offerModal: any) {
		this.useSecurity = localStorage.getItem('securityPrivateWebrtc') === 'true';
		this.peer = this.buildPeer();
		this.callAudioPrompt[0]();
		store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
		store.dispatch(setNowWebrtcFriendId(targetId));
		this.sender = this.myId;
		this.receiver = targetId;
		this.localStream = new MediaStream();
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE)).getVideoTracks()[0]
		);
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE)).getAudioTracks()[0]
		);
		for (const track of this.localStream.getTracks()) {
			this.peer.addTrack(track, this.localStream);
		}
		// NOTE: 加密
		if (this.useSecurity)
			this.peer.getSenders().forEach((sender) => {
				setupSenderTransform(sender);
			});
		this.peer
			.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
			})
			.then((sdp) => {
				this.peer.setLocalDescription(sdp);
				this.socket.send({
					type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_OFFER,
					sdp: sdp.sdp,
					sender: this.myId,
					senderName: myName,
					receiver: targetId,
					security: this.useSecurity,
				});
			});
		this.offerModal = offerModal;
	}

	async createAnswer(sender: number, remoteSdp: any) {
		this.peer = this.buildPeer();
		store.dispatch(setCallStatus(CALL_STATUS_ANSWERING));
		store.dispatch(setNowWebrtcFriendId(sender));

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
			(await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE)).getVideoTracks()[0]
		);
		this.localStream.addTrack(
			(await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE)).getAudioTracks()[0]
		);
		this.emit('LOCAL_STREAM_READY', this.localStream);
		for (const track of this.localStream.getTracks()) {
			this.peer.addTrack(track, this.localStream);
		}
		// NOTE: 加密
		if (this.useSecurity)
			this.peer.getSenders().forEach((sender) => {
				setupSenderTransform(sender);
			});
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
					type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_ANSWER,
					accept: PRIVATE_WEBRTC_ANSWER_TYPE.ACCEPT,
					sdp: sdp.sdp,
					sender: this.sender,
					receiver: this.receiver,
				});
				store.dispatch(setCallStatus(CALL_STATUS_CALLING));
			});
	}

	receiveAnswer(remoteSdp: any) {
		this.peer.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'answer',
			})
		);
		store.dispatch(setCallStatus(CALL_STATUS_CALLING));
		this.emit('LOCAL_STREAM_READY', this.localStream);
	}

	handleCandidate(data: RTCIceCandidateInit) {
		this.candidateQueue = this.candidateQueue || new Array();
		if (data.candidate) {
			// NOTE: 需要等待 signalingState 变为 stable 才能添加候选者
			if (this.peer && this.peer.signalingState === 'stable') {
				this.peer.addIceCandidate(data);
			} else {
				this.candidateQueue.push(data);
			}
		}
	}

	hangUp() {
		this.callAudioPrompt[1]();
		this.socket.send({
			type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_DISCONNECT,
			sender: this.sender,
			receiver: this.receiver,
			target: store.getState().nowWebrtcFriendId,
		});
		this.offerModal = null;
		this.onEnded();
	}

	onHangUp(data: { sender: number; receiver: number }) {
		const { sender, receiver } = data;
		if (sender === this.sender && receiver === this.receiver) {
			if (this.answerModal) {
				this.answerAudioPrompt[1]();
				this.answerModal.destroy();
			}
			this.answerModal = null;
			this.onEnded();
		}
	}

	/**
	 * 创建 RTCPeer 连接
	 * @returns 创建后的 RTCPeer 连接
	 */
	private buildPeer(): RTCPeerConnection {
		const peer = new (RTCPeerConnection as any)({
			iceServers: [
				{
					urls: 'stun:stun.stunprotocol.org:3478',
				},
			],
			encodedInsertableStreams: this.useSecurity,
		}) as RTCPeerConnection;
		peer.onicecandidate = (evt) => {
			if (evt.candidate) {
				const message = {
					type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_CANDIDATE,
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
			// NOTE: 解密
			if (this.useSecurity) setupReceiverTransform(evt.receiver);
			this.remoteStream = this.remoteStream || new MediaStream();
			this.remoteStream.addTrack(evt.track);
			if (this.remoteStream.getTracks().length === 2)
				this.emit('REMOTE_STREAM_READY', this.remoteStream);
		};
		return peer;
	}

	/**
	 * 结束通话后清空数据
	 */
	private onEnded() {
		this.sender = undefined;
		this.receiver = undefined;
		this.useSecurity = false;
		store.dispatch(setNowWebrtcFriendId(null));
		this.localStream = null;
		this.remoteStream = null;
		this.peer.close();
		// this.peer = undefined;
		store.dispatch(setCallStatus(CALL_STATUS_FREE));
	}
}
