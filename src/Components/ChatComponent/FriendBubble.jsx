import { Avatar, Badge } from 'antd';
import React, { useEffect, useState } from 'react';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import { CHAT_READ_MESSAGE } from 'Utils/Constraints';
import { isSameDay, isSameWeek, isSameYear, translateDayNumberToDayChara } from 'Utils/Global';
import { REMOVE_UNREAD_MESSAGES, setUnreadMessages } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './FriendBubble.scss';

export default function FriendBubble(props) {
	const [latestMessage, setLatestMessage] = useState(
		(store.getState().messageHistory[`${props.id}`] || [{}]).slice(-1)[0]
	);

	useEffect(() => {
		return store.subscribe(() => {
			const messageHistory = store.getState().messageHistory[`${props.id}`] || [{}];
			setLatestMessage(messageHistory.slice(-1)[0]);
		});
	}, []);

	return (
		<div
			className='friendBubbles'
			onClick={() => {
				props.onClick();
				// TODO: 签收未读消息并将它们移出未读消息列表
				if (props.unreadNumber > 0) {
					invokeSocket().send({
						sender: props.id,
						type: CHAT_READ_MESSAGE,
					});
					store.dispatch(setUnreadMessages(REMOVE_UNREAD_MESSAGES, { userId: props.id }));
				}
			}}
			style={props.style}>
			<div className='avatarContainer'>
				<Avatar
					src={
						props.profile
							? `http://meeting.aiolia.top:8080/file/pic/user/${props.id}.${props.profile}`
							: undefined
					}
					size={35}>
					{props.username}
				</Avatar>
			</div>
			<div className='textContainer'>
				<div className='userName'>{props.username}</div>
				<div className='newestMessage'>{latestMessage.message}</div>
			</div>
			<div className='rightDiv'>
				<div className='newestMessageTime'>{dateToTime(latestMessage.date)}</div>
				<Badge count={props.unreadNumber} size='small' />
			</div>
		</div>
	);
}

function dateToTime(date) {
	if (!date) return '无消息';
	const messageDate = new Date(date);
	const now = Date.now();
	const messageTime = messageDate.toLocaleTimeString();
	if (isSameDay(date, now)) {
		return messageTime;
	} else {
		switch (isSameWeek(date, now)) {
			case 0:
				return messageTime;
			case 1:
				return `昨天`;
			case 2:
				return `前天`;
			case 3:
			case 4:
			case 5:
			case 6:
				return `${translateDayNumberToDayChara(messageDate.getDay())}`;
			default:
				if (isSameYear(date, now)) {
					const messageMonth = messageDate.getMonth();
					const messageDay = messageDate.getDay();
					return `${messageMonth}-${messageDay}`;
				} else {
					const messageYear = messageDate.getFullYear();
					const messageMonth = messageDate.getMonth();
					const messageDay = messageDate.getDay();
					return `${messageYear}-${messageMonth}-${messageDay}`;
				}
		}
	}
}
