/**
 * 这个文件用来存放一些不好分类的全局函数
 */

import jwtDecode from 'jwt-decode';
import { DEVICE_TYPE } from './Constraints';
import store from './Store/store';
import { DeviceInfo, eWindow, UserInfo } from './Types';

/**
 * 用来返回 mainContent 模态屏遮罩层挂载DOM
 * @returns Id值为'mainContent'的DOM
 */
function getMainContent(): HTMLElement {
	const content = document.getElementById('mainContent');
	if (content) {
		return content;
	} else {
		return document.body;
	}
}

/**
 * 由于直接使用 jwtDecode 解析非法 token 会报错，因此进行封装
 * @param {string} token
 * @returns 解析后的 token
 */
function decodeJWT(token: string): UserInfo {
	try {
		return jwtDecode(token);
	} catch (error: any) {
		console.log(error);
		return {
			email: '',
			exp: 0,
			iat: 0,
			id: 0,
			iss: '',
			profile: false,
			role: [
				{
					authority: '',
					id: 0,
				},
			],
			sub: '',
			username: '',
		};
	}
}

/**
 * 封装后的获取设备流函数
 * @param {string} device 设备类型 DEVICE_TYPE
 * @returns
 */
async function getDeviceStream(device: string): Promise<MediaStream> {
	switch (device) {
		case DEVICE_TYPE.AUDIO_DEVICE:
			const audioDevice = store.getState().usingAudioDevice as DeviceInfo;
			const audioConstraints = {
				deviceId: {
					exact: audioDevice.deviceId,
				},
				noiseSuppression: localStorage.getItem('noiseSuppression') !== 'false',
				echoCancellation: localStorage.getItem('echoCancellation') !== 'false',
			};
			try {
				return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
			} catch (e) {
				return await getDefaultStream();
			}
		case DEVICE_TYPE.VIDEO_DEVICE:
			const videoDevice = store.getState().usingVideoDevice as DeviceInfo;
			const videoConstraints = {
				deviceId: {
					exact: videoDevice.deviceId,
				},
				width: 1920,
				height: 1080,
				frameRate: {
					max: 30,
				},
			};
			try {
				return await navigator.mediaDevices.getUserMedia({
					video: videoConstraints,
				});
			} catch (e) {
				return await getDefaultStream();
			}
		default:
			return new MediaStream();
	}
}

let defaultVideoWidget: HTMLVideoElement | undefined;
function getDefaultStream(): Promise<MediaStream> {
	return new Promise((resolve) => {
		if (defaultVideoWidget) {
			resolve((defaultVideoWidget as any).captureStream(1) as MediaStream);
		} else {
			defaultVideoWidget = document.createElement('video');
			defaultVideoWidget.autoplay = true;
			defaultVideoWidget.src = '../electronAssets/null.mp4';
			defaultVideoWidget.loop = true;
			defaultVideoWidget.onloadedmetadata = () => {
				resolve((defaultVideoWidget as any).captureStream(1) as MediaStream);
			};
		}
	});
}

function getDesktopStream(): Promise<MediaStream> {
	return new Promise((resolve) => {
		eWindow.ipc.invoke('DESKTOP_CAPTURE').then((source) => {
			(navigator as any).mediaDevices
				.getUserMedia({
					audio: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id,
						},
					},
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id,
						},
					},
				})
				.then((stream: MediaStream) => {
					resolve(stream);
				});
		});
	});
}

export const A_SECOND_TIME = 1000;
export const A_MINUTE_TIME = 60 * A_SECOND_TIME;
export const AN_HOUR_TIME = 60 * A_MINUTE_TIME;
export const A_DAY_TIME = 24 * AN_HOUR_TIME;
export const isSameDay = (
	timeStampA: string | number | Date,
	timeStampB: string | number | Date
) => {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	return dateA.setHours(0, 0, 0, 0) === dateB.setHours(0, 0, 0, 0);
};
export const isSameWeek = (
	timeStampA: string | number | Date,
	timeStampB: string | number | Date
) => {
	let A = new Date(timeStampA).setHours(0, 0, 0, 0);
	let B = new Date(timeStampB).setHours(0, 0, 0, 0);
	const timeDistance = Math.abs(A - B);
	return timeDistance / A_DAY_TIME;
};
export const isSameYear = (
	timeStampA: string | number | Date,
	timeStampB: string | number | Date
) => {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	dateA.setHours(0, 0, 0, 0);
	dateB.setHours(0, 0, 0, 0);
	dateA.setMonth(0, 1);
	dateB.setMonth(0, 1);
	return dateA.getFullYear() === dateB.getFullYear();
};
export const translateDayNumberToDayChara = (day: any) => {
	if (typeof day === 'number') {
		day = day % 7;
	}
	switch (day) {
		case 0:
			return '星期天';
		case 1:
			return '星期一';
		case 2:
			return '星期二';
		case 3:
			return '星期三';
		case 4:
			return '星期四';
		case 5:
			return '星期五';
		case 6:
			return '星期六';
		default:
			return String(day);
	}
};

export { decodeJWT, getMainContent, getDeviceStream, getDesktopStream };
