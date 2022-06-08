import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { CALL_STATUS_CALLING } from 'Utils/Constraints';
import store from 'Utils/Store/store';
import ChatInput from '../ChatInput/ChatInput';
import ChatMessages from '../ChatMessages/ChatMessages';
import ChatVideo from '../ChatVideo/ChatVideo';
import './style.scss';

interface ChatMainContainerProps {
	id: number;
	username: string;
	profile: string | false;
}

export function ChatMainContainer(props: ChatMainContainerProps) {
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

	return (
		<>
			<div id='chatMainComponent'>
				<ChatVideo onVideo={onVideo} />
				<div
					className={classNames({
						textChats: true,
						onVideo,
					})}>
					<ChatMessages
						id={props.id}
						username={props.username}
						profile={props.profile}
						onVideo={onVideo}
					/>
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
