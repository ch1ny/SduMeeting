import { message } from 'antd';
import UploadAvatar from 'Components/UploadAvatar/UploadAvatar';
import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import { getMainContent } from 'Utils/Global';
import { setAuthToken } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export default function User() {
	const [userId, setUserId] = useState(undefined);
	const [email, setEmail] = useState(undefined);
	const [username, setUsername] = useState(undefined);
	const [profile, setProfile] = useState(undefined);
	useEffect(() => {
		const { email, id, profile, username } = jwtDecode(store.getState().authToken);
		setUserId(id);
		setEmail(email);
		setUsername(username);
		setProfile(
			profile ? `http://meeting.aiolia.top:8080/file/pic/user/${id}.${profile}` : undefined
		);
	}, []);

	const uploadAvatar = function (file) {
		const fileType = file.type.split('/')[1];
		return new Promise((resolve) => {
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
							message.warn(
								`你上传图片耗时${(postTime / 1000).toFixed(
									2
								)}秒，为了您的使用体验，请尽可能上传小体积图片`
							);
						} else {
							message.success('头像上传成功！');
						}
					} else {
						message.error(`头像上传失败，${res.message}`);
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
			<div className='userInfoContainer'>
				<div>
					<UploadAvatar
						avatar={profile}
						onCropped={uploadAvatar}
						getContainer={getMainContent}
					/>
				</div>
			</div>
		</>
	);
}
