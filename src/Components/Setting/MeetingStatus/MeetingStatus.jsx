import React, { useState } from 'react';
import { Checkbox } from 'antd';

export default function MeetingStatus(props) {
	const [autoOpenMicroPhone, setAutoOpenMicroPhone] = useState(
		localStorage.getItem('autoOpenMicroPhone') === 'true'
	);
	const [autoOpenCamera, setAutoOpenCamera] = useState(
		localStorage.getItem('autoOpenCamera') === 'true'
	);

	return (
		<>
			<Checkbox
				checked={autoOpenMicroPhone}
				onChange={(e) => {
					setAutoOpenMicroPhone(e.target.checked);
					localStorage.setItem('autoOpenMicroPhone', e.target.checked);
				}}>
				与会时打开麦克风
			</Checkbox>
			<Checkbox
				checked={autoOpenCamera}
				onChange={(e) => {
					setAutoOpenCamera(e.target.checked);
					localStorage.setItem('autoOpenCamera', e.target.checked);
				}}>
				与会时打开摄像头
			</Checkbox>
		</>
	);
}
