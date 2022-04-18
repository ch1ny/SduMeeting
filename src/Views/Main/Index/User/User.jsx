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
		console.log(file);
		const fileType = file.type.split('/')[1];
		return new Promise((resolve) => {
			ajax.file('/file/updateUserProfile', {
				uid: userId,
				img: file,
				fileType,
			})
				.then((res) => {
					if (res.code === 200) {
						console.log(res);
						message.success('头像上传成功！');
						// INFO: 通过追加 params 实现刷新图片缓存
						setProfile(
							`http://meeting.aiolia.top:8080/file/pic/user/${userId}.${fileType}?${Date.now()}`
						);
						store.dispatch(setAuthToken(res.data.token));
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
