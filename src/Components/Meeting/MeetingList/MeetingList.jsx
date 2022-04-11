import React, { useState } from 'react';
import {
	ClockCircleOutlined,
	CommentOutlined,
	ForwardOutlined,
	PlusOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Divider, Empty, Form, Input, Modal } from 'antd';
import './style.scss';

export default function MeetingList(props) {
	const [meetings, setMeetings] = useState([]);
	const [showJoinModal, setShowJoinModal] = useState(false);

	const [autoOpenMicroPhone, setAutoOpenMicroPhone] = useState(
		localStorage.getItem('autoOpenMicroPhone') === 'true'
	);
	const [autoOpenCamera, setAutoOpenCamera] = useState(
		localStorage.getItem('autoOpenCamera') === 'true'
	);

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
						<MeetingButton icon={<ForwardOutlined />}>快速会议</MeetingButton>
						<MeetingButton icon={<ClockCircleOutlined />}>预定会议</MeetingButton>
					</div>
					<Divider style={{ margin: '1rem' }} />
				</div>
				<div className='list'>
					{meetings.length === 0 ? (
						<Empty
							description={
								<div>
									<div>暂无会议</div>
									<Button>现在预定</Button>
								</div>
							}
						/>
					) : (
						<></>
					)}
				</div>
			</div>
			<Modal
				title={'加入会议'}
				visible={showJoinModal}
				footer={null}
				onCancel={() => {
					setShowJoinModal(false);
				}}
				destroyOnClose={true}>
				<Form
					className='join-form'
					initialValues={{
						remember: true,
					}}
					onFinish={(values) => {
						setShowJoinModal(false);
						values.autoOpenCamera = autoOpenCamera;
						values.autoOpenMicroPhone = autoOpenMicroPhone;
						console.log(values);
						props.joinMeeting(values);
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
								localStorage.setItem('autoOpenMicroPhone', e.target.checked);
							}}>
							与会时打开麦克风
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Checkbox
							checked={autoOpenCamera}
							onChange={(e) => {
								setAutoOpenCamera(e.target.checked);
								localStorage.setItem('autoOpenCamera', e.target.checked);
							}}>
							与会时打开摄像头
						</Checkbox>
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit'>
							加入会议
						</Button>
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}

function MeetingButton(props) {
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
