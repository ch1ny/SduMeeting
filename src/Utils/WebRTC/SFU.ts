import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { EventEmitter } from 'events';
import RTC, { RTCSender } from './RTC';

export default class SFU extends EventEmitter {
    _rtc: RTC;
    userId: number;
    userName: string;
    roomId: number;
    socket: WebSocket;
    sender!: RTCSender;

    constructor(userId: number, userName: string, roomId: string) {
        super();
        this._rtc = new RTC();
        this.userId = userId;
        this.userName = userName;
        this.roomId = Number(roomId);

        // const sfuUrl = 'ws://localhost:3000/ws?userId=' + userId + '&roomId=' + roomId;
        const sfuUrl = 'ws://webrtc.aiolia.top:3000/ws?userId=' + userId + '&roomId=' + roomId;
        // const sfuUrl = 'ws://121.40.95.78:3000/ws?userId=' + userId + '&roomId=' + roomId;

        this.socket = new WebSocket(sfuUrl);

        this.socket.onopen = () => {
            // console.log('WebSocket连接成功...');
            this._onRoomConnect();
        };

        this.socket.onmessage = (e) => {
            const parseMessage = JSON.parse(e.data);
            // if (parseMessage && parseMessage.type !== 'heartPackage') console.log(parseMessage);

            switch (parseMessage.type) {
                case 'newUser':
                    // console.log(parseMessage);
                    this.onNewMemberJoin(parseMessage);
                    break;
                case 'joinSuccess':
                    // TODO: 希望在这里返回当前所有用户对应的ID和个人信息
                    // console.log(parseMessage);
                    this.onJoinSuccess(parseMessage);
                    break;
                case 'publishSuccess':
                    // 这里是接到有人推流的信息
                    this.onPublish(parseMessage);
                    break;
                case 'userLeave':
                    // 这里是有人停止推流
                    this.onUnpublish(parseMessage);
                    break;
                case 'subscribeSuccess':
                    // 这里是加入会议后接到已推流的消息进行订阅
                    this.onSubscribe(parseMessage);
                    break;
                case 'heartPackage':
                    // 心跳包
                    // console.log('heartPackage:::');
                    break;
                case 'requestError':
                    globalMessage.error(`服务器错误: ${parseMessage.data}`);
                    break;
                default:
                    console.error('未知消息', parseMessage);
            }
        };

        this.socket.onerror = (e) => {
            // console.log('onerror::');
            console.warn(e);
            this.emit('error');
        };

        this.socket.onclose = (e) => {
            // console.log('onclose::');
            console.warn(e);
        };
    }

    _onRoomConnect = () => {
        // console.log('onRoomConnect');

        this._rtc.on('localstream', (id, stream) => {
            this.emit('addLocalStream', id, stream);
        });

        this._rtc.on('addtrack', (id, stream) => {
            this.emit('addRemoteStream', id, stream);
        });

        this.emit('connect');
    };

    join() {
        // console.log(`Join to [${this.roomId}] as [${this.userName}:${this.userId}]`);
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

    // 新成员入会
    onNewMemberJoin(message: any) {
        this.emit('onNewMemberJoin', message.data.newUserInfo);
    }

    // 成功加入会议
    onJoinSuccess(message: any) {
        this.emit('onJoinSuccess', message.data.allUserInfos);
        for (const pubId of message.data.pubIds) {
            this._onRtcCreateReceiver(pubId);
        }
    }

    send(data: any) {
        this.socket.send(JSON.stringify(data));
    }

    publish(stream: MediaStream) {
        this._createSender(this.userId, stream);
    }

    _createSender(pubId: number, stream: MediaStream) {
        try {
            // 创建一个sender
            let sender = this._rtc.createSender(pubId, stream);
            this.sender = sender;
            // 监听IceCandidate回调
            sender.pc.onicecandidate = async (e) => {
                if (!sender.offerSent) {
                    const offer = sender.pc.localDescription;
                    sender.offerSent = true;
                    this.publishToServer(offer, pubId);
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
            // console.log('onCreateSender error =>' + error);
        }
    }

    publishToServer(offer: RTCSessionDescription | null, pubId: number) {
        let message = {
            type: 'publish',
            data: {
                jsep: offer,
                pubId,
                userId: this.userId,
                roomId: this.roomId,
            },
        };
        // console.log('===publish===');
        // console.log(message);
        this.send(message);
    }

    onPublish(message: any) {
        // 服务器返回的Answer信息 如A ---> Offer---> SFU---> Answer ---> A
        if (this.sender && message['data']['pubId'] == this.userId) {
            // console.log('onPublish:::自已发布的Id:::' + message['data']['pubId']);
            this.sender.pc.setRemoteDescription(message['data']['jsep']);
        }

        // 服务器返回其他人发布的信息 如 A ---> Pub ---> SFU ---> B
        if (message['data']['pubId'] != this.userId) {
            // console.log('onPublish:::其他人发布的Id:::' + message['data']['pubId']);
            // 使用发布者的userId创建Receiver
            this._onRtcCreateReceiver(message['data']['pubId']);
        }
    }

    onUnpublish(message: any) {
        // console.log('退出用户:' + message['data']['leaverId']);
        this._rtc.closeReceiver(message['data']['leaverId']);
        this.emit('removeRemoteStream', message['data']['leaverId']);
    }

    _onRtcCreateReceiver(pubId: number) {
        try {
            let receiver = this._rtc.createReceiver(pubId);

            receiver.pc.onicecandidate = () => {
                if (!receiver.offerSent) {
                    const offer = receiver.pc.localDescription;
                    receiver.offerSent = true;
                    this.subscribeFromServer(offer, pubId);
                }
            };
            // 创建Offer
            receiver.pc.createOffer().then((desc) => {
                receiver.pc.setLocalDescription(desc);
            });
        } catch (error) {
            // console.log('onRtcCreateReceiver error =>' + error);
        }
    }

    subscribeFromServer(offer: RTCSessionDescription | null, pubId: number) {
        let message = {
            type: 'subscribe',
            data: {
                jsep: offer,
                pubId,
                userId: this.userId,
                roomId: this.roomId,
            },
        };
        // console.log('===subscribe===');
        // console.log(message);
        this.send(message);
    }

    onSubscribe(message: any) {
        // 使用发布者的Id获取Receiver
        const receiver = this._rtc.getReceivers(message['data']['pubId']);
        if (receiver) {
            // console.log('服务器应答Id:' + message['data']['pubId']);
            if (receiver.pc.remoteDescription) {
                console.warn('已建立远程连接！');
            } else {
                receiver.pc.setRemoteDescription(message['data']['jsep']);
            }
        } else {
            // console.log('receiver == null');
        }
    }
}
