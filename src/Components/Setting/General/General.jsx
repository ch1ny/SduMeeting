import { LogoutOutlined } from '@ant-design/icons';
import { Button, Checkbox, Modal } from 'antd';
import React, { useState } from 'react';
import { getMainContent } from 'Utils/Global';

export default function General() {
	const [autoLogin, setAutoLogin] = useState(localStorage.getItem('autoLogin') === 'true');
	const [autoOpen, setAutoOpen] = useState(localStorage.getItem('autoOpen') === 'true');

	return (
		<>
			<div>
				<Checkbox
					checked={autoLogin}
					onChange={(e) => {
						setAutoLogin(e.target.checked);
						localStorage.setItem('autoLogin', e.target.checked);
					}}>
					自动登录
				</Checkbox>
			</div>
			<div>
				<Checkbox
					checked={autoOpen}
					onChange={(e) => {
						setAutoOpen(e.target.checked);
						localStorage.setItem('autoOpen', e.target.checked);
						window.ipc.send('EXCHANGE_OPEN_AFTER_START', e.target.checked);
					}}>
					开机时启动
				</Checkbox>
			</div>
			<div style={{ marginTop: '5px' }}>
				<Button
					icon={<LogoutOutlined />}
					danger
					type='primary'
					onClick={() => {
						Modal.confirm({
							title: '注销',
							content: '你确定要退出当前用户登录吗？',
							icon: <LogoutOutlined />,
							cancelText: '取消',
							okText: '确认',
							okButtonProps: {
								danger: true,
							},
							onOk: () => {
								window.ipc.send('LOG_OUT');
							},
							getContainer: getMainContent,
						});
					}}>
					退出登录
				</Button>
			</div>
		</>
	);
}
