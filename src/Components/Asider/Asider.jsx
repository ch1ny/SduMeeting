import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { decodeJWT } from 'Utils/Global';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export default function Asider(props) {
	const [userName, setUserName] = useState(undefined);
	const [profile, setProfile] = useState(undefined);
	useEffect(() => {
		window.ipcRenderer.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken) => {
			store.dispatch(setAuthToken(authToken));
			const { username, id, profile } = decodeJWT(authToken);
			setUserName(username);
			setProfile(
				profile
					? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?${Date.now()}`
					: profile
			);
		});
	}, []);

	const [unreadMessagesNumber, setUnreadMessagesNumber] = useState(0);
	useEffect(
		() =>
			store.subscribe(() => {
				const state = store.getState();
				const { profile, id } = decodeJWT(state.authToken);
				// INFO: 通过追加 params 实现刷新图片缓存
				setProfile(
					profile
						? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?${Date.now()}`
						: profile
				);
				let unreadNum = 0;
				for (const key in state.unreadMessages) {
					if (Object.hasOwnProperty.call(state.unreadMessages, key)) {
						unreadNum += state.unreadMessages[key].length;
					}
				}
				setUnreadMessagesNumber(unreadNum);
			}),
		[]
	);

	return (
		<div className='tabbar'>
			<div className='avatarContainer'>
				<Avatar shape='square' size={50} src={profile} style={{ background: '#808080' }}>
					{userName}
				</Avatar>
			</div>
			<div className='tabContainer'>
				<div
					onClick={() => {
						props.tabOnClick(0);
					}}
					className={classNames({
						tabDiv: true,
						selected: props.selectedTab === 0,
					})}
					tab_id={0}>
					<Badge count={unreadMessagesNumber} size={'small'}>
						<MessageOutlined className='tab' />
					</Badge>
				</div>
				<div
					onClick={() => {
						props.tabOnClick(1);
					}}
					className={classNames({
						tabDiv: true,
						selected: props.selectedTab === 1,
					})}
					tab_id={1}>
					<TeamOutlined className='tab' />
				</div>
				<div
					onClick={() => {
						props.tabOnClick(2);
					}}
					className={classNames({
						tabDiv: true,
						selected: props.selectedTab === 2,
					})}
					tab_id={2}>
					<UserOutlined className='tab' />
				</div>
			</div>
		</div>
	);
}

/**
 * 在线状态
 * 0: 离线
 * 1: 在线
 * 2: 离开
 * 3: 忙碌
 */
function computeOnlineStatusColor(onlineStatus) {
	switch (onlineStatus) {
		case 0:
			return '#c3c3c3';
		case 1:
			return 'green';
		case 2:
			return 'gold';
		case 3:
			return 'red';
		default:
			return 'rgba(0,0,0,0)';
	}
}
