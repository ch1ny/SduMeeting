import React from 'react';
import { Anchor, Divider, Modal } from 'antd';
import './style.scss';
import { SettingFilled } from '@ant-design/icons';
import MeetingStatus from './MeetingStatus/MeetingStatus';
import MediaDevices from './MediaDevices/MediaDevices';
import AutoLogin from './AutoLogin/AutoLogin';

const { Link } = Anchor;

export default function Setting(props) {
	return (
		<>
			<Modal
				title={<div style={{ width: '100%', userSelect: 'none' }}>设置</div>}
				visible={props.visible}
				closable={false}
				onCancel={props.closeFunc}
				getContainer={props.fatherRef}
				destroyOnClose={true}
				centered={true}
				zIndex={1000}
				footer={null}>
				<div className='settingContainer'>
					<div className='anchorContainer'>
						<Anchor
							getContainer={() =>
								document.querySelector('.settingContainer .settings')
							}>
							<Link href='#login' title='登录' />
							<Link href='#mediaDevices' title='音视频设备' />
							<Link href='#meetingStatus' title='与会状态' />
						</Anchor>
					</div>
					<div className='settings'>
						<>
							<div>
								<h2 id='login'>登录</h2>
								<AutoLogin />
							</div>
							<Divider>
								<SettingFilled />
							</Divider>
							<div>
								<h2 id='mediaDevices'>音视频设备</h2>
								<MediaDevices />
							</div>
							<Divider>
								<SettingFilled />
							</Divider>
							<div>
								<h2 id='meetingStatus'>与会状态</h2>
								<MeetingStatus />
							</div>
						</>
					</div>
				</div>
			</Modal>
		</>
	);
}
