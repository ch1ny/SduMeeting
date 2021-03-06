import { AlertOutlined, LogoutOutlined, QuestionCircleFilled } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Modal from 'antd/lib/modal';
import Tooltip from 'antd/lib/tooltip';
import React, { useEffect, useState } from 'react';
import { getMainContent } from 'Utils/Global';
import { eWindow } from 'Utils/Types';

export default function General() {
	const [autoLogin, setAutoLogin] = useState(localStorage.getItem('autoLogin') === 'true');
	const [autoOpen, setAutoOpen] = useState(false);
	const [securityPrivateWebrtc, setSecurityPrivateWebrtc] = useState(
		localStorage.getItem('securityPrivateWebrtc') === 'true'
	);
	const [gpuAcceleration, setGPUAcceleration] = useState(
		localStorage.getItem('gpuAcceleration') !== 'false'
	);
	useEffect(() => {
		eWindow.ipc.invoke('GET_OPEN_AFTER_START_STATUS').then((status: boolean) => {
			setAutoOpen(status);
		});
	}, []);

	return (
		<>
			<div>
				<Checkbox
					checked={autoLogin}
					onChange={(e) => {
						setAutoLogin(e.target.checked);
						localStorage.setItem('autoLogin', `${e.target.checked}`);
					}}>
					自动登录
				</Checkbox>
			</div>
			<div>
				<Checkbox
					checked={autoOpen}
					onChange={(e) => {
						setAutoOpen(e.target.checked);
						eWindow.ipc.send('EXCHANGE_OPEN_AFTER_START_STATUS', e.target.checked);
					}}>
					开机时启动
				</Checkbox>
			</div>
			<div style={{ display: 'flex' }}>
				<Checkbox
					checked={securityPrivateWebrtc}
					onChange={(e) => {
						if (e.target.checked) {
							Modal.confirm({
								icon: <AlertOutlined />,
								content:
									'开启加密会大幅度提高客户端的CPU占用，请再三确认是否需要开启该功能！',
								cancelText: '暂不开启',
								okText: '确认开启',
								onCancel: () => {},
								onOk: () => {
									setSecurityPrivateWebrtc(true);
									localStorage.setItem('securityPrivateWebrtc', `${true}`);
								},
							});
						} else {
							setSecurityPrivateWebrtc(false);
							localStorage.setItem('securityPrivateWebrtc', `${false}`);
						}
					}}>
					私人加密通话
				</Checkbox>
				<Tooltip placement='right' overlay={'开启加密会大幅度提高CPU占用'}>
					<QuestionCircleFilled style={{ color: 'gray', transform: 'translateY(25%)' }} />
				</Tooltip>
			</div>
			<div style={{ display: 'flex' }}>
				<Checkbox
					checked={gpuAcceleration}
					onChange={(e) => {
						setGPUAcceleration(e.target.checked);
						localStorage.setItem('gpuAcceleration', `${e.target.checked}`);
					}}>
					视频硬件加速
				</Checkbox>
				<Tooltip placement='right' overlay={'加密通话时不会启用GPU加速'}>
					<QuestionCircleFilled style={{ color: 'gray', transform: 'translateY(25%)' }} />
				</Tooltip>
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
								eWindow.ipc.send('LOG_OUT');
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
