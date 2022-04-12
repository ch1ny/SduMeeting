import { Button, Form, Input } from 'antd';
import React, { useEffect, useState } from 'react';
import './App.scss';
import bg from './bg.jpg';

export default function App() {
	const [sendCaptchaTick, setSendCaptchaTick] = useState(0);
	const [sendCaptchaInterval, setSendCaptchaInterval] = useState(null);
	useEffect(() => {
		return () => {
			if (sendCaptchaInterval) {
				clearInterval(sendCaptchaInterval);
				setSendCaptchaInterval(null);
			}
		};
	}, []);

	const [form] = Form.useForm();

	return (
		<div className='register' style={{ backgroundImage: `url(${bg})` }}>
			<div className='container'>
				<div className='title'>山大会议 注册账号</div>
				<div className='inputs'>
					<Form onFinish={submitForm} autoComplete='off' form={form}>
						<Form.Item
							rules={[
								{
									required: true,
									message: '请输入注册用的昵称',
								},
								{
									pattern: /^[^@]+$/,
									message: '昵称中不允许出现"@"',
								},
							]}
							name={'username'}>
							<Input placeholder='请输入昵称' />
						</Form.Item>
						<Form.Item
							rules={[
								{ required: true, message: '请输入密码' },
								{
									min: 6,
									message: '请输入长度超过6位的密码',
								},
							]}
							name={'password'}>
							<Input.Password placeholder='请输入密码' />
						</Form.Item>
						<Form.Item
							validateTrigger='onBlur'
							rules={[
								{
									required: true,
									message: '请再次输入密码',
								},
								({ getFieldValue }) => ({
									validator(rule, value) {
										if (getFieldValue('password') === value) {
											return Promise.resolve();
										}
										return Promise.reject('两次输入的密码不一致');
									},
								}),
							]}
							name={'passwordCheck'}>
							<Input.Password placeholder='请再次输入密码' />
						</Form.Item>
						<Form.Item
							rules={[
								{
									required: true,
									message: '请输入山大邮箱',
								},
								{
									pattern: /^[^@]+$/,
									message: '请不要再次输入"@"',
								},
							]}
							name={'email'}>
							<Input placeholder='请输入山大邮箱' addonAfter='@mail.sdu.edu.cn' />
						</Form.Item>
						<Form.Item
							rules={[
								{
									required: true,
									message: '请输入验证码',
								},
							]}
							name={'captcha'}>
							<Input placeholder='请输入邮箱验证码' />
						</Form.Item>
						<Form.Item>
							<div style={{ display: 'flex', justifyContent: 'space-around' }}>
								<Button
									disabled={sendCaptchaTick}
									onClick={() => {
										form.validateFields(['username', 'email'])
											.then(() => {
												sendCaptcha(
													setSendCaptchaTick,
													setSendCaptchaInterval
												);
											})
											.catch(() => {});
									}}>
									{sendCaptchaTick
										? `${sendCaptchaTick}秒后可再次发送`
										: '发送验证码'}
								</Button>
								<Button type='primary' htmlType='submit'>
									注册
								</Button>
							</div>
						</Form.Item>
					</Form>
				</div>
			</div>
		</div>
	);
}

function submitForm(values) {
	console.log(values);
}

function sendCaptcha(setSendCaptchaTick, setSendCaptchaInterval) {
	let sendCaptchaTick = 60;
	setSendCaptchaTick(sendCaptchaTick);
	const interval = setInterval(() => {
		setSendCaptchaTick(--sendCaptchaTick);
		if (sendCaptchaTick === 0) {
			clearInterval(interval);
			setSendCaptchaInterval(null);
		}
	}, 1000);
	setSendCaptchaInterval(interval);
}
