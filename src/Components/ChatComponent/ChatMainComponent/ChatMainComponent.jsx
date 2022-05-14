import { Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { ChatRTCContext } from 'Components/Chats/Chats';
import React, { useEffect, useState } from 'react';
import { CALL_STATUS_CALLING } from 'Utils/Constraints';
import { decodeJWT } from 'Utils/Global';
import store from 'Utils/Store/store';
import ChatInput from './ChatInput/ChatInput';
import ChatMessages from './ChatMessages/ChatMessages';
import './style.scss';

export function ChatMainComponent(props) {
	const [myId, setMyId] = useState(undefined);
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
	const videosRef = React.useRef();
	useEffect(() => {
		videosRef.current.addEventListener('fullscreenchange', () => {
			const isFullScreen = document.fullscreenElement !== null;
			setIsFullScreen(isFullScreen);
			window.ipc.send('MAIN_WINDOW_FULL_SCREEN', isFullScreen);
		});
	}, []);
	const remoteRef = React.useRef();
	const localRef = React.useRef();
	const [showLocal, setShowLocal] = useState(true);
	const chatRtc = React.useContext(ChatRTCContext);
	useEffect(() => {
		chatRtc.on('LOCAL_STREAM_READY', (stream) => {
			localRef.current.srcObject = stream;
		});
		chatRtc.on('REMOTE_STREAM_READY', (stream) => {
			remoteRef.current.srcObject = stream;
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
												videosRef.current.requestFullscreen();
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
						getPopupContainer={() => videosRef.current}
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
							myId={myId}
							onVideo={onVideo}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
