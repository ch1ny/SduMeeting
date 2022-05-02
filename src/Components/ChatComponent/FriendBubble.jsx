import { Avatar, Badge } from 'antd';
import React from 'react';
import './FriendBubble.scss';

export default function FriendBubble(props) {
	return (
		<div className='friendBubbles' onClick={props.onClick} style={props.style}>
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
				<div className='newestMessage'>您有一条新的消息请点开看看吧</div>
			</div>
			<div className='rightDiv'>
				<div className='newestMessageTime'>00:00</div>
				<Badge count={925} size='small' />
			</div>
		</div>
	);
}
