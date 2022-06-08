import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import Avatar from 'antd/lib/avatar';
import Badge from 'antd/lib/badge';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { decodeJWT } from 'Utils/Global';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';
import './style.scss';

interface AsiderProps {
	tabOnClick: React.Dispatch<React.SetStateAction<number>>;
	selectedTab: number;
}

export default function Asider(props: AsiderProps) {
	const [userName, setUserName] = useState('');
	const [profile, setProfile] = useState<string | false>(false);
	useEffect(() => {
		eWindow.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken: string) => {
			store.dispatch(setAuthToken(authToken));
			const { username, iat, id, profile } = decodeJWT(authToken);
			setUserName(username);
			setProfile(
				profile
					? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?iat=${iat}`
					: profile
			);
		});
	}, []);

	const [unreadMessagesNumber, setUnreadMessagesNumber] = useState(0);
	useEffect(
		() =>
			store.subscribe(() => {
				const state = store.getState();
				if (!state.authToken) return;
				const { profile, iat, id } = decodeJWT(state.authToken);
				// INFO: 通过追加 params 实现刷新图片缓存
				setProfile(
					profile
						? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}?iat=${iat}`
						: profile
				);
				let unreadNum = 0;
				for (const key in state.unreadMessages) {
					if (Object.hasOwnProperty.call(state.unreadMessages, key)) {
						unreadNum +=
							state.unreadMessages[key as keyof typeof state.unreadMessages].length;
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
					})}>
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
					})}>
					<TeamOutlined className='tab' />
				</div>
				<div
					onClick={() => {
						props.tabOnClick(2);
					}}
					className={classNames({
						tabDiv: true,
						selected: props.selectedTab === 2,
					})}>
					<UserOutlined className='tab' />
				</div>
			</div>
		</div>
	);
}
