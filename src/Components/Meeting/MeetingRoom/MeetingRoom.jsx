import Icon, {
	CaretDownOutlined,
	CaretUpOutlined,
	CopyOutlined,
	DisconnectOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	LeftOutlined,
} from '@ant-design/icons';
import { Button, message, Modal } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import { getDeviceStream } from 'Utils/Global';
import { usePrevious } from 'Utils/MyHooks/MyHooks';
import { DEVICE_TYPE } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import MeetingMember from './MeetingMember/MeetingMember';
import './style.scss';

export default function MeetingRoom(props) {
	const [allMembers, setAllMembers] = useState(new Map());
	useEffect(() => {
		setAllMembers(new Map(allMembers.set(props.userId, props.joinName)));
	}, []);
	useEffect(() => {
		console.log('++新状态++');
		console.log(allMembers);
	}, [allMembers]);

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
	const MicroPhoneIcon = (props) => (
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
		localStorage.setItem('autoOpenMicroPhone', isUsingMicroPhone);
		if (localStream) {
			const track = localStream.getAudioTracks()[0];
			if (track) {
				track.enabled = isUsingMicroPhone;
			}
			setTrackEnableStatus(props.sfu.sender, 'audio', isUsingMicroPhone);
		}
	}, [isUsingMicroPhone]);

	const [isUsingCamera, setIsUsingCamera] = useState(props.autoOpenCamera);
	const CameraIcon = (props) => (
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
		localStorage.setItem('autoOpenCamera', isUsingCamera);
		if (localStream) {
			const track = localStream.getVideoTracks()[0];
			if (track) {
				track.enabled = isUsingCamera;
				localPlayedStream.getVideoTracks()[0].enabled = isUsingCamera;
			}
			setTrackEnableStatus(props.sfu.sender, 'video', isUsingCamera);
		}
	}, [isUsingCamera]);

	const videoRef = useRef();
	const [localStream, setLocalStream] = useState(new MediaStream());
	const [localPlayedStream, setLocalPlayedStream] = useState(undefined);
	useEffect(() => {
		/**
		 * INFO: 进入画中画模式
		 */
		const _requestPictureInPicture = () => {
			videoRef.current.requestPictureInPicture();
		};
		eventBus.on('MAIN_WINDOW_MINIMIZE', _requestPictureInPicture);
		/**
		 * INFO: 退出画中画模式
		 */
		const _exitPictureInPicture = () => {
			document.exitPictureInPicture();
		};
		videoRef.current.addEventListener('enterpictureinpicture', function () {
			window.ipc.once('MAIN_WINDOW_RESTORE', _exitPictureInPicture);
		});
		videoRef.current.addEventListener('leavepictureinpicture', function () {
			window.ipc.send('MAIN_WINDOW_RESTORE');
			window.ipc.removeListener('MAIN_WINDOW_RESTORE', _exitPictureInPicture);
		});
		return () => {
			eventBus.off('MAIN_WINDOW_MINIMIZE', _requestPictureInPicture);
		};
	}, []);

	const [videoTrack, setVideoTrack] = useState(null);
	const prevVideoTrack = usePrevious(videoTrack);
	useEffect(() => {
		if (videoTrack) {
			if (prevVideoTrack) {
				replaceRemoteTrack(props.sfu.sender.pc.getSenders(), prevVideoTrack, videoTrack);
				localPlayedStream.removeTrack(localPlayedStream.getVideoTracks()[0]);
				localPlayedStream.addTrack(videoTrack);
			} else localStream.addTrack(videoTrack);
			if (localStreamStatus !== 3) {
				setLocalStreamStatus(localStream.getTracks().length);
			}
		}
	}, [videoTrack]);

	const [audioTrack, setAudioTrack] = useState(null);
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
		(async () => {
			if (!usingVideoDevice) return;
			const stream = await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE);
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
			videoRef.current.srcObject = clonedStream;
			setMembers(new Map(members.set(props.userId, { stream: clonedStream })));
		})();
	}, [usingVideoDevice]);

	useEffect(() => {
		(async () => {
			if (!usingAudioDevice) return;
			const stream = await getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE);
			const track = stream.getAudioTracks()[0];
			track.enabled = isUsingMicroPhone;
			setAudioTrack(track);
		})();
	}, [usingAudioDevice]);

	// INFO: 用来判断用户列表是否超出高度
	const [memberHeight, setMemberHeight] = useState(0);
	const [memberScrollHeight, setMemberScrollHeight] = useState(0);
	const [memberScrollTop, setMemberScrollTop] = useState(0);
	const scrollMembersRef = useRef();
	useEffect(() => {
		setMemberHeight(scrollMembersRef.current.clientHeight);
		setMemberScrollHeight(scrollMembersRef.current.scrollHeight);
	}, []);

	/**
	 * NOTE: WebRTC 控制部分
	 */
	const [members, setMembers] = useState(new Map());
	useEffect(() => {
		setMemberHeight(scrollMembersRef.current.clientHeight);
		setMemberScrollHeight(scrollMembersRef.current.scrollHeight);
		setMemberScrollTop(scrollMembersRef.current.scrollTop);
	}, [members]);
	const [localStreamStatus, setLocalStreamStatus] = useState(0);
	useEffect(() => {
		if (props.sfu) {
			props.sfu.on('addRemoteStream', (id, stream) => {
				setMembers(new Map(members.set(id, { stream })));
			});
			props.sfu.on('removeRemoteStream', (id, stream) => {
				members.delete(id);
				setMembers(new Map(members));
			});
			props.sfu.on('onNewMemberJoin', (newMember) => {
				console.log('===onNewMemberJoin===');
				setAllMembers(new Map(allMembers.set(newMember.id, newMember.name)));
			});
			props.sfu.on('onJoinSuccess', (nowAllMembers) => {
				console.log('===onJoinSuccess===');
				const ids = Object.keys(nowAllMembers);
				for (const id of ids) {
					allMembers.set(Number(id), nowAllMembers[`${id}`].name);
				}
				setAllMembers(new Map(allMembers));
			});
		}
	}, [props.sfu]);
	useEffect(() => {
		if (localStreamStatus === 2) {
			props.sfu.publish(localStream);
			setLocalStreamStatus(3);
		}
	}, [localStreamStatus]);

	const [isFullScreen, setIsFullScreen] = useState(false);
	const fullScreenRef = useRef();
	useEffect(() => {
		fullScreenRef.current.addEventListener('fullscreenchange', () => {
			const isFullScreen = document.fullscreenElement !== null;
			setIsFullScreen(isFullScreen);
			window.ipc.send('MAIN_WINDOW_FULL_SCREEN', isFullScreen);
		});
	}, []);

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
			<div id={`videoContainer${isFullScreen ? 'FullScreen' : ''}`} ref={fullScreenRef}>
				<div id='mainBox'>
					<div id='mainVideo'>
						<video
							id='video'
							width='100%'
							height='100%'
							autoPlay={true}
							ref={videoRef}
							// TODO: 这里未来改为有人分享屏幕时解除静音
							// muted={localStream === videoRef.current?.srcObject}
							muted={true}
						/>
					</div>
					<div id='members'>
						{memberScrollHeight > memberHeight && memberScrollTop > 0 && (
							<div
								className='scrollButton'
								onClick={() => {
									scrollMembersRef.current.scrollTop -= 50;
								}}>
								<CaretUpOutlined />
							</div>
						)}
						<div
							id='membersList'
							onScroll={() => {
								setMemberHeight(scrollMembersRef.current.clientHeight);
								setMemberScrollHeight(scrollMembersRef.current.scrollHeight);
								setMemberScrollTop(scrollMembersRef.current.scrollTop);
								console.log(
									memberHeight.toFixed(1),
									memberScrollHeight.toFixed(1),
									memberScrollTop.toFixed(1)
								);
							}}
							onDoubleClick={(e) => {
								if (e.target.className === 'meetingMemberVideo') {
									videoRef.current.srcObject = e.target.srcObject;
								}
							}}
							ref={scrollMembersRef}>
							{(function () {
								const membersArr = [];
								for (const [key, value] of members) {
									membersArr.push(
										<MeetingMember
											key={key}
											stream={value.stream}
											member={allMembers.get(key)}
											muted={localPlayedStream === value.stream}
										/>
									);
								}
								return membersArr;
							})()}
						</div>
						{memberScrollHeight > memberHeight &&
							memberHeight + memberScrollTop < memberScrollHeight && (
								<div
									className='scrollButton'
									onClick={() => {
										scrollMembersRef.current.scrollTop += 50;
									}}>
									<CaretDownOutlined />
								</div>
							)}
					</div>
				</div>
				<div id='toolbar'>
					<ToolButton
						icon={<MicroPhoneIcon />}
						text={isUsingMicroPhone ? '静音' : '解除静音'}
						title={isUsingMicroPhone ? '静音' : '解除静音'}
						onClick={() => {
							setIsUsingMicroPhone(!isUsingMicroPhone);
						}}
					/>
					<ToolButton
						icon={<CameraIcon />}
						text={isUsingCamera ? '停止视频' : '开启视频'}
						title={isUsingCamera ? '停止视频' : '开启视频'}
						onClick={() => {
							setIsUsingCamera(!isUsingCamera);
						}}
					/>
					<ToolButton
						icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
						text={isFullScreen ? '退出全屏' : '全屏模式'}
						title={isFullScreen ? '退出全屏' : '全屏模式'}
						onClick={() => {
							if (isFullScreen) {
								document.exitFullscreen();
							} else {
								fullScreenRef.current.requestFullscreen();
							}
						}}
					/>
				</div>
			</div>
		</>
	);
}

function ToolButton(props) {
	return (
		<>
			<div className='mettingRoom_toolButton' onClick={props.onClick} title={props.title}>
				<div className='mettingRoom_toolButton_icon'>{props.icon}</div>
				<div className='mettingRoom_toolButton_text'>{props.text}</div>
			</div>
		</>
	);
}

/**
 * 设置远程轨道的 enabled
 * @param {*} sender
 * @param {*} type
 * @param {*} enabled
 */
function setTrackEnableStatus(_sender, type, enabled) {
	if (_sender) {
		const senders = _sender.pc.getSenders();
		for (const sender of senders) {
			if (sender.track.kind === type) {
				sender.track.enabled = enabled;
				return;
			}
		}
	}
}

/**
 * 更换新的流轨道
 * @param {*} senders
 * @param {*} oldTrack
 * @param {*} newTrack
 */
function replaceRemoteTrack(senders, oldTrack, newTrack) {
	for (const sender of senders) {
		if (sender.track === oldTrack) {
			sender.replaceTrack(newTrack);
			break;
		}
	}
}
