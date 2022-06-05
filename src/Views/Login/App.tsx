import {
	LoadingOutlined,
	LockOutlined,
	QuestionCircleOutlined,
	UserOutlined,
} from '@ant-design/icons';
import Checkbox from 'antd/lib/checkbox';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import { LogoIcon, MinimizeIcon, RegisterIcon, ShutdownIcon } from 'Components/MyIcon/MyIcon';
import RippleButton from 'Components/RippleButton/RippleButton';
import { Victor } from 'Components/Victor/Victor';
import React, { useEffect, useRef, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import { decodeJWT } from 'Utils/Global';
import { eWindow } from 'Utils/Types';
import './App.scss';

export default function App() {
	const [form] = Form.useForm();

	const lastUserId = localStorage.getItem('userId');
	const [userId, setUserId] = useState(lastUserId === 'null' ? '' : lastUserId);

	const [userPassword, setUserPassword] = useState('');
	const [rememberPassword, setRememberPassword] = useState(
		localStorage.getItem('rememberPassword') === 'true'
	);
	useEffect(() => {
		if (rememberPassword) {
			eWindow.ipc.invoke('GET_LAST_PASSWORD').then((psw: string) => {
				form.setFieldsValue({ password: psw });
			});
		}
	}, []);

	const [rotating, setRotating] = useState(false);
	useEffect(() => {
		if (rotating) {
			const mainBody = mainBodyRef.current as HTMLDivElement;
			mainBody.style.animationName = 'rotateOut';
			const timeout = setTimeout(() => {
				mainBody.style.animationName = 'rotateIn';
				setShowRegister(!showRegister);
				clearTimeout(timeout);
			}, 250);
			return () => {
				if (timeout) {
					clearTimeout(timeout);
				}
			};
		}
	}, [rotating]);

	const [showRegister, setShowRegister] = useState(false);
	useEffect(() => {
		const timeout = setTimeout(() => {
			setRotating(false);
			clearTimeout(timeout);
		}, 250);
		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [showRegister]);

	const mainBodyRef = useRef<HTMLDivElement>(null);

	// 设置动态背景
	useEffect(() => {
		const victor = Victor('header', 'canvas');
		const theme = ['#ff1324', '#ff3851'];
		if (victor) victor(theme).set();
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
					globalMessage.success('登录成功');
					localStorage.setItem('rememberPassword', `${rememberPassword}`);
					localStorage.setItem('autoLogin', `${autoLogin}`);
					eWindow.ipc.send('SAFE_PASSWORD', rememberPassword, password);
					localStorage.setItem('userId', text);
					eWindow.ipc.send('USER_LOGIN', res.data.token, decodeJWT(res.data.token).email);
				} else {
					globalMessage.error(res.message);
					setIsLogining(false);
				}
			})
			.catch((err) => {
				if (err.ajax) {
					globalMessage.error('服务器错误，请稍后重试');
				} else {
					const { values } = err;
					if (values.username === undefined) {
						globalMessage.error('请输入用户名或邮箱！');
					} else if (values.password === undefined) {
						globalMessage.error('请输入密码！');
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
			clearTimeout(timeout);
		}, 0);
		return () => {
			if (timeout) {
				clearTimeout(timeout);
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
						<span style={{ fontFamily: 'FZZJ-TBPYTJW' }}>山大会议</span>
						<button
							className='titleBtn'
							id='shutdown'
							title='退出'
							onClick={() => {
								eWindow.ipc.send('QUIT');
							}}>
							<ShutdownIcon />
						</button>
						<button
							className='titleBtn'
							id='minimize'
							title='最小化'
							onClick={() => {
								eWindow.ipc.send('MINIMIZE_LOGIN_WINDOW');
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
								<a
									onClick={openModifyPassword}
									style={{
										marginLeft: '0.5em',
									}}>
									<QuestionCircleOutlined /> 忘记密码
								</a>
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
						<RippleButton className='submit' onClick={openRegister}>
							注 册
						</RippleButton>
					</div>
				</div>
			</div>
		</>
	);
}

const openRegister = () => {
	const registerUrl =
		process.env.NODE_ENV === 'development'
			? './register?type=register'
			: '../register/index.html?type=register';
	window.open(registerUrl, 'register');
};

const openModifyPassword = () => {
	const modifyPasswordUrl =
		process.env.NODE_ENV === 'development'
			? './register?type=forgetPassword'
			: '../register/index.html?type=forgetPassword';
	window.open(modifyPasswordUrl, 'register');
};
