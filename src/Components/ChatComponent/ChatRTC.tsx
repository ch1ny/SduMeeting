import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { EventEmitter } from 'events';
import React from 'react';
import { ChatSocket } from 'Utils/ChatSocket/ChatSocket';
import {
    CALL_STATUS_ANSWERING,
    CALL_STATUS_CALLING,
    CALL_STATUS_FREE,
    CALL_STATUS_OFFERING, ChatWebSocketType,
    DEVICE_TYPE
} from 'Utils/Constraints';
import { getDeviceStream, getMainContent } from 'Utils/Global';
import { AUDIO_TYPE, buildPropmt } from 'Utils/Prompt/Prompt';
import {
    setCallStatus,
    setNowChattingId,
    setNowWebrtcFriendId
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';

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
    peer: RTCPeerConnection;
    answerModal!: null | {
        destroy: () => void;
    };
    offerModal!: null | {
        destroy: () => void;
    };
    candidateQueue!: Array<any>;

    constructor(props: ChatRtcProps) {
        super();
        this.callAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_CALLING, true);
        this.answerAudioPrompt = buildPropmt(AUDIO_TYPE.WEBRTC_ANSWERING, true);

        this.socket = props.socket;
        this.myId = props.myId;
        this.localStream = null;
        this.remoteStream = null;

        this.peer = this.buildPeer();

        this.socket.on('ON_PRIVATE_WEBRTC_OFFER', (msg) => {
            this.sender = msg.sender;
            this.receiver = this.myId;

            const rejectOffer = () => {
                this.socket.send({
                    type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_ANSWER,
                    accept: false,
                    sender: msg.sender,
                    receiver: msg.receiver,
                });
            };

            if (store.getState().callStatus === CALL_STATUS_FREE) {
                this.answerAudioPrompt[0]();
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
                    onCancel: () => {
                        rejectOffer()
                        this.answerModal = null;
                        this.sender = undefined;
                        this.receiver = undefined;
                    },
                    afterClose: this.answerAudioPrompt[1],
                    centered: true,
                    getContainer: getMainContent,
                });
            } else rejectOffer();
        });

        this.socket.on('ON_PRIVATE_WEBRTC_ANSWER', ({ accept, sdp, sender, receiver }) => {
            if (sender === this.sender && receiver === this.receiver) {
                this.callAudioPrompt[1]();
                if (this.offerModal) {
                    this.offerModal.destroy();
                    this.offerModal = null;
                }
                if (accept) {
                    this.receiveAnswer(sdp);
                } else {
                    globalMessage.error({
                        content: '对方拒绝了您的通话邀请',
                        duration: 2,
                    });
                    store.dispatch(setCallStatus(CALL_STATUS_FREE));
                }
            }
        });

        this.socket.on('ON_PRIVATE_WEBRTC_CANDIDATE', this.handleCandidate.bind(this));

        this.socket.on('ON_PRIVATE_WEBRTC_DISCONNECT', (msg) => {
            this.onHangUp(msg);
        });
    }

    async createOffer(targetId: number, myName: string, offerModal: any) {
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

        this.peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        }).then((sdp) => {
            this.peer.setLocalDescription(sdp);
            this.socket.send({
                type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_OFFER,
                sdp: sdp.sdp,
                sender: this.myId,
                senderName: myName,
                receiver: targetId,
            });
        });
        this.offerModal = offerModal;
    }

    async createAnswer(sender: number, remoteSdp: any) {
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
        const videoTrack = (await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE)).getVideoTracks()[0];
        const audioTrack = (await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE)).getAudioTracks()[0]
        this.localStream.addTrack(videoTrack);
        this.localStream.addTrack(audioTrack);
        this.emit('LOCAL_STREAM_READY', this.localStream);
        // NOTE: 为了实现客户端检测断线可能，必须先传递 Video Track
        this.peer.addTrack(videoTrack, this.localStream);
        this.peer.addTrack(audioTrack, this.localStream)
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
                    accept: true,
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
            type: ChatWebSocketType.CHAT_PRIVATE_WEBRTC_DISCONNECT,
            sender: this.sender,
            receiver: this.receiver,
            target: store.getState().nowWebrtcFriendId,
        });
        this.sender = undefined;
        this.receiver = undefined;
        store.dispatch(setNowWebrtcFriendId(null));
        this.offerModal = null;
        this.localStream = null;
        this.remoteStream = null;
        this.peer.close();
        this.peer = this.buildPeer();
        store.dispatch(setCallStatus(CALL_STATUS_FREE));
    }

    onHangUp(data: { sender: number, receiver: number }) {
        const { sender, receiver } = data
        if (sender === this.sender && receiver === this.receiver) {
            this.sender = undefined;
            this.receiver = undefined;
            store.dispatch(setNowWebrtcFriendId(null));
            if (this.answerModal) {
                this.answerAudioPrompt[1]();
                this.answerModal.destroy();
            }
            this.answerModal = null;
            this.localStream = null;
            this.remoteStream = null;
            this.peer.close();
            this.peer = this.buildPeer();
            store.dispatch(setCallStatus(CALL_STATUS_FREE));
        }
    }

    private buildPeer(): RTCPeerConnection {
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
            this.remoteStream = this.remoteStream || new MediaStream();
            this.remoteStream.addTrack(evt.track);
            if (this.remoteStream.getTracks().length === 2)
                this.emit('REMOTE_STREAM_READY', this.remoteStream);
        };
        return peer;
    }
}
