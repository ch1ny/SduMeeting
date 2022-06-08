import { HistoryOutlined } from '@ant-design/icons';
import Avatar from 'antd/lib/avatar';
import Button from 'antd/lib/button';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import {
	A_MINUTE_TIME,
	decodeJWT,
	isSameDay,
	isSameWeek,
	isSameYear,
	translateDayNumberToDayChara,
} from 'Utils/Global';
import { globalMessage } from 'Utils/GlobalMessage/GlobalMessage';
import { GET_MORE_MESSAGE_HISTORY, setMessageHistory } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { emojiRegExp } from '../emoji';

interface ChatMessagesProps {
	id: number;
	onVideo: boolean;
	username: string;
	profile: string | false;
}

export default function ChatMessages(props: ChatMessagesProps) {
	const [messages, setMessages] = useState(new Array());
	useEffect(() => {
		setMessages(store.getState().messageHistory[`${props.id}`] || new Array());
		return store.subscribe(() => {
			setMessages(store.getState().messageHistory[`${props.id}`] || new Array());
		});
	}, [props.id]);

	const [myId, setMyId] = useState(0);
	const [myName, setMyName] = useState('');
	const [myProfile, setMyProfile] = useState<string | false>(false);
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

	const [onVideo, setOnVideo] = useState(props.onVideo);
	useEffect(() => {
		setOnVideo(props.onVideo);
	}, [props.onVideo]);
	const [avatars, setAvatars] = useState<any>([undefined, undefined]);
	useEffect(() => {
		if (props.onVideo) {
			setAvatars([
				<div className='avatarTextDiv'>{myName}</div>,
				<div className='avatarTextDiv'>{props.username}</div>,
			]);
		} else {
			setAvatars([
				<Avatar
					shape='circle'
					src={
						myProfile
							? `http://meeting.aiolia.top:8080/file/pic/user/${myId}.${myProfile}`
							: undefined
					}>
					{myName}
				</Avatar>,
				<Avatar
					shape='circle'
					src={
						props.profile
							? `http://meeting.aiolia.top:8080/file/pic/user/${props.id}.${props.profile}`
							: undefined
					}>
					{props.username}
				</Avatar>,
			]);
		}
	}, [props.username, props.id, props.profile, props.onVideo, myProfile]);

	const scrollRef = useRef<HTMLDivElement>(null);
	const [prevScrollHeight, setPrevScrollHeight] = useState(0);
	useEffect(() => {
		// NOTE: 调节滚动条位置
		const msgsDiv = scrollRef.current as HTMLDivElement;
		const { scrollHeight, clientHeight, scrollTop } = msgsDiv;
		// NOTE: 偏差值设为 1
		if (prevScrollHeight > clientHeight && clientHeight + scrollTop + 1 >= prevScrollHeight) {
			msgsDiv.scrollTop = scrollHeight - clientHeight;
		}
		setPrevScrollHeight(scrollHeight);
	}, [messages]);

	return (
		<div id='chatMessages' ref={scrollRef}>
			<Button
				type='link'
				className='moreMessagesButton'
				icon={<HistoryOutlined />}
				loading={gettingHistoryMessage}
				onClick={() => {
					// NOTE: 查询历史消息
					setGettingHistoryMessage(true);
					ajax.get('/chat/getHistoryMessage', {
						toId: props.id,
						messageId: messages && messages[0] ? messages[0].id : undefined,
					})
						.then((res) => {
							if (res.code === 200) {
								const { list } = res.data;
								if (list.length === 0)
									globalMessage.warn({
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
							amISender={true}
							translate={!onVideo}
							avatar={avatars[0]}
						/>
					) : (
						<ChatMessage
							message={message.message}
							amISender={false}
							translate={!onVideo}
							avatar={avatars[1]}
						/>
					)}
				</React.Fragment>
			))}
		</div>
	);
}

interface ChatMessageProps {
	avatar: React.ReactNode;
	amISender: boolean;
	translate: boolean;
	message: string;
}

function ChatMessage(props: ChatMessageProps) {
	const classname = classNames({
		chatMessageContainer: true,
		[`chatMessage${props.amISender ? 'Self' : 'Others'}`]: true,
	});

	const messageContainer = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const messageContainerDOM = messageContainer.current as HTMLDivElement;
		if (props.translate) messageContainerDOM.innerHTML = messageFormatter(props.message);
		else messageContainerDOM.innerText = props.message;
	}, [props.translate]);

	return (
		<div className={classname}>
			{props.avatar}
			<div ref={messageContainer} className='chatMessageBubbles' />
		</div>
	);
}

function messageFormatter(message: string) {
	return message
		.replace(/<.*?>/gim, '')
		.replace(emojiRegExp, `<img class="emoji" src="./emoji/$2.png">`);
}

function dateToTime(date: string | number | Date) {
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
				return `${translateDayNumberToDayChara(messageDate.getDay())} ${messageTime}`;
			default:
				if (isSameYear(date, now)) {
					const messageMonth = messageDate.getMonth() + 1;
					const messageDay = messageDate.getDate();
					return `${messageMonth}月${messageDay}日 ${messageTime}`;
				} else {
					const messageYear = messageDate.getFullYear();
					const messageMonth = messageDate.getMonth() + 1;
					const messageDay = messageDate.getDate();
					return `${messageYear}年${messageMonth}月${messageDay}日 ${messageTime}`;
				}
		}
	}
}
