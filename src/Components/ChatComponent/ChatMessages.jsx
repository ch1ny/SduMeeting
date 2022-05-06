import { HistoryOutlined } from '@ant-design/icons';
import { Avatar, Button, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { wsAjax } from 'Utils/Axios/Axios';
import {
	A_MINUTE_TIME,
	decodeJWT,
	isSameDay,
	isSameWeek,
	isSameYear,
	translateDayNumberToDayChara,
} from 'Utils/Global';
import { GET_MORE_MESSAGE_HISTORY, setMessageHistory } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './ChatMessages.scss';
import { emojiRegExp } from './emoji';

export default function ChatMessages(props) {
	const [messages, setMessages] = useState(new Array());
	useEffect(() => {
		setMessages(store.getState().messageHistory[`${props.id}`] || new Array());
		return store.subscribe(() => {
			setMessages(store.getState().messageHistory[`${props.id}`] || new Array());
		});
	}, [props.id]);

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

	const [gettingHistoryMessage, setGettingHistoryMessage] = useState(false);

	return (
		<>
			<Button
				type='link'
				icon={<HistoryOutlined />}
				loading={gettingHistoryMessage}
				onClick={() => {
					// NOTE: 查询历史消息
					setGettingHistoryMessage(true);
					wsAjax
						.get('/getHistoryMessage', {
							toId: props.id,
							messageId: messages && messages[0] ? messages[0].id : undefined,
						})
						.then((res) => {
							if (res.code === 200) {
								const { list } = res.data;
								if (list.length === 0)
									message.warn({
										content: '没有更早的消息了',
									});
								else
									for (const message of list) {
										message.chatId = props.id;
										store.dispatch(
											setMessageHistory(GET_MORE_MESSAGE_HISTORY, message)
										);
									}
							}
						})
						.finally(() => {
							setGettingHistoryMessage(false);
						});
				}}>
				查看更多消息
			</Button>
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
				return `${translateDayNumberToDayChara(messageTime)} ${messageTime}`;
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
