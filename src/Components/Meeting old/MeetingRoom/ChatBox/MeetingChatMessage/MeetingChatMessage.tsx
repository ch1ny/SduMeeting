import React from 'react';
import './style.scss';

interface MeetingChatMessageProps {
	sender: string;
	message: string;
}

export default function MeetingChatMessage(props: MeetingChatMessageProps) {
	return (
		<div className='meetingChatMessage'>
			<div className='meetingChatMessageSender'>
				<span>{props.sender}</span> 说:
			</div>
			<div className='meetingChatMessageContent'>{props.message}</div>
		</div>
	);
}
