import Dropdown from 'antd/lib/dropdown';
import Menu from 'antd/lib/menu';
import classNames from 'classnames';
import { ChatRTCContext } from 'Components/Chats/Chats';
import React, { useEffect, useState } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import { getDesktopStream, getDeviceStream } from 'Utils/Global';
import { globalMessage } from 'Utils/GlobalMessage/GlobalMessage';
import { eWindow } from 'Utils/Types';
import { ChatRTC } from 'Utils/WebRTC/ChatRTC';
import './style.scss';

interface ChatVideoProps {
	onVideo: boolean;
}

export default function ChatVideo(props: ChatVideoProps) {
	const [isFullScreen, setIsFullScreen] = useState(false);
	const videosRef = React.useRef<HTMLDivElement>(null);
	useEffect(() => {
		(videosRef.current as HTMLDivElement).addEventListener('fullscreenchange', () => {
			const isFullScreen = document.fullscreenElement !== null;
			setIsFullScreen(isFullScreen);
			eWindow.ipc.send('MAIN_WINDOW_FULL_SCREEN', isFullScreen);
		});
	}, []);

	const remoteRef = React.useRef<HTMLVideoElement>(null);
	const localRef = React.useRef<HTMLVideoElement>(null);
	const [showLocal, setShowLocal] = useState(true);
	const [showDesktop, setShowDesktop] = useState(false);
	const chatRtc = React.useContext(ChatRTCContext) as ChatRTC;
	useEffect(() => {
		chatRtc.on('LOCAL_STREAM_READY', (stream: MediaStream) => {
			(localRef.current as HTMLVideoElement).srcObject = stream;
		});
		chatRtc.on('REMOTE_STREAM_READY', (stream: MediaStream) => {
			(remoteRef.current as HTMLVideoElement).srcObject = stream;
		});
		chatRtc.on('ICE_DISCONNECT', () => {
			if (chatRtc.sender !== undefined && chatRtc.receiver !== undefined) {
				globalMessage.warn('检测到对方可能已断开连接');
				console.log('检测到对方可能已断开连接');
			}
		});
		chatRtc.on('RTC_CONNECTION_FAILED', () => {
			if (chatRtc.sender !== undefined && chatRtc.receiver !== undefined) {
				globalMessage.warn('本次连接已断开');
				console.log('本次连接已断开');
				chatRtc.onEnded();
				setShowDesktop(false);
			}
		});
		return () => {
			chatRtc.removeAllListeners('LOCAL_STREAM_READY');
			chatRtc.removeAllListeners('REMOTE_STREAM_READY');
			chatRtc.removeAllListeners('ICE_DISCONNECT');
			chatRtc.removeAllListeners('RTC_CONNECTION_FAILED');
		};
	}, []);
	useEffect(() => {
		if (showDesktop) {
			getDesktopStream().then((stream) => {
				chatRtc.changeVideoTrack(stream.getVideoTracks()[0]);
			});
		} else {
			getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE).then((stream) => {
				chatRtc.changeVideoTrack(stream.getVideoTracks()[0]);
			});
		}
	}, [showDesktop]);

	return (
		<div
			ref={videosRef}
			className={classNames({
				videoChatContainer: true,
				onVideo: props.onVideo,
			})}>
			<Dropdown
				overlay={
					<Menu
						items={[
							{
								label: isFullScreen ? '退出全屏' : '进入全屏',
								key: 'FULL_SCREEN_SWITCHER',
								onClick: () => {
									if (isFullScreen) {
										document.exitFullscreen();
									} else {
										(videosRef.current as HTMLDivElement).requestFullscreen();
									}
								},
							},
							{
								label: showLocal ? '隐藏本地视频' : '显示本地视频',
								key: 'SHOW_LOCAL_SWITCHER',
								onClick: () => {
									setShowLocal(!showLocal);
								},
							},
							{
								label: showDesktop ? '停止共享' : '共享屏幕',
								key: 'EXCHANGE_CAMERA_OR_DESKTOP',
								onClick: () => {
									setShowDesktop(!showDesktop);
								},
							},
						]}
					/>
				}
				getPopupContainer={() => videosRef.current as HTMLDivElement}
				trigger={['contextMenu']}>
				<video id='remoteVideo' ref={remoteRef} autoPlay />
			</Dropdown>
			<video
				id='localVideo'
				className={classNames({
					hidden: !showLocal,
				})}
				ref={localRef}
				autoPlay
				muted
			/>
		</div>
	);
}
