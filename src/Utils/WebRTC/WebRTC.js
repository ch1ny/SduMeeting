export default class WebRTC {
	iceServers = [];

	/**
	 *
	 * @param {WebSocket} socket
	 * @param {MediaStream} localMediaStream
	 * @param {MediaStream} remoteMediaStream
	 */
	constructor(socket, localMediaStream, remoteMediaStream) {
		this.socket = socket;
		this.peerConnected = false; // 对等体是否已连接
		this.peerConnection = undefined; // 对等体连接
		this.socket.onmessage = (msg) => {
			const evt = JSON.parse(msg.data);
			switch (evt.type) {
				case 'offer':
					this.recvOffer(evt, localMediaStream, remoteMediaStream);
					break;
				case 'answer':
					// 发起方接到应答方的 sdp 应答
					if (this.peerConnection)
						this.peerConnection.setRemoteDescription(new RTCSessionDescription(evt));
					break;
				case 'candidate':
					// 接收到ICE候选者
					const candidate = new RTCIceCandidate({
						sdpMLineIndex: evt.sdpMLineIndex,
						sdpMid: evt.sdpMid,
						candidate: evt.candidate,
					});
					this.peerConnection.addIceCandidate(candidate);
					break;
				case 'bye':
					console.log('WebRTC通信断开');
					this.peerConnection.close();
					this.peerConnection = undefined;
			}
		};
	}

	/**
	 * 创建新的对等连接
	 * @param {MediaStream} localMediaStream 本地媒体流
	 * @param {MediaStream} remoteMediaStream 远程媒体流（对应的媒体流对象传进来）
	 * @returns {RTCPeerConnection} RTC对等连接
	 */
	prepareNewConnection(localMediaStream, remoteMediaStream) {
		const pc_config = { iceServers: this.iceServers };
		let _peerConnection = new RTCPeerConnection(pc_config);

		/**
		 * 发送所有 ICE 候选给其它对等体
		 */
		_peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				console.log(`存在 candidate 候选：${event.candidate}`);
				const candidateText = JSON.stringify({
					type: 'candidate',
					sdpMLineIndex: evt.candidate.sdpMLineIndex,
					sdpMid: evt.candidate.sdpMid,
					candidate: evt.candidate.candidate,
				});
				console.log(`发送候选者信息：${candidateText}`);
				this.socket.send(candidateText);
			}
		};

		_peerConnection.ontrack = (event) => {
			console.log('远程媒体流轨道发生改变');
			// 先移除旧轨道
			for (const track of remoteMediaStream) {
				remoteMediaStream.removeTrack(track);
			}
			// 再添加新轨道
			if (event.streams && event.streams[0]) {
				for (const track of event.streams[0].getTracks()) {
					remoteMediaStream.addTrack(track);
				}
			} else {
				remoteMediaStream.addTrack(event.track);
			}
		};

		// 初始化连接轨道
		for (const track of localMediaStream.getTracks()) {
			_peerConnection.addTrack(track, localMediaStream);
		}

		return _peerConnection;
	}

	/**
	 * 发送连接请求
	 * @param {MediaStream} localMediaStream 本地媒体流
	 * @param {MediaStream} remoteMediaStream 远程媒体流（对应的媒体流对象传进来）
	 */
	sendOffer(localMediaStream, remoteMediaStream) {
		this.peerConnection = this.prepareNewConnection(localMediaStream, remoteMediaStream);

		// 创建本地 SDP （会话描述符）
		this.peerConnection
			.createOffer()
			.then((sessionDescription) => {
				this.peerConnection.setLocalDescription(sessionDescription);
				sendSDP(sessionDescription);
			})
			.catch((err) => {
				console.error(`创建Offer失败：${err.message}`);
			});
	}

	/**
	 * 向远程发送本地的会话描述符
	 * @param {RTCSessionDescription} sdp 会话描述符
	 */
	sendSDP(sdp) {
		const sdpText = JSON.stringify(sdp);
		console.log(sdpText);
		socket.send(sdpText);
	}

	recvOffer(event, localMediaStream, remoteMediaStream) {
		if (this.peerConnection) {
			console.warn('连接已存在');
			return;
		}

		this.peerConnection = this.prepareNewConnection(localMediaStream, remoteMediaStream);
		this.peerConnection.setRemoteDescription(new RTCSessionDescription(event));
		// 发送 Answer，创建远程会话描述
		this.peerConnection
			.createAnswer()
			.then((sessionDescription) => {
				this.peerConnection.setLocalDescription(sessionDescription);
				this.sendSDP(sessionDescription); // SDP 应答
			})
			.catch((err) => {
				console.error(`创建Answer失败：${err.message}`);
			});
	}
}
