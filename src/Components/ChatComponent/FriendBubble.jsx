import { Avatar, Badge } from 'antd';
import React, { useEffect, useState } from 'react';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import { CHAT_READ_MESSAGE } from 'Utils/Constraints';
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
				return `昨天 ${messageTime}`;
			case 2:
				return `前天 ${messageTime}`;
			case 3:
			case 4:
			case 5:
			case 6:
				return `${messageTime}`;
			default:
				if (isSameYear(date, now)) {
					const messageMonth = messageDate.getMonth();
					const messageDay = messageDate.getDay();
					return `${messageMonth}月${messageDay}日`;
				} else {
					const messageYear = messageDate.getFullYear();
					const messageMonth = messageDate.getMonth();
					const messageDay = messageDate.getDay();
					return `${messageYear}年${messageMonth}月${messageDay}日`;
				}
		}
	}
}

const A_SECOND_TIME = 1000;
const A_MINUTE_TIME = 60 * A_SECOND_TIME;
const AN_HOUR_TIME = 60 * A_MINUTE_TIME;
const A_DAY_TIME = 24 * AN_HOUR_TIME;

function isSameDay(timeStampA, timeStampB) {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	return dateA.setHours(0, 0, 0, 0) === dateB.setHours(0, 0, 0, 0);
}

function isSameWeek(timeStampA, timeStampB) {
	let A = new Date(timeStampA).setHours(0, 0, 0, 0);
	let B = new Date(timeStampB).setHours(0, 0, 0, 0);
	const timeDistance = Math.abs(A - B);
	return timeDistance / A_DAY_TIME;
}

function isSameYear(timeStampA, timeStampB) {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	dateA.setHours(0, 0, 0, 0);
	dateB.setHours(0, 0, 0, 0);
	dateA.setMonth(0, 1);
	dateB.setMonth(0, 1);
	return dateA.getFullYear() === dateB.getFullYear();
}
