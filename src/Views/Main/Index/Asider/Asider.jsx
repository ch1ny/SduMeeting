import { ContactsFilled, MediumCircleFilled, MessageFilled } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export default function Asider(props) {
	const [onlineStatus, setOnlineStatus] = useState(undefined);
	useEffect(() => {
		const onlineStatus = localStorage.getItem('onlineStatus');
		setOnlineStatus(onlineStatus === null ? 1 : parseInt(onlineStatus));
	}, []);

	const [userName, setUserName] = useState(undefined);
	useEffect(() => {
		window.ipcRenderer.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken) => {
			store.dispatch(setAuthToken(authToken));
			setUserName(jwtDecode(authToken).username);
		});
	}, []);

	return (
		<div className='tabbar'>
			<div className='avatarContainer'>
				<Dropdown
					overlay={
						<Menu
							style={{ width: '5rem' }}
							onClick={({ key }) => {
								const newStatus = parseInt(key);
								if (onlineStatus !== newStatus) {
									setOnlineStatus(newStatus);
									localStorage.setItem('onlineStatus', newStatus);
								}
							}}>
							<Menu.Item key={1} style={{ fontSize: '0.75rem' }}>
								<Badge dot color='green' />
								在线
							</Menu.Item>
							<Menu.Item key={2} style={{ fontSize: '0.75rem' }}>
								<Badge dot color='gold' />
								离开
							</Menu.Item>
							<Menu.Item key={3} style={{ fontSize: '0.75rem' }}>
								<Badge dot color='red' />
								忙碌
							</Menu.Item>
							<Menu.Item key={0} style={{ fontSize: '0.75rem' }}>
								<Badge dot color='#c3c3c3' />
								隐身
							</Menu.Item>
						</Menu>
					}
					trigger={['click']}>
					<Badge
						dot
						color={computeOnlineStatusColor(onlineStatus)}
						style={{ transition: '500ms' }}>
						<Avatar
							shape='square'
							size={40}
							style={{
								backgroundColor: '#0bacff',
							}}>
							{userName}
						</Avatar>
					</Badge>
				</Dropdown>
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
						<MessageFilled className='tab' />
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
						<ContactsFilled className='tab' />
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
						<MediumCircleFilled className='tab' />
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
