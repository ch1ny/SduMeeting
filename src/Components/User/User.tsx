import { IdcardOutlined, SolutionOutlined } from '@ant-design/icons';
import { Button, Image, Typography } from 'antd';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import UploadAvatar from 'Components/UploadAvatar/UploadAvatar';
import React, { useEffect, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import { decodeJWT, getMainContent } from 'Utils/Global';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

const thisYear = new Date().getFullYear();

export default function User() {
	const [userId, setUserId] = useState(0);
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [profile, setProfile] = useState<string | undefined>(undefined);
	useEffect(() => {
		return store.subscribe(() => {
			const { email, id, profile, username } = decodeJWT(store.getState().authToken);
			setUserId(id);
			setEmail(email);
			setUsername(username);
			setProfile(
				profile
					? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}`
					: undefined
			);
		});
	}, []);

	const uploadAvatar = function (file: Blob) {
		const fileType = file.type.split('/')[1];
		return new Promise<void>((resolve) => {
			const startTime = Date.now();
			ajax.file('/file/updateUserProfile', {
				img: file,
				fileType,
			})
				.then((res) => {
					if (res.code === 200) {
						setProfile(URL.createObjectURL(file));
						store.dispatch(setAuthToken(res.data.token));
						// 计算上传时间
						const postTime = Date.now() - startTime;
						if (postTime > 250) {
							globalMessage.warn(
								`你上传图片耗时${(postTime / 1000).toFixed(
									2
								)}秒，为了您的使用体验，请尽可能上传小体积图片`
							);
						} else {
							globalMessage.success('头像上传成功！');
						}
					} else {
						globalMessage.error(`头像上传失败，${res.message}`);
					}
					resolve();
				})
				.catch((err) => {
					console.log(err);
					resolve();
				});
		});
	};

	return (
		<>
			<div className='userInfo'>
				<Typography.Title
					level={3}
					style={{
						height: '2rem',
						margin: '0%',
						marginLeft: '1rem',
						lineHeight: '2rem',
					}}>
					用户信息
				</Typography.Title>
				<div className='userInfoContainer'>
					<div>
						<UploadAvatar
							avatar={profile}
							onCropped={uploadAvatar}
							getContainer={getMainContent}
						/>
						<div style={{ paddingBlock: '1rem' }}>
							<Button onClick={openAgreement} icon={<SolutionOutlined />}>
								用户协议
							</Button>
						</div>

						<div>
							<Image
								src='../electronAssets/favicon.ico'
								preview={false}
								width={120}
								height={120}
							/>
						</div>

						<div className='userInfoCopyRight'>
							<p>
								© {thisYear} <a onClick={openMyBlog}>德布罗煜</a> Powered by
							</p>
							<p>
								<a onClick={openReact}>React.js</a> &amp;{' '}
								<a onClick={openElectron}>Electron.js</a>
							</p>
							<p style={{ fontSize: '1rem' }}>
								<a
									onClick={openSourceCodeOnGithub}
									style={{ fontFamily: 'FZZJ-TBPYTJW' }}>
									SDU Meeting
								</a>
								®
							</p>
						</div>
					</div>
					<div>
						<div
							className='mainInfo'
							style={{
								backgroundImage: `url(${require('./namecard.png').default})`,
							}}>
							<Typography.Title level={3} style={{ color: 'white' }}>
								<IdcardOutlined style={{ marginRight: '0.5rem' }} />
								{username}
							</Typography.Title>
							<div className='userInfoDescriptions email'>{email}</div>
							<div className='userInfoDescriptions welcome'>
								您是我们的第 {userId} 位用户！
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

const openAgreement = () => {
	window.open(
		process.env.NODE_ENV === 'development' ? './agreement/' : '../agreement/index.html',
		'agreement'
	);
};

const openSourceCodeOnGithub = () => {
	window.open('https://github.com/ch1ny/SduMeeting', 'sourceCode');
};

const openMyBlog = () => {
	window.open('https://aiolia.top/', 'myBlog');
};

const openReact = () => {
	window.open('https://reactjs.org/', 'react');
};

const openElectron = () => {
	window.open('https://www.electronjs.org/', 'electron');
};
