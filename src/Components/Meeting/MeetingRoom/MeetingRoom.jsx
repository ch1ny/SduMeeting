import { CopyOutlined, DisconnectOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, message, Modal } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { DEVICE_TYPE } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

async function setMediaStream(mediaType, object) {
	switch (mediaType) {
		case DEVICE_TYPE.VIDEO_DEVICE:
			switch (object.value) {
				case 'screen':
					return await window.navigator.mediaDevices.getDisplayMedia();
				case 'null':
					return null;
				default:
					const videoConstraints = {
						deviceId: {
							exact: object.key,
						},
						width: 1920,
						height: 1080,
					};
					return await navigator.mediaDevices.getUserMedia({
						video: videoConstraints,
					});
			}
		case DEVICE_TYPE.AUDIO_DEVICE:
			if (object.value !== 'null') {
				const audioConstraints = {
					deviceId: {
						exact: object.key,
					},
				};
				return await navigator.mediaDevices.getUserMedia({
					audio: audioConstraints,
				});
			} else {
				return null;
			}
		default:
			console.warn('汤暖暖的，你能有这么多设备？');
	}
}

export default function MeetingRoom(props) {
	const [usingVideoDevice, setUsingVideoDevice] = useState(store.getState().usingVideoDevice);
	const [usingAudioDevice, setUsingAudioDevice] = useState(store.getState().usingAudioDevice);

	const videoRef = useRef();
	const audioRef = useRef();

	const unsubscribe = store.subscribe(() => {
		setUsingVideoDevice(store.getState().usingVideoDevice);
		setUsingAudioDevice(store.getState().usingAudioDevice);
	});

	useEffect(() => () => {
		console.log('willUnmount');
		unsubscribe();
	});

	useEffect(() => {
		console.log('视频设备', usingVideoDevice);
		(async () => {
			videoRef.current.srcObject = await setMediaStream(
				DEVICE_TYPE.VIDEO_DEVICE,
				usingVideoDevice
			);
		})();
	}, [usingVideoDevice]);

	useEffect(() => {
		console.log('音频设备', usingAudioDevice);
		(async () => {
			audioRef.current.srcObject = await setMediaStream(
				DEVICE_TYPE.AUDIO_DEVICE,
				usingAudioDevice
			);
		})();
	}, [usingAudioDevice]);

	const meetingRoomRef = useRef();
	const meetingIdRef = useRef();

	const { confirm } = Modal;

	return (
		<>
			<div className='topbar'>
				<Button
					type='text'
					className='btn'
					onClick={() => {
						confirm({
							title: '退出会议',
							icon: <DisconnectOutlined />,
							content: '您确认要退出会议吗？',
							onOk: () => {
								props.leaveMeeting();
							},
						});
					}}>
					<LeftOutlined />
					退出会议
				</Button>
				<span ref={meetingIdRef}>{props.meetingId}</span>
				<Button
					type='text'
					id='copyBtn'
					title='复制会议号'
					onClick={() => {
						const clipBoard = navigator.clipboard;
						clipBoard.writeText(props.meetingId).then(() => {
							message.success('会议号复制成功');
						});
					}}>
					<CopyOutlined />
				</Button>
			</div>
			<div id='videoContainer'>
				<div id='mainBox'>
					<div id='mainVideo'>
						<video
							id='video'
							width='100%'
							height='100%'
							autoPlay={true}
							ref={videoRef}
						/>
						<audio id='audio' autoPlay={true} ref={audioRef} />
					</div>
					<div id='members'>{}</div>
				</div>
				<div id='toolbar'></div>
			</div>
		</>
	);
}
