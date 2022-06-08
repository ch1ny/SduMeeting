import {
	CommentOutlined,
	ForwardOutlined,
	LockOutlined,
	PlusOutlined,
	UserOutlined,
	VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { InputNumber } from 'antd';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Divider from 'antd/lib/divider';
import Empty from 'antd/lib/empty';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import React, { useEffect, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import { CALL_STATUS_FREE, CALL_STATUS_OFFERING } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { decodeJWT, getMainContent } from 'Utils/Global';
import { globalMessage } from 'Utils/GlobalMessage/GlobalMessage';
import { setCallStatus } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { MeetingInfo } from '../Meeting';
import './style.scss';

interface MeetingListProps {
	joinMeeting: (values: MeetingInfo) => any;
}

export default function MeetingList(props: MeetingListProps) {
	const [showJoinModal, setShowJoinModal] = useState(false);
	const [showRandomModal, setShowRandomModal] = useState(false);

	const [autoOpenMicroPhone, setAutoOpenMicroPhone] = useState(
		localStorage.getItem('autoOpenMicroPhone') === 'true'
	);
	const [autoOpenCamera, setAutoOpenCamera] = useState(
		localStorage.getItem('autoOpenCamera') === 'true'
	);

	const [isJoining, setIsJoining] = useState(false);

	const [username, setUsername] = useState('');
	useEffect(() => {
		return store.subscribe(() => {
			const authToken = store.getState().authToken;
			if (authToken) {
				setUsername(decodeJWT(authToken).username);
			}
		});
	}, []);

	return (
		<>
			<div className='meetingList'>
				<div className='header'>
					<div className='meetingBtns'>
						<MeetingButton
							icon={<PlusOutlined />}
							onClick={() => {
								setShowJoinModal(true);
							}}>
							加入会议
						</MeetingButton>
						<MeetingButton
							icon={<ForwardOutlined />}
							onClick={() => {
								setShowRandomModal(true);
							}}>
							快速会议
						</MeetingButton>
						<MeetingButton
							icon={<LockOutlined />}
							onClick={() => {
								globalMessage.warn('>_< 啊哦~这个功能已经被取消啦！');
							}}>
							加密会议
						</MeetingButton>
					</div>
					<Divider style={{ margin: '1rem' }} />
				</div>
				<div className='list'>
					<Empty
						description={
							<div>
								<div>暂无会议</div>
								<Button
									onClick={() => {
										setShowRandomModal(true);
									}}>
									现在发起
								</Button>
							</div>
						}
					/>
				</div>
			</div>
			<Modal
				title={'加入会议'}
				visible={showJoinModal}
				footer={null}
				onCancel={() => {
					setShowJoinModal(false);
				}}
				getContainer={getMainContent}
				closable={false}
				maskClosable={!isJoining}
				destroyOnClose={false}>
				<Form
					className='join-form'
					initialValues={{
						remember: true,
					}}
					onFinish={(values) => {
						if (store.getState().callStatus === CALL_STATUS_FREE) {
							setIsJoining(true);
							ajax.post('/meeting/join', {
								userId: decodeJWT(store.getState().authToken).id,
								meetingId: values.meetingId,
							})
								.then((res) => {
									if (res.code === 0 && res.message === 'success') {
										store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
										eventBus.once('ATTEMPT_TO_JOIN', () => {
											setIsJoining(false);
											setShowJoinModal(false);
										});
										values.sfuIp = res.data.addr;
										values.autoOpenCamera = autoOpenCamera;
										values.autoOpenMicroPhone = autoOpenMicroPhone;
										props.joinMeeting(values);
									} else {
										setIsJoining(false);
										globalMessage.error(`加入失败：${res.message}`);
									}
								})
								.catch((err) => {
									setIsJoining(false);
									globalMessage.error('加入请求发送失败');
								});
						} else {
							globalMessage.error('应用当前不处于空闲通话状态！');
						}
					}}>
					<Form.Item
						name='meetingId'
						rules={[
							{
								message: '会议号由至少9位的纯数字组成',
								pattern: /^[0-9]{9,}$/,
							},
							{
								required: true,
								message: '请输入会议号',
							},
						]}>
						<Input
							prefix={<CommentOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
							placeholder='输入会议号'
						/>
					</Form.Item>
					<Form.Item
						name='joinName'
						initialValue={username}
						rules={[
							{
								required: true,
								message: '请输入与会名称',
							},
						]}>
						<Input
							prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
							placeholder='您的名称'
						/>
					</Form.Item>
					<Form.Item>
						<Checkbox
							checked={autoOpenMicroPhone}
							onChange={(e) => {
								setAutoOpenMicroPhone(e.target.checked);
								localStorage.setItem('autoOpenMicroPhone', `${e.target.checked}`);
							}}>
							与会时打开麦克风
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Checkbox
							checked={autoOpenCamera}
							onChange={(e) => {
								setAutoOpenCamera(e.target.checked);
								localStorage.setItem('autoOpenCamera', `${e.target.checked}`);
							}}>
							与会时打开摄像头
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' loading={isJoining}>
							加入会议
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={'快速会议'}
				visible={showRandomModal}
				footer={null}
				onCancel={() => {
					setShowRandomModal(false);
				}}
				getContainer={getMainContent}
				closable={false}
				maskClosable={!isJoining}
				destroyOnClose={false}>
				<Form
					className='join-form'
					initialValues={{
						remember: true,
					}}
					onFinish={(values) => {
						if (store.getState().callStatus === CALL_STATUS_FREE) {
							setIsJoining(true);
							ajax.post('/meeting/create', {
								userId: decodeJWT(store.getState().authToken).id,
								limit: values.joinLimit,
								pattern: 1,
							})
								.then((res) => {
									if (res.code === 0 && res.message === 'success') {
										store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
										eventBus.once('ATTEMPT_TO_JOIN', () => {
											setIsJoining(false);
											setShowRandomModal(false);
										});
										values.meetingId = `${res.data.meetingId}`;
										values.sfuIp = res.data.addr;
										values.autoOpenCamera = autoOpenCamera;
										values.autoOpenMicroPhone = autoOpenMicroPhone;
										props.joinMeeting(values);
									} else {
										setIsJoining(false);
										globalMessage.error(`创建失败：${res.message}`);
									}
								})
								.catch((err) => {
									setIsJoining(false);
									globalMessage.error('创建请求发送失败');
								});
						} else {
							globalMessage.error('应用当前不处于空闲通话状态！');
						}
					}}>
					<Form.Item
						name='joinName'
						initialValue={username}
						label='与会使用昵称'
						rules={[
							{
								required: true,
								message: '请输入与会名称',
							},
						]}>
						<Input
							prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
							placeholder='您的名称'
						/>
					</Form.Item>
					<Form.Item
						name='joinLimit'
						initialValue={10}
						label='最大与会人数'
						rules={[
							{
								required: true,
								message: '请输入最大参会人数',
							},
						]}>
						<InputNumber
							style={{
								width: '100%',
							}}
							prefix={
								<VerticalAlignTopOutlined
									style={{ color: 'rgba(0, 0, 0, 0.25)' }}
								/>
							}
							min={1}
							max={100}
							placeholder='最大参会人数'
						/>
					</Form.Item>
					<Form.Item>
						<Checkbox
							checked={autoOpenMicroPhone}
							onChange={(e) => {
								setAutoOpenMicroPhone(e.target.checked);
								localStorage.setItem('autoOpenMicroPhone', `${e.target.checked}`);
							}}>
							与会时打开麦克风
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Checkbox
							checked={autoOpenCamera}
							onChange={(e) => {
								setAutoOpenCamera(e.target.checked);
								localStorage.setItem('autoOpenCamera', `${e.target.checked}`);
							}}>
							与会时打开摄像头
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' loading={isJoining}>
							创建会议
						</Button>
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}

interface MeetingButtonProps {
	onClick?: React.MouseEventHandler<HTMLDivElement>;
	icon: React.ReactNode;
	children: React.ReactNode;
}
function MeetingButton(props: MeetingButtonProps) {
	return (
		<>
			<div className='meetingBtn' onClick={props.onClick}>
				<div className='iconContainer'>
					<span>{props.icon}</span>
				</div>
				<div className='textContainer'>{props.children}</div>
			</div>
		</>
	);
}
