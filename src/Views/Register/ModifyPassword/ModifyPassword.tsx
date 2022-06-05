import { KeyOutlined, LockFilled, LockOutlined, MailOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import notification from 'antd/lib/notification';
import Select from 'antd/lib/select';
import React, { useEffect, useState } from 'react';
import ajax from 'Utils/Axios/Axios';

const [emailPrefix, emailSuffix] = getUrlQueryEmail().split('@');

export default function ModifyPassword() {
	useEffect(() => {
		document.title = '修改密码 - 山大会议';
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

	const [form] = Form.useForm();

	const [chosenEmail, setChosenEmail] = useState(`@${emailSuffix}`);

	const [isModifying, setIsModifying] = useState(false);

	const { Option } = Select;

	return (
		<>
			<div className='title'>山大会议 修改密码</div>
			<div className='inputs'>
				<Form
					onFinish={(values) => {
						setIsModifying(true);
						submitForm(values, chosenEmail).then(() => {
							setIsModifying(false);
						});
					}}
					autoComplete='off'
					form={form}>
					<Form.Item
						rules={[
							{
								required: true,
								message: '请输入注册时使用的邮箱',
							},
							{
								pattern: /^[^@]+$/,
								message: '请不要再次输入"@"',
							},
						]}
						initialValue={emailPrefix}
						name={'email'}>
						<Input
							placeholder='请输入注册时使用的邮箱'
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
							{ required: true, message: '请输入新密码' },
							{
								min: 6,
								message: '请输入长度超过6位的密码',
							},
						]}
						name={'password'}>
						<Input.Password placeholder='请输入新密码' prefix={<LockOutlined />} />
					</Form.Item>
					<Form.Item
						validateTrigger='onBlur'
						rules={[
							{
								required: true,
								message: '请再次输入新密码',
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
						<Input.Password placeholder='请再次输入新密码' prefix={<LockFilled />} />
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
									form.validateFields(['email'])
										.then(({ email }) => {
											setSendCaptchaTick(-1);
											ajax.get('/login_and_register/passwordCode', {
												email: `${email}${chosenEmail}`,
											}).then((response) => {
												if (response.code === 200) {
													notification.success({
														message: '验证码发送成功',
														description:
															'验证码已发送，请前往注册邮箱查询验证码',
													});
													setCaptchaInterval(
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
							<Button loading={isModifying} type='primary' htmlType='submit'>
								更新密码
							</Button>
						</div>
					</Form.Item>
				</Form>
			</div>
		</>
	);
}

async function submitForm(
	values: { password: any; captcha: any; email: any },
	chosenEmail: string
) {
	const { password, captcha, email } = values;
	const res = await ajax.post('/login_and_register/updatePassword', {
		password,
		email: `${email}${chosenEmail}`,
		code: captcha,
	});
	if (res.code === 200) {
		notification.success({
			message: '密码修改成功',
			description: '密码修改成功，请返回登录',
		});
	} else {
		notification.error({ message: '密码修改失败', description: res.message });
	}
	return;
}

function setCaptchaInterval(
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

function getUrlQueryEmail() {
	let reg = new RegExp('(^|&)email=([^&]*)(&|$)', 'i');
	let r = location.search.substring(1).match(reg);
	if (r) {
		return decodeURIComponent(r[2]);
	}
	return '@mail.sdu.edu.cn';
}
