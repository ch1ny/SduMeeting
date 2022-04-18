import { LoadingOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import RippleButton from 'Components/RippleButton/RippleButton';
import './App.scss';
import { Victor } from 'Components/Victor/Victor';
import { Checkbox, Form, Input, message } from 'antd';
import ajax from 'Utils/Axios/Axios';
import { LogoIcon, ShutdownIcon, MinimizeIcon, RegisterIcon } from 'Components/MyIcon/MyIcon';

export default function App() {
	message.config({
		maxCount: 1,
	});

	const ipc = window.require('electron').ipcRenderer;

	const [form] = Form.useForm();

	const lastUserId = localStorage.getItem('userId');
	const [userId, setUserId] = useState(lastUserId === 'null' ? '' : lastUserId);

	const [userPassword, setUserPassword] = useState('');
	const [rememberPassword, setRememberPassword] = useState(
		localStorage.getItem('rememberPassword') === 'true'
	);
	useEffect(() => {
		if (rememberPassword) {
			ipc.invoke('GET_LAST_PASSWORD').then((psw) => {
				form.setFieldsValue({ password: psw });
			});
		}
	}, []);

	const [rotating, setRotating] = useState(false);
	useEffect(() => {
		if (rotating) {
			mainBodyRef.current.style.animationName = 'rotateOut';
			let timeout = setTimeout(() => {
				mainBodyRef.current.style.animationName = 'rotateIn';
				setShowRegister(!showRegister);
				timeout = null;
			}, 250);
			return () => {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
			};
		}
	}, [rotating]);

	const [showRegister, setShowRegister] = useState(false);
	useEffect(() => {
		let timeout = setTimeout(() => {
			setRotating(false);
			timeout = null;
		}, 250);
		return () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
		};
	}, [showRegister]);

	const mainBodyRef = useRef();

	// 设置动态背景
	useEffect(() => {
		const victor = new Victor('header', 'canvas');
		const theme = ['#ff1324', '#ff3851'];
		victor(theme).set();
	}, []);

	const [isLogining, setIsLogining] = useState(false);
	const login = () => {
		form.validateFields(['username', 'password'])
			.then(async (values) => {
				setIsLogining(true);
				const text = values.username;
				const password = values.password;
				const res = await ajax.post('/login_and_register/login', { text, password });
				if (res.code === 200) {
					message.success('登录成功');
					localStorage.setItem('rememberPassword', rememberPassword);
					localStorage.setItem('autoLogin', autoLogin);
					ipc.send('SAFE_PASSWORD', rememberPassword, password);
					localStorage.setItem('userId', text);
					ipc.send('USER_LOGIN', res.data.token);
				} else {
					message.error(res.message);
					setIsLogining(false);
				}
			})
			.catch((err) => {
				if (err.ajax) {
					message.error('服务器错误，请稍后重试');
				} else {
					const { values } = err;
					if (values.username === undefined) {
						message.error('请输入用户名或邮箱！');
					} else if (values.password === undefined) {
						message.error('请输入密码！');
					}
				}
				setIsLogining(false);
			});
	};

	/**
	 * INFO: 自动登录
	 */
	const [autoLogin, setAutoLogin] = useState(localStorage.getItem('autoLogin') === 'true');
	useEffect(() => {
		let timeout = setTimeout(() => {
			if (autoLogin) login();
			timeout = null;
		}, 0);
		return () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
		};
	}, []);

	return (
		<>
			<div id='dragBar' />
			<div id='mainBody' ref={mainBodyRef}>
				<div id='header'>
					<div id='titleBar'>
						<LogoIcon style={{ fontSize: '1.5rem' }} />
						<span style={{ fontFamily: 'Microsoft Yahei' }}>山大会议</span>
						<button
							className='titleBtn'
							id='shutdown'
							title='退出'
							onClick={() => {
								ipc.send('QUIT');
							}}>
							<ShutdownIcon />
						</button>
						<button
							className='titleBtn'
							id='minimize'
							title='最小化'
							onClick={() => {
								ipc.send('MINIMIZE_LOGIN_WINDOW');
							}}>
							<MinimizeIcon />
						</button>
						<button
							className='titleBtn'
							id='switch'
							title={showRegister ? '返回登录' : '注册账号'}
							onClick={() => {
								setRotating(true);
							}}>
							<RegisterIcon />
						</button>
					</div>
					<div id='canvas' />
				</div>
				<div className='main'>
					<div
						className='form'
						id='loginForm'
						style={{ display: showRegister ? 'none' : 'block' }}>
						<Form form={form}>
							<Form.Item
								name='username'
								rules={[
									{
										required: true,
										message: '请输入用户名或邮箱',
									},
								]}
								initialValue={userId}>
								<Input
									placeholder='请输入用户名或邮箱'
									spellCheck={false}
									prefix={<UserOutlined />}
									size={'large'}
									style={{ width: '65%' }}
									onChange={(event) => {
										setUserId(event.target.value);
									}}
								/>
							</Form.Item>
							<Form.Item
								name='password'
								rules={[
									{
										required: true,
										message: '密码不得为空',
									},
								]}
								initialValue={userPassword}>
								<Input.Password
									placeholder='请输入密码'
									spellCheck={false}
									prefix={<LockOutlined />}
									size={'large'}
									style={{ width: '65%' }}
									onChange={(event) => {
										setUserPassword(event.target.value);
									}}
								/>
							</Form.Item>
							<Form.Item>
								<Checkbox
									style={{ fontSize: '0.75rem' }}
									checked={rememberPassword}
									onChange={(e) => {
										setRememberPassword(e.target.checked);
									}}>
									记住密码
								</Checkbox>
								<Checkbox
									style={{ fontSize: '0.75rem' }}
									checked={autoLogin}
									onChange={(e) => {
										setAutoLogin(e.target.checked);
									}}>
									自动登录
								</Checkbox>
							</Form.Item>
							<Form.Item>
								<RippleButton
									className='submit'
									onClick={login}
									disabled={isLogining}>
									<>{isLogining && <LoadingOutlined />} 登 录</>
								</RippleButton>
							</Form.Item>
						</Form>
					</div>
					<div
						className='form'
						id='registerForm'
						style={{ display: showRegister ? 'flex' : 'none' }}>
						<RippleButton
							className='submit'
							onClick={() => {
								const registerUrl =
									process.env.NODE_ENV === 'development'
										? './register/'
										: '../register/index.html';
								window.open(registerUrl);
							}}>
							注 册
						</RippleButton>
					</div>
				</div>
			</div>
		</>
	);
}
