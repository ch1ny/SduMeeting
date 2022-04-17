import React, { useState } from 'react';
import { Button, Image, message, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import './style.scss';

export default function UploadAvatar(props) {
	const [loading, setLoading] = useState(false);
	const beforeUpload = (file) => {
		const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
		if (!isJpgOrPng) {
			message.error('请上传(JPG/PNG)图片!');
			return Upload.LIST_IGNORE;
		}

		const isLt4M = file.size / 1024 / 1024 < 4;
		if (!isLt4M) {
			message.error('请上传4M以内的图片!');
			return Upload.LIST_IGNORE;
		}

		return isJpgOrPng && isLt4M;
	};
	const uploadProps = {
		showUploadList: false,
		beforeUpload,
		onChange: ({ file: { status } }) => {
			switch (status) {
				case 'uploading':
					setLoading(true);
					break;
				case 'done':
					setLoading(false);
			}
		},
		customRequest: async ({ file }) => {
			const formData = new FormData();
			formData.append('avatarfile', file);
			props.onCropped(file).then(() => {
				setLoading(false);
			});
		},
	};

	return (
		<div className='uploadAvatarContainer'>
			<div className='uploadAvatarImageContainer'>
				<Image
					width={120}
					height={120}
					src={props.avatar}
					preview={{ getContainer: props.getContainer }}
				/>
			</div>
			<div className='uploadAvatarTriggerContainer'>
				<ImgCrop rotate grid>
					<Upload {...uploadProps}>
						<Button type='primary' ghost loading={loading}>
							上传头像
						</Button>
					</Upload>
				</ImgCrop>
			</div>
		</div>
	);
}
