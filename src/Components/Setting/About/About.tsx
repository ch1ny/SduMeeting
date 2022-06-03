import { Button, Image, Progress } from 'antd';
import axios from 'axios';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useMemo, useState } from 'react';
import { eWindow } from 'Utils/Types';
import './style.scss';

function needUpdate(nowVersion: string, targetVersion: string) {
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

export default function About() {
	const [appVersion, setAppVersion] = useState<string | undefined>(undefined);
	useEffect(() => {
		eWindow.ipc.invoke('APP_VERSION').then((version: string) => {
			setAppVersion(version);
		});
	}, []);

	const thisYear = useMemo(() => new Date().getFullYear(), []);

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
				if (needUpdate(appVersion as string, latest)) setLatestVersion(latest);
				else globalMessage.success({ content: '当前已是最新版本，无需更新' });
			})
			.catch(() => {
				globalMessage.error({
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
					eWindow.ipc.invoke('DOWNLOADED_UPDATE_ZIP', fr.result).then(() => {
						setTimeout(() => {
							eWindow.ipc.send('READY_TO_UPDATE');
						}, 500);
					});
				};
				fr.readAsBinaryString(res.data);
				globalMessage.success({ content: '更新包下载完毕，即将重启应用...' });
			});
	};

	return (
		<div id='settingAboutContainer'>
			<div>
				<Image
					src={'../electronAssets/favicon177x128.ico'}
					preview={false}
					width={'25%'}
					height={'25%'}
				/>
			</div>
			<div className='settingAboutFaviconText'>山大会议</div>
			<div className='settingAboutFaviconText'>SDU Meeting</div>
			<div id='settingVersionText'>V {appVersion}</div>
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
				<Button type='primary' onClick={checkForUpdate} loading={checking}>
					检查更新
				</Button>
			)}
			<div id='copyright'>Copyright (c) 2021{thisYear ? ` - ${thisYear}` : ''} 德布罗煜</div>
		</div>
	);
}
