import { SettingFilled } from '@ant-design/icons';
import { Anchor, Divider, Modal } from 'antd';
import React, { useEffect } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import { getMainContent } from 'Utils/Global';
import About from './About/About';
import AutoLogin from './AutoLogin/AutoLogin';
import MediaDevices from './MediaDevices/MediaDevices';
import MeetingStatus from './MeetingStatus/MeetingStatus';
import './style.scss';

const { Link } = Anchor;

export default function Setting(props) {
	useEffect(() => {
		if (!props.visible) eventBus.emit('CLOSE_SETTING_MODAL');
	}, [props.visible]);

	return (
		<>
			<Modal
				title={<div style={{ width: '100%', userSelect: 'none' }}>设置</div>}
				visible={props.visible}
				closable={false}
				onCancel={props.closeFunc}
				centered={true}
				zIndex={1000}
				getContainer={getMainContent}
				footer={null}
				destroyOnClose={false}>
				<div className='settingContainer'>
					<div className='anchorContainer'>
						<Anchor
							getContainer={() =>
								document.querySelector('.settingContainer .settings')
							}>
							<Link href='#login' title='登录' />
							<Link href='#mediaDevices' title='音视频设备' />
							<Link href='#meetingStatus' title='与会状态' />
							<Link href='#about' title='关于' />
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
							<Divider>
								<SettingFilled />
							</Divider>
							<div>
								<h2 id='about'>关于</h2>
								<About />
							</div>
						</>
					</div>
				</div>
			</Modal>
		</>
	);
}
