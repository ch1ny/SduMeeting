import {
	KeyOutlined,
	LockFilled,
	LockOutlined,
	MailOutlined,
	UserOutlined,
} from '@ant-design/icons';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import notification from 'antd/lib/notification';
import Select from 'antd/lib/select';
import React, { useEffect, useState } from 'react';
import ajax from 'Utils/Axios/Axios';

export default function Register() {
	useEffect(() => {
		document.title = '账号注册 - 山大会议';
	}, []);

	const [sendCaptchaTick, setSendCaptchaTick] = useState(0);
	const [sendCaptchaInterval, setSendCaptchaInterval] = useState<NodeJS.Timeout | null>(null);
	useEffect(() => {
		return () => {
			if (sendCaptchaInterval) {
				clearInterval(sendCaptchaInterval);
				setSendCaptchaInterval(null);
			}
		};
	}, []);

	const [chosenEmail, setChosenEmail] = useState('@mail.sdu.edu.cn');

	const [form] = Form.useForm();

	const [isRegistering, setIsRegistering] = useState(false);

	const { Option } = Select;

	return (
		<>
			<div className='title'>山大会议 账号注册</div>
			<div className='inputs'>
				<Form
					onFinish={(values) => {
						submitForm(values, chosenEmail, setIsRegistering);
					}}
					autoComplete='off'
					form={form}>
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
						<Input placeholder='请输入昵称' prefix={<UserOutlined />} />
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
						<Input.Password placeholder='请输入密码' prefix={<LockOutlined />} />
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
						<Input.Password placeholder='请再次输入密码' prefix={<LockFilled />} />
					</Form.Item>
					<Form.Item
						rules={[
							{
								required: true,
								message: '请输入邮箱',
							},
							{
								pattern: /^[^@]+$/,
								message: '请不要再次输入"@"',
							},
						]}
						name={'email'}>
						<Input
							placeholder='请输入邮箱'
							addonAfter={
								<Select defaultValue={chosenEmail} onSelect={setChosenEmail}>
									<Option value='@mail.sdu.edu.cn'>@mail.sdu.edu.cn</Option>
									<Option value='@sdu.edu.cn'>@sdu.edu.cn</Option>
								</Select>
							}
							prefix={<MailOutlined />}
						/>
					</Form.Item>
					<Form.Item
						rules={[
							{
								required: true,
								message: '请输入验证码',
							},
						]}
						name={'captcha'}>
						<Input placeholder='请输入邮箱验证码' prefix={<KeyOutlined />} />
					</Form.Item>
					<Form.Item>
						<div style={{ display: 'flex', justifyContent: 'space-around' }}>
							<Button
								disabled={sendCaptchaTick > 0}
								loading={sendCaptchaTick === -1}
								onClick={() => {
									form.validateFields(['username', 'email'])
										.then((values) => {
											setSendCaptchaTick(-1);
											const { username, email } = values;
											ajax.post('/login_and_register/code', {
												username,
												email: `${email}${chosenEmail}`,
											}).then((response) => {
												if (response.code === 200) {
													notification.success({
														message: '验证码发送成功',
														description:
															'验证码已发送，请前往邮箱查询验证码',
													});
													sendCaptcha(
														setSendCaptchaTick,
														setSendCaptchaInterval
													);
												} else {
													notification.error({
														message: '验证码发送失败',
														description: response.message,
													});
													setSendCaptchaTick(0);
												}
											});
										})
										.catch(() => {});
								}}>
								{sendCaptchaTick > 0
									? `${sendCaptchaTick}秒后可再次发送`
									: '发送验证码'}
							</Button>
							<Button loading={isRegistering} type='primary' htmlType='submit'>
								注册
							</Button>
						</div>
					</Form.Item>
				</Form>
			</div>
		</>
	);
}

async function submitForm(
	values: { username: any; password: any; captcha: any; email: any },
	chosenEmail: string,
	setIsRegistering: { (value: React.SetStateAction<boolean>): void; (arg0: boolean): void }
) {
	setIsRegistering(true);
	const { username, password, captcha, email } = values;
	const res = await ajax.post('/login_and_register/register', {
		username,
		password,
		email: `${email}${chosenEmail}`,
		code: captcha,
	});
	if (res.code === 200) {
		notification.success({ message: '注册成功', description: '注册成功，请前往登录吧' });
	} else {
		notification.error({ message: '注册失败', description: res.message });
	}
	setIsRegistering(false);
}

function sendCaptcha(
	setSendCaptchaTick: { (value: React.SetStateAction<number>): void; (arg0: number): void },
	setSendCaptchaInterval: {
		(value: React.SetStateAction<NodeJS.Timeout | null>): void;
		(arg0: NodeJS.Timer | null): void;
	}
) {
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
