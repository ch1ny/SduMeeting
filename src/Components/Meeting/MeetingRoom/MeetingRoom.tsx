import { FullscreenExitOutlined, FullscreenOutlined, MessageOutlined } from '@ant-design/icons';
import notification from 'antd/lib/notification';
import axios from 'axios';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { CameraIcon, MicroPhoneIcon, ShareScreenIcon } from 'Components/MyIcon/MainViewIcons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import { getDesktopStream, getDeviceStream } from 'Utils/Global';
import { usePrevious } from 'Utils/MyHooks/MyHooks';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';
import { RTCSender } from 'Utils/WebRTC/RTC';
import SFU from 'Utils/WebRTC/SFU';
import ChatBox from './ChatBox/ChatBox';
import MainVideo from './MainVideo/MainVideo';
import MeetingMembers from './MeetingMembers/MeetingMembers';
import './style.scss';
import ToolBar from './ToolBar/ToolBar';
import ToolButton from './ToolBar/ToolButton/ToolButton';
import Topbar from './Topbar/Topbar';

interface MeetingRoomProps {
	autoOpenCamera: boolean;
	autoOpenMicroPhone: boolean;
	joinName: string;
	leaveMeeting: Function;
	meetingId: string;
	sfu: SFU;
	userId: number;
}

const _stream = new MediaStream();

