import { DeleteOutlined } from '@ant-design/icons';
import Avatar from 'antd/lib/avatar';
import Badge from 'antd/lib/badge';
import Dropdown from 'antd/lib/dropdown';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import React, { CSSProperties, useEffect, useState } from 'react';
import { isSameDay, isSameWeek, isSameYear, translateDayNumberToDayChara } from 'Utils/Global';
import { setNowChattingId } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

interface FriendBubbleProps {
	style?: CSSProperties;
	id: number;
	onRemoveFriend: (friendId: number) => void;
	unreadNumber: number;
	profile: false | string;
	username: string;
}

export default function FriendBubble(props: FriendBubbleProps) {
	const [latestMessage, setLatestMessage] = useState(
		((store.getState().messageHistory as any)[`${props.id}`] || []).slice(-1)[0]
	);

	useEffect(() => {
		return store.subscribe(() => {
			const messageHistory = (store.getState().messageHistory as any)[`${props.id}`] || [{}];
			setLatestMessage(messageHistory.slice(-1)[0]);
		});
	}, []);

	return (
		<Dropdown
			overlay={
				<Menu
					items={[
						{
							label: '移除好友',
							key: 'DELETE_FRIEND',
							icon: <DeleteOutlined />,
							onClick: () => {
								Modal.confirm({
									title: '删除好友',
									content: `您确定要将 ${props.username} 从您的好友列表中删除吗？`,
									cancelText: '取消',
									okText: '确认',
									okButtonProps: {
										danger: true,
									},
									onOk: () => {
										props.onRemoveFriend(props.id);
									},
								});
							},
						},
					]}
				/>
			}
			trigger={['contextMenu']}>
			<div
				className='friendBubbles'
				onClick={() => {
					store.dispatch(setNowChattingId(props.id));
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
					<div className='newestMessage'>
						{latestMessage ? latestMessage.message : ''}
					</div>
				</div>
				<div className='rightDiv'>
					<div className='newestMessageTime'>
						{latestMessage ? dateToTime(latestMessage.date) : '无消息'}
					</div>
					<Badge count={props.unreadNumber} size='small' />
				</div>
			</div>
		</Dropdown>
	);
}

function dateToTime(date: string | number | Date) {
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
					const messageMonth = messageDate.getMonth() + 1;
					const messageDay = messageDate.getDate();
					return `${messageMonth}-${messageDay}`;
				} else {
					const messageYear = messageDate.getFullYear();
					const messageMonth = messageDate.getMonth() + 1;
					const messageDay = messageDate.getDate();
					return `${messageYear}-${messageMonth}-${messageDay}`;
				}
		}
	}
}
