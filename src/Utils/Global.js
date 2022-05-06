/**
 * 这个文件用来存放一些不好分类的全局函数
 */

import jwtDecode from 'jwt-decode';
import { DEVICE_TYPE } from './Store/actions';
import store from './Store/store';

/**
 * 用来返回 mainContent 模态屏遮罩层挂载DOM
 * @returns Id值为'mainContent'的DOM
 */
function getMainContent() {
	return document.getElementById('mainContent');
}

/**
 * 由于直接使用 jwtDecode 解析非法 token 会报错，因此进行封装
 * @param {String} token
 * @returns 解析后的 token
 */
function decodeJWT(token) {
	try {
		return jwtDecode(token);
	} catch (error) {
		if (error.message === 'Invalid token specified') return undefined;
		console.log(error);
	}
}

/**
 * 封装后的获取设备流函数
 * @param {string} device 设备类型 DEVICE_TYPE
 * @returns
 */
function getDeviceStream(device) {
	switch (device) {
		case DEVICE_TYPE.AUDIO_DEVICE:
			const audioDevice = store.getState().usingAudioDevice;
			const audioConstraints = {
				deviceId: {
					exact: audioDevice.key,
				},
				noiseSuppression: localStorage.getItem('noiseSuppression') !== 'false',
				echoCancellation: localStorage.getItem('echoCancellation') !== 'false',
			};
			return navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
		case DEVICE_TYPE.VIDEO_DEVICE:
			const videoDevice = store.getState().usingVideoDevice;
			const videoConstraints = {
				deviceId: {
					exact: videoDevice.key,
				},
				width: 1920,
				height: 1080,
				frameRate: {
					max: 30,
				},
			};
			return navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
			});
		default:
			return Promise.resolve(new MediaStream());
	}
}

export const A_SECOND_TIME = 1000;
export const A_MINUTE_TIME = 60 * A_SECOND_TIME;
export const AN_HOUR_TIME = 60 * A_MINUTE_TIME;
export const A_DAY_TIME = 24 * AN_HOUR_TIME;
export const isSameDay = (timeStampA, timeStampB) => {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	return dateA.setHours(0, 0, 0, 0) === dateB.setHours(0, 0, 0, 0);
};
export const isSameWeek = (timeStampA, timeStampB) => {
	let A = new Date(timeStampA).setHours(0, 0, 0, 0);
	let B = new Date(timeStampB).setHours(0, 0, 0, 0);
	const timeDistance = Math.abs(A - B);
	return timeDistance / A_DAY_TIME;
};
export const isSameYear = (timeStampA, timeStampB) => {
	const dateA = new Date(timeStampA);
	const dateB = new Date(timeStampB);
	dateA.setHours(0, 0, 0, 0);
	dateB.setHours(0, 0, 0, 0);
	dateA.setMonth(0, 1);
	dateB.setMonth(0, 1);
	return dateA.getFullYear() === dateB.getFullYear();
};
export const translateDayNumberToDayChara = (day) => {
	switch (day) {
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
			return '星期天';
	}
};

export { decodeJWT, getMainContent, getDeviceStream };
