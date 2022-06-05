import Button from 'antd/lib/button';
import TextArea from 'antd/lib/input/TextArea';
import React, { useState } from 'react';
import MeetingChatMessage from './MeetingChatMessage/MeetingChatMessage';
import './style.scss';

interface ChatBoxProps {
	messages: Array<{
		userId: number;
		userName: string;
		message: string;
	}>;
	sendMessage: (msgText: string) => void;
	style: React.CSSProperties;
}

export default function ChatBox(props: ChatBoxProps) {
	const [inputMessage, setInputMessage] = useState('');

	return (
		<div className='meetingChatBox' style={props.style}>
			<div className='meetingChatBoxMessages'>
				{props.messages.map((message, index) => (
					<MeetingChatMessage
						sender={message.userName}
						message={message.message}
						key={index}
					/>
				))}
			</div>
			<div className='meetingChatBoxFooter'>
				<div className='meetingChatBoxInput' style={{ height: '5rem' }}>
					<TextArea
						value={inputMessage}
						placeholder='在此输入聊天内容'
						style={{ resize: 'none' }}
						onChange={(evt) => {
							setInputMessage(evt.target.value);
						}}
					/>
				</div>
				<div className='meetingChatBoxInputButtons' style={{ height: 'calc(100% - 5rem)' }}>
					<Button
						id='send'
						type='primary'
						style={{ height: '100%' }}
						onClick={() => {
							props.sendMessage(inputMessage);
							setInputMessage('');
						}}>
						发送消息
					</Button>
				</div>
			</div>
		</div>
	);
}
