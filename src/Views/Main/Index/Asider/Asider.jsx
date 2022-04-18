import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge } from 'antd';
import classNames from 'classnames';
import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export default function Asider(props) {
	const [userId, setUserId] = useState(undefined);
	const [userName, setUserName] = useState(undefined);
	const [profile, setProfile] = useState(undefined);
	useEffect(() => {
		window.ipcRenderer.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken) => {
			store.dispatch(setAuthToken(authToken));
			const { username, id, profile } = jwtDecode(authToken);
			setUserId(id);
			setUserName(username);
			setProfile(
				profile
					? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?${Date.now()}`
					: profile
			);
		});
	}, []);

	useEffect(
		() =>
			store.subscribe(() => {
				const { profile, id } = jwtDecode(store.getState().authToken);
				setProfile(
					profile
						? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?${Date.now()}`
						: profile
				);
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
					<Badge dot>
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
					<Badge dot>
						<TeamOutlined className='tab' />
					</Badge>
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
					<Badge dot>
						<UserOutlined className='tab' />
					</Badge>
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
