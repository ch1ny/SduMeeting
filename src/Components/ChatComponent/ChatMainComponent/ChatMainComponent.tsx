import { Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { ChatRTCContext } from 'Components/Chats/Chats';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useState } from 'react';
import { CALL_STATUS_CALLING } from 'Utils/Constraints';
import { decodeJWT } from 'Utils/Global';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';
import { ChatRTC } from '../ChatRTC';
import ChatInput from './ChatInput/ChatInput';
import ChatMessages from './ChatMessages/ChatMessages';
import './style.scss';

interface ChatMainComponentProps {
	id: number;
	username: string;
	profile: string | false;
}

export function ChatMainComponent(props: ChatMainComponentProps) {
	const [myId, setMyId] = useState(0);
	useEffect(() => {
		setMyId(decodeJWT(store.getState().authToken).id);
	}, []);

	const { callStatus, nowChattingId, nowWebrtcFriendId } = store.getState();
	const [onVideo, setOnVideo] = useState(
		callStatus === CALL_STATUS_CALLING && nowChattingId === nowWebrtcFriendId
	);
	useEffect(
		() =>
			store.subscribe(() => {
				const { callStatus, nowChattingId, nowWebrtcFriendId } = store.getState();
				setOnVideo(
					callStatus === CALL_STATUS_CALLING && nowChattingId === nowWebrtcFriendId
				);
			}),
		[]
	);

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
			}
		});
	}, []);

	return (
		<>
			<div id='chatMainComponent'>
				<div
					ref={videosRef}
					className={classNames({
						videoChatContainer: true,
						onVideo,
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
												(
													videosRef.current as HTMLDivElement
												).requestFullscreen();
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
				<div
					className={classNames({
						textChats: true,
						onVideo,
					})}>
					<div id='chatMessages'>
						<ChatMessages
							id={props.id}
							username={props.username}
							profile={props.profile}
							onVideo={onVideo}
						/>
					</div>
					<div id='chatInput'>
						<ChatInput
							nowChattingId={props.id}
							nowChattingName={props.username}
							onVideo={onVideo}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
