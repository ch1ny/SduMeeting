import { Button } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

export default function About(props) {
	const [appVersion, setAppVersion] = useState(undefined);
	useEffect(() => {
		(async () => {
			setAppVersion(await window.ipc.invoke('APP_VERSION'));
		})();
	}, []);

	const [thisYear, setThisYear] = useState(undefined);
	useEffect(() => {
		setThisYear(new Date().getFullYear());
	}, []);

	const [checking, setChecking] = useState(false);
	const checkForUpdate = () => {
		setChecking(true);
		axios
			.get('https://assets.aiolia.top/ElectronApps/SduMeeting/manifest.json')
			.then((res) => {
				console.log(res);
			})
			.finally(() => {
				setChecking(false);
			});
	};

	return (
		<div style={{ textAlign: 'center', userSelect: 'none' }}>
			<div style={{ margin: '0.5rem', fontSize: '1.5rem', color: '#3c3c3c' }}>
				V {appVersion}
			</div>
			<Button type='primary' size='small' onClick={checkForUpdate} loading={checking}>
				检查更新
			</Button>
			<div style={{ margin: '1rem' }}>
				Copyright (c) 2021{thisYear ? ` - ${thisYear}` : ''} 德布罗煜
			</div>
		</div>
	);
}
