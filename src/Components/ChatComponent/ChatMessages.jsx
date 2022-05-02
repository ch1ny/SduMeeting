import { Avatar } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { decodeJWT } from 'Utils/Global';
import store from 'Utils/Store/store';
import './ChatMessages.scss';
import { emojiRegExp } from './emoji';

const A_SECOND_TIME = 1000;
const A_MINUTE_TIME = 60 * A_SECOND_TIME;
const AN_HOUR_TIME = 60 * A_MINUTE_TIME;
const A_DAY_TIME = 24 * AN_HOUR_TIME;

export default function ChatMessages(props) {
	const [messages, setMessages] = useState([
		{
			date: 1650678821296,
			fromId: 7,
			id: 23,
			message:
				'你好，我是德布罗煜[:doge:]ssssssssssssssssssssssssssssssssssssssssssssssssssssss',
			toId: 11,
		},
		{
			date: 1650678887404,
			fromId: 11,
			id: 24,
			message: 'hello[:hehe:]',
			toId: 10,
		},
		{
			date: 1650678888404,
			fromId: 11,
			id: 25,
			message: '<button onclick="window.close();">嵌入攻击测试</button>',
			toId: 10,
		},
	]);

	const [myId, setMyId] = useState(undefined);
	const [myName, setMyName] = useState(undefined);
	const [myProfile, setMyProfile] = useState(undefined);
	useEffect(() => {
		const { id, username, profile } = decodeJWT(store.getState().authToken);
		setMyId(id);
		setMyName(username);
		setMyProfile(profile);
		return store.subscribe(() => {
			const token = decodeJWT(store.getState().authToken);
			if (token) {
				const { id, username, profile } = token;
				setMyId(id);
				setMyName(username);
				setMyProfile(profile);
			}
		});
	}, []);

	return (
		<>
			{messages.map((message, index) => (
				<React.Fragment key={message.id}>
					{(index === 0 ||
						message.date - messages[index - 1].date > A_MINUTE_TIME * 3) && (
						<div className='dateDiv'>
							<span>{dateToTime(message.date)}</span>
						</div>
					)}
					{message.fromId === myId ? (
						<ChatMessage
							message={message.message}
							sender={message.fromId}
							amISender={true}
							avatar={
								<Avatar
									shape='round'
									src={
										myProfile
											? `http://meeting.aiolia.top:8080/file/pic/user/${myId}.${myProfile}`
											: undefined
									}>
									{myName}
								</Avatar>
							}
						/>
					) : (
						<ChatMessage
							message={message.message}
							sender={message.fromId}
							amISender={false}
							avatar={
								<Avatar
									shape='round'
									src={
										props.profile
											? `http://meeting.aiolia.top:8080/file/pic/user/${props.id}.${props.profile}`
											: undefined
									}>
									{props.username}
								</Avatar>
							}
						/>
					)}
				</React.Fragment>
			))}
		</>
	);
}

function ChatMessage(props) {
	const classname = classNames({
		chatMessageContainer: true,
		[`chatMessage${props.amISender ? 'Self' : 'Others'}`]: true,
	});

	const messageContainer = useRef();
	useEffect(() => {
		messageContainer.current.innerHTML = messageFormatter(props.message);
	}, []);

	return (
		<div className={classname}>
			{props.avatar}
			<div ref={messageContainer} className='chatMessageBubbles' />
		</div>
	);
}

function messageFormatter(message) {
	return message
		.replace(/<.*?>/gim, '')
		.replace(emojiRegExp, `<img class="emoji" src="./emoji/$2.png">`);
}

function dateToTime(date) {
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
					return `${messageMonth}月${messageDay}日 ${messageTime}`;
				} else {
					const messageYear = messageDate.getFullYear();
					const messageMonth = messageDate.getMonth();
					const messageDay = messageDate.getDay();
					return `${messageYear}年${messageMonth}月${messageDay}日 ${messageTime}`;
				}
		}
	}
}

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
