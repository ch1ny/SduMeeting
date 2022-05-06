import { Button, message, Progress } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

function needUpdate(nowVersion, targetVersion) {
	const nowArr = nowVersion.split('.').map((i) => Number(i));
	const newArr = targetVersion.split('.').map((i) => Number(i));
	const lessLength = Math.min(nowArr.length, newArr.length);
	for (let i = 0; i < lessLength; i++) {
		if (nowArr[i] < newArr[i]) {
			return true;
		} else if (nowArr[i] > newArr[i]) {
			return false;
		}
	}
	if (nowArr.length < newArr.length) return true;
	return false;
}

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

	const [latestVersion, setLatestVersion] = useState(false);
	const [checking, setChecking] = useState(false);
	const checkForUpdate = () => {
		setChecking(true);
		axios
			.get('https://assets.aiolia.top/ElectronApps/SduMeeting/manifest.json', {
				headers: {
					'Cache-Control': 'no-cache',
				},
			})
			.then((res) => {
				const { latest } = res.data;
				if (needUpdate(appVersion, latest)) setLatestVersion(latest);
				else message.success({ content: '当前已是最新版本，无需更新' });
			})
			.catch(() => {
				message.error({
					content: '检查更新失败',
				});
			})
			.finally(() => {
				setChecking(false);
			});
	};

	const [total, setTotal] = useState(Infinity);
	const [loaded, setLoaded] = useState(0);
	const [updating, setUpdating] = useState(false);
	const update = () => {
		setUpdating(true);
		axios
			.get(`https://assets.aiolia.top/ElectronApps/SduMeeting/${latestVersion}/update.zip`, {
				responseType: 'blob',
				onDownloadProgress: (evt) => {
					const { loaded, total } = evt;
					setTotal(total);
					setLoaded(loaded);
				},
				headers: {
					'Cache-Control': 'no-cache',
				},
			})
			.then((res) => {
				const fr = new FileReader();
				fr.onload = () => {
					window.ipc.invoke('DOWNLOADED_UPDATE_ZIP', fr.result).then(() => {
						setTimeout(() => {
							window.ipc.send('READY_TO_UPDATE');
						}, 500);
					});
				};
				fr.readAsBinaryString(res.data);
				message.success({ content: '更新包下载完毕，即将重启应用...' });
			});
	};

	return (
		<div style={{ textAlign: 'center', userSelect: 'none' }}>
			<div style={{ margin: '0.5rem', fontSize: '1.5rem', color: '#3c3c3c' }}>
				V {appVersion}
			</div>
			{latestVersion ? (
				<>
					<div>检查到有新的可用版本：V {latestVersion}，是否进行更新？</div>
					{updating ? (
						<>
							<Progress
								percent={Number(((loaded / total) * 100).toFixed(0))}
								status={loaded === total ? 'success' : 'active'}
							/>
						</>
					) : (
						<Button onClick={update}>开始下载</Button>
					)}
				</>
			) : (
				<Button type='primary' size='small' onClick={checkForUpdate} loading={checking}>
					检查更新
				</Button>
			)}
			<div style={{ margin: '1rem' }}>
				Copyright (c) 2021{thisYear ? ` - ${thisYear}` : ''} 德布罗煜
			</div>
		</div>
	);
}
