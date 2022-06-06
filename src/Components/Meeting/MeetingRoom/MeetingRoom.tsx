import Icon, {
	FullscreenExitOutlined,
	FullscreenOutlined,
	MessageOutlined,
} from '@ant-design/icons';
import notification from 'antd/lib/notification';
import axios from 'axios';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
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
	const MicroPhoneIcon = (props: any) => (
		<Icon
			component={() => (
				<svg viewBox='0 0 1024 1024' width='1em' height='1em'>
					<path
						d='M510.8096 76.8h0.40704a202.46784 202.46784 0 0 1 202.24 202.24v221.21216a202.4448 202.4448 0 0 1-404.88704 0V279.04a202.46784 202.46784 0 0 1 202.24-202.24z m0 579.61216a156.416 156.416 0 0 0 156.56704-156.16V279.04a156.33664 156.33664 0 0 0-156.16-156.16h-0.40704a156.33664 156.33664 0 0 0-156.16 156.16v221.21216a156.33664 156.33664 0 0 0 156.16 156.16z'
						fill='currentColor'
					/>
					<path
						d='M505.92512 788.35712c-259.64032 0-290.4448-236.30848-290.72384-238.6944a23.04 23.04 0 0 1 45.75488-5.44c1.0112 8.17408 26.95424 198.0544 244.96896 198.0544 219.01568 0 253.92128-190.976 255.30112-199.09888a23.04 23.04 0 0 1 45.46048 7.5264c-0.39168 2.37568-42.0224 237.65248-300.7616 237.65248z'
						fill='currentColor'
					/>
					<path
						d='M511.0144 944.9216a23.04 23.04 0 0 1-23.04-23.04v-156.56448a23.04 23.04 0 0 1 46.08 0v156.56448a23.04 23.04 0 0 1-23.04 23.04z'
						fill='currentColor'
					/>
					{!isUsingMicroPhone && (
						<path d='M 0 0 l 1024 1024' stroke='red' strokeWidth='3em' fill='none' />
					)}
				</svg>
			)}
			{...props}
		/>
	);
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
	const CameraIcon = (props: any) => (
		<Icon
			component={() => (
				<svg viewBox='0 0 1024 1024' width='1em' height='1em'>
					<path
						d='M849.83552 756.26752a78.25408 78.25408 0 0 1-39.61088-10.7264L680.96 670.87616a23.04 23.04 0 0 1-11.52-19.95008v-229.21216a23.04 23.04 0 0 1 11.52-19.95008l129.26464-74.67008a78.26432 78.26432 0 0 1 39.60832-10.72384 78.86336 78.86336 0 0 1 29.92384 5.888 79.99488 79.99488 0 0 1 25.2544 16.384 78.43584 78.43584 0 0 1 24.26624 57.1648v281.0112a78.43328 78.43328 0 0 1-24.26624 57.16224 80.01536 80.01536 0 0 1-25.25184 16.384 78.87872 78.87872 0 0 1-29.92384 5.90336z m-134.31296-118.64064l117.76 68.01408a32.30464 32.30464 0 0 0 16.55552 4.54656 33.024 33.024 0 0 0 12.52352-2.4832 34.18112 34.18112 0 0 0 10.77504-6.98624 32.768 32.768 0 0 0 10.07104-23.89504v-281.0112a32.768 32.768 0 0 0-10.0736-23.8976 34.0992 34.0992 0 0 0-10.77248-6.98112 33.00608 33.00608 0 0 0-12.52352-2.4832 32.32 32.32 0 0 0-16.55808 4.54656l-117.76 68.0192z'
						fill='currentColor'
					/>
					<path
						d='M174.08 218.88h462.08a79.4496 79.4496 0 0 1 79.36 79.36v428.83584a79.4496 79.4496 0 0 1-79.36 79.36H174.08a79.4496 79.4496 0 0 1-79.36-79.36V298.24a79.4496 79.4496 0 0 1 79.36-79.36z m462.08 541.47584a33.3184 33.3184 0 0 0 33.28-33.28V298.24a33.3184 33.3184 0 0 0-33.28-33.28H174.08a33.3184 33.3184 0 0 0-33.28 33.28v428.83584a33.3184 33.3184 0 0 0 33.28 33.28z'
						fill='currentColor'
					/>
					{!isUsingCamera && (
						<path d='M 0 0 l 1024 1024' stroke='red' strokeWidth='3em' fill='none' />
					)}
				</svg>
			)}
			{...props}
		/>
	);
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
	const ShareScreenIcon = (_props: any) => (
		<Icon
			component={() => (
				<svg viewBox='0 0 1024 1024' width='1em' height='1em'>
					<path
						d='M952 705.06666666l-0.42666667-0.10666666-0.42666666 0.10666666H538.24c-14.61333333 0-26.34666667-11.84-26.34666667-26.34666666 0-14.61333333 11.84-26.34666667 26.34666667-26.34666667h388.26666667V223.14666666H253.54666667V378.66666666c0 6.82666667-2.66666667 13.44-7.57333334 18.34666667-4.8 4.90666667-11.41333333 7.57333333-18.24 7.57333333h-0.96c-6.82666667 0-13.44-2.77333333-18.34666666-7.57333333-4.90666667-4.90666667-7.57333333-11.41333333-7.57333334-18.34666667V194.34666666c0-14.29333333 11.62666667-25.81333333 25.92-25.81333333h723.84l0.74666667 0.10666667 0.74666667-0.10666667c13.97333333 0 25.38666667 11.41333333 25.38666666 25.38666667v485.65333333c-0.10666667 14.08-11.41333333 25.49333333-25.49333333 25.49333333zM434.56 459.09333333h0.53333333c14.29333333 0 25.81333333 11.62666667 25.81333334 25.81333333v248.85333334c0 14.29333333-11.52 25.81333333-25.81333334 25.81333333H73.06666667l-0.74666667-0.10666667-0.74666667 0.10666667c-6.72 0-13.22666667-2.66666667-18.02666666-7.46666667-4.8-4.8-7.46666667-11.2-7.46666667-18.02666666v-249.6c0-14.08 11.41333333-25.38666667 25.38666667-25.38666667l0.42666666 0.10666667 0.42666667-0.10666667h362.24z m-26.34666667 52.69333333H97.17333333V705.06666666h311.04V511.78666666zM202.24 812.37333333h100.90666667c14.82666667 0 26.88 12.05333333 26.88 26.88v0.85333333c0 14.82666667-12.05333333 26.88-26.88 26.88h-100.90666667c-7.14666667 0-13.97333333-2.88-18.98666667-7.89333333-5.01333333-5.01333333-7.89333333-11.84-7.78666666-18.98666667v-0.85333333c-0.10666667-14.82666667 11.84-26.88 26.77333333-26.88z m336-52.8h154.56c14.61333333 0 26.34666667 11.84 26.34666667 26.34666667s-11.84 26.34666667-26.34666667 26.34666666H538.24c-14.61333333 0-26.34666667-11.84-26.34666667-26.34666666s11.73333333-26.34666667 26.34666667-26.34666667z m0 0'
						fill='currentColor'
					/>
					{isSharingScreen !== -props.userId && (
						<path d='M 0 0 l 1024 1024' stroke='red' strokeWidth='3em' fill='none' />
					)}
				</svg>
			)}
			{..._props}
		/>
	);

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
			props.sfu.on('addScreenShare', (id: number, stream: MediaStream) => {
				setMainVideo({
					stream,
					streamName: `${allMembers.get(-id)}的屏幕共享`,
				});
				setIsSharingScreen(id);
			});
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
			props.sfu.on('removeScreenShare', (id: number) => {
				const stream = members.get(props.userId)?.stream;
				setMainVideo({
					stream: stream as MediaStream,
					streamName: `${allMembers.get(props.userId)}`,
				});
				setIsSharingScreen(0);
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
				props.sfu.removeAllListeners('addRemoteStream');
				props.sfu.removeAllListeners('addScreenShare');
				props.sfu.removeAllListeners('removeRemoteStream');
				props.sfu.removeAllListeners('removeScreenShare');
				props.sfu.removeAllListeners('onNewMemberJoin');
				props.sfu.removeAllListeners('onJoinSuccess');
			};
		}
	}, [props.sfu]);
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
							icon={<MicroPhoneIcon />}
							text={isUsingMicroPhone ? '静音' : '解除静音'}
							title={isUsingMicroPhone ? '静音' : '解除静音'}
							onClick={() => {
								setIsUsingMicroPhone(!isUsingMicroPhone);
							}}
						/>,
						<ToolButton
							icon={<CameraIcon />}
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
							icon={<ShareScreenIcon />}
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