export default function MeetingRoom(props: MeetingRoomProps) {
	const [allMembers, setAllMembers] = useState(
		new Map<number, string>([[props.userId, props.joinName]])
	);

	const [usingVideoDevice, setUsingVideoDevice] = useState(store.getState().usingVideoDevice);
	const [usingAudioDevice, setUsingAudioDevice] = useState(store.getState().usingAudioDevice);

	useEffect(
		() =>
			store.subscribe(() => {
				setUsingVideoDevice(store.getState().usingVideoDevice);
				setUsingAudioDevice(store.getState().usingAudioDevice);
			}),
		[]
	);

	/**
	 * INFO: 静音 / 开关摄像头
	 */
	const [isUsingMicroPhone, setIsUsingMicroPhone] = useState(props.autoOpenMicroPhone);

	useEffect(() => {
		localStorage.setItem('autoOpenMicroPhone', `${isUsingMicroPhone}`);
		if (localStream) {
			const track = localStream.getAudioTracks()[0];
			if (track) {
				track.enabled = isUsingMicroPhone;
			}
			setTrackEnableStatus(props.sfu.sender, 'audio', isUsingMicroPhone);
		}
	}, [isUsingMicroPhone]);

	const [isUsingCamera, setIsUsingCamera] = useState(props.autoOpenCamera);

	useEffect(() => {
		localStorage.setItem('autoOpenCamera', `${isUsingCamera}`);
		if (localStream) {
			const track = localStream.getVideoTracks()[0];
			if (track) {
				track.enabled = isUsingCamera;
				(localPlayedStream as MediaStream).getVideoTracks()[0].enabled = isUsingCamera;
			}
			setTrackEnableStatus(props.sfu.sender, 'video', isUsingCamera);
		}
	}, [isUsingCamera]);

	const [isSharingScreen, setIsSharingScreen] = useState(0);

	const [mainVideo, setMainVideo] = useState({
		stream: _stream,
		streamName: '',
	});

	const localStream = useMemo(() => new MediaStream(), []);
	const [localPlayedStream, setLocalPlayedStream] = useState<MediaStream | undefined>(undefined);

	const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | undefined>(undefined);
	const prevVideoTrack = usePrevious(videoTrack);
	useEffect(() => {
		if (videoTrack) {
			if (prevVideoTrack) {
				replaceRemoteTrack(props.sfu.sender.pc.getSenders(), prevVideoTrack, videoTrack);
				const lps = localPlayedStream as MediaStream;
				lps.removeTrack(lps.getVideoTracks()[0]);
				lps.addTrack(videoTrack);
			} else localStream.addTrack(videoTrack);
			if (localStreamStatus !== 3) {
				setLocalStreamStatus(localStream.getTracks().length);
			}
		}
	}, [videoTrack]);

	const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | undefined>(undefined);
	const prevAudioTrack = usePrevious(audioTrack);
	useEffect(() => {
		if (audioTrack) {
			if (prevAudioTrack) {
				replaceRemoteTrack(props.sfu.sender.pc.getSenders(), prevAudioTrack, audioTrack);
			} else localStream.addTrack(audioTrack);
			if (localStreamStatus !== 3) {
				setLocalStreamStatus(localStream.getTracks().length);
			}
		}
	}, [audioTrack]);

	useEffect(() => {
		if (!usingVideoDevice) return;
		getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE).then((stream) => {
			const track = stream.getVideoTracks()[0];
			track.enabled = isUsingCamera;
			setVideoTrack(track);
			/**
			 * INFO: 本地播放流(仅需展示视频轨道)
			 */
			if (localPlayedStream) return;
			const clonedStream = new MediaStream();
			clonedStream.addTrack(track);
			setLocalPlayedStream(clonedStream);
			setMainVideo({
				stream: clonedStream,
				streamName: props.joinName,
			});
			setMembers(new Map(members.set(props.userId, { stream: clonedStream })));
		});
	}, [usingVideoDevice]);

	useEffect(() => {
		if (!usingAudioDevice) return;
		getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE).then((stream) => {
			const track = stream.getAudioTracks()[0];
			track.enabled = isUsingMicroPhone;
			setAudioTrack(track);
		});
	}, [usingAudioDevice]);

	/**
	 * NOTE: WebRTC 控制部分
	 */
	const [members, setMembers] = useState(new Map<number, { stream: MediaStream }>());
	const [localStreamStatus, setLocalStreamStatus] = useState(0);
	useEffect(() => {
		if (props.sfu) {
			props.sfu.on('addRemoteStream', (id: number, stream: MediaStream) => {
				setMembers(new Map(members.set(id, { stream })));
			});
			return () => {
				props.sfu.removeAllListeners('addRemoteStream');
			};
		}
	}, [props.sfu, members]);

	useEffect(() => {
		if (props.sfu) {
			props.sfu.on('addScreenShare', (id: number, stream: MediaStream) => {
				setMainVideo({
					stream,
					streamName: `${allMembers.get(-id)}的屏幕共享`,
				});
				setIsSharingScreen(id);
			});
			props.sfu.on('onNewMemberJoin', (newMember: { id: number; name: string }) => {
				// console.log('===onNewMemberJoin===');
				setAllMembers(new Map(allMembers.set(newMember.id, newMember.name)));
			});
			props.sfu.on('onJoinSuccess', (nowAllMembers) => {
				// console.log('===onJoinSuccess===');
				const ids = Object.keys(nowAllMembers);
				for (const id of ids) {
					allMembers.set(Number(id), nowAllMembers[`${id}`].name);
				}
				setAllMembers(new Map(allMembers));
			});
			return () => {
				props.sfu.removeAllListeners('addScreenShare');
				props.sfu.removeAllListeners('onNewMemberJoin');
				props.sfu.removeAllListeners('onJoinSuccess');
			};
		}
	}, [props.sfu, allMembers]);

	useEffect(() => {
		if (props.sfu) {
			props.sfu.on('removeScreenShare', (id: number) => {
				const stream = members.get(props.userId)?.stream;
				setMainVideo({
					stream: stream as MediaStream,
					streamName: `${allMembers.get(props.userId)}`,
				});
				setIsSharingScreen(0);
			});

			return () => {
				props.sfu.removeAllListeners('removeScreenShare');
			};
		}
	}, [props.sfu, members, allMembers]);

	useEffect(() => {
		if (props.sfu) {
			props.sfu.on('removeRemoteStream', (id: number) => {
				members.delete(id);
				if (mainVideo.stream === _stream) {
					const first = members.entries().next();
					setMainVideo({
						stream: first.value[1].stream,
						streamName: `${allMembers.get(first.value[0])}`,
					});
				}
				setMembers(new Map(members));
			});
			return () => {
				props.sfu.removeAllListeners('removeRemoteStream');
			};
		}
	}, [props.sfu, members, mainVideo]);

	useEffect(() => {
		if (localStreamStatus === 2) {
			props.sfu.publish(localStream);
			setLocalStreamStatus(3);
		}
	}, [localStreamStatus]);

	const [isFullScreen, setIsFullScreen] = useState(false);
	const fullScreenRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const onFullScreenChange = () => {
			const isFullScreen = document.fullscreenElement !== null;
			setIsFullScreen(isFullScreen);
			eWindow.ipc.send('MAIN_WINDOW_FULL_SCREEN', isFullScreen);
		};
		(fullScreenRef.current as HTMLDivElement).addEventListener(
			'fullscreenchange',
			onFullScreenChange
		);
	}, []);

	const [isShowChatBox, setIsShowChatBox] = useState(false);
	const [messages, setMessages] = useState<
		Array<{
			userId: number;
			userName: string;
			message: string;
		}>
	>([]);
	useEffect(() => {
		props.sfu.on('onChatMessage', (msg) => {
			messages.push({
				userName: `${allMembers.get(msg.userId)}${
					msg.userId === props.userId ? ' (我)' : ''
				}`,
				userId: msg.userId,
				message: msg.message,
			});
			setMessages([...messages]);
		});

		return () => {
			props.sfu.removeAllListeners('onChatMessage');
		};
	}, [messages]);

	const [screenShareSfu, setScreenShareSfu] = useState<SFU | undefined>(undefined);
	useEffect(() => {
		if (screenShareSfu)
			return () => {
				screenShareSfu.socket.close();
				setScreenShareSfu(undefined);
			};
	}, [screenShareSfu]);
	const [isExchangingSharingStatus, setIsExchangingSharingStatus] = useState(false);

	return (
		<>
			<Topbar leaveMeeting={props.leaveMeeting} meetingId={props.meetingId} />
			<div id={`videoContainer${isFullScreen ? 'FullScreen' : ''}`} ref={fullScreenRef}>
				<div id='mainBox'>
					<MainVideo
						stream={mainVideo.stream}
						streamName={mainVideo.streamName}
						muted={isSharingScreen === 0 || isSharingScreen === -props.userId}
					/>
					<MeetingMembers
						allMembers={allMembers}
						members={members}
						onChoose={(evt) => {
							if (
								isSharingScreen === 0 &&
								(evt.target as HTMLElement).className === 'meetingMemberVideo'
							) {
								const target = evt.target as HTMLVideoElement;
								setMainVideo({
									stream: target.srcObject as MediaStream,
									streamName: `${target.getAttribute('memberName')}`,
								});
							}
						}}
						userId={props.userId}
					/>
					<ChatBox
						messages={messages}
						sendMessage={(msgText) => {
							props.sfu.send({
								type: 'chat',
								data: {
									meetingId: Number(props.meetingId),
									userId: props.userId,
									message: msgText,
								},
							});
						}}
						style={{
							minWidth: isShowChatBox ? '15rem' : '0%',
							maxWidth: isShowChatBox ? '15rem' : '0%',
							transform: isShowChatBox ? 'translateX(-15rem)' : '',
						}}
					/>
				</div>
				<ToolBar
					toolButtons={[
						<ToolButton
							icon={<MicroPhoneIcon using={isUsingMicroPhone} />}
							text={isUsingMicroPhone ? '静音' : '解除静音'}
							title={isUsingMicroPhone ? '静音' : '解除静音'}
							onClick={() => {
								setIsUsingMicroPhone(!isUsingMicroPhone);
							}}
						/>,
						<ToolButton
							icon={<CameraIcon using={isUsingCamera} />}
							text={isUsingCamera ? '停止视频' : '开启视频'}
							title={isUsingCamera ? '停止视频' : '开启视频'}
							onClick={() => {
								setIsUsingCamera(!isUsingCamera);
							}}
						/>,
						<ToolButton
							icon={
								isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
							}
							text={isFullScreen ? '退出全屏' : '全屏模式'}
							title={isFullScreen ? '退出全屏' : '全屏模式'}
							onClick={() => {
								if (isFullScreen) {
									document.exitFullscreen();
								} else {
									(fullScreenRef.current as HTMLDivElement).requestFullscreen();
								}
							}}
						/>,
						<ToolButton
							disabled={isExchangingSharingStatus}
							icon={<ShareScreenIcon sharing={isSharingScreen !== -props.userId} />}
							text={isSharingScreen === -props.userId ? '停止共享' : '屏幕共享'}
							title={isSharingScreen === -props.userId ? '停止共享' : '屏幕共享'}
							onClick={() => {
								if (isSharingScreen === 0) {
									setIsExchangingSharingStatus(true);
									axios
										.post(
											`http://${props.sfu.sfuIp}/screenOn`,
											`userId=${props.userId}&meetingId=${props.meetingId}`
										)
										.then((response) => {
											return response.data;
										})
										.then((res) => {
											if (res.code === 0 && res.message === 'success') {
												getDesktopStream().then((stream) => {
													setMainVideo({
														stream,
														streamName: `${props.joinName}的屏幕共享`,
													});
													setIsSharingScreen(-props.userId);
													const screenShareSfu = new SFU(
														props.sfu.sfuIp,
														-props.userId,
														`${props.joinName}的屏幕共享`,
														props.meetingId
													);
													screenShareSfu.on('connect', () => {
														screenShareSfu.join();
														screenShareSfu.on('newMessage', (msg) => {
															console.log(msg);
														});
														screenShareSfu.on('onJoinSuccess', () => {
															screenShareSfu.publish(stream);
														});
													});
													setScreenShareSfu(screenShareSfu);
												});
											} else {
												notification.error({
													message: '屏幕共享失败',
													description: `${res.message}`,
												});
											}
										})
										.finally(() => {
											setIsExchangingSharingStatus(false);
										});
								} else if (isSharingScreen === -props.userId) {
									setIsExchangingSharingStatus(true);
									axios
										.post(
											`http://${props.sfu.sfuIp}/screenOff`,
											`userId=${props.userId}&meetingId=${props.meetingId}`
										)
										.then(() => {
											if (screenShareSfu) {
												screenShareSfu.socket.close();
												setScreenShareSfu(undefined);
												setMainVideo({
													stream: localPlayedStream as MediaStream,
													streamName: props.joinName,
												});
												setIsSharingScreen(0);
											}
										})
										.finally(() => {
											setIsExchangingSharingStatus(false);
										});
								} else {
									// NOTE: 其他人正在分享屏幕
									globalMessage.error('请等待他人结束屏幕分享！');
								}
							}}
						/>,
						<ToolButton
							icon={<MessageOutlined />}
							text={'聊天'}
							title={'聊天'}
							onClick={() => {
								setIsShowChatBox(!isShowChatBox);
							}}
						/>,
					]}
				/>
			</div>
		</>
	);
}

/**
 * 设置远程轨道的 enabled
 * @param {RTCSender} _sender
 * @param {string} type
 * @param {boolean} enabled
 */
function setTrackEnableStatus(_sender: RTCSender, type: string, enabled: boolean) {
	if (_sender) {
		const senders = _sender.pc.getSenders();
		for (const sender of senders) {
			if (sender.track && sender.track.kind === type) {
				sender.track.enabled = enabled;
				return;
			}
		}
	}
}

/**
 * 更换新的流轨道
 * @param {RTCRtpSender[]} senders
 * @param {MediaStreamTrack} oldTrack
 * @param {MediaStreamTrack} newTrack
 */
function replaceRemoteTrack(
	senders: RTCRtpSender[],
	oldTrack: MediaStreamTrack,
	newTrack: MediaStreamTrack
) {
	for (const sender of senders) {
		if (sender.track === oldTrack) {
			sender.replaceTrack(newTrack);
			break;
		}
	}
}
