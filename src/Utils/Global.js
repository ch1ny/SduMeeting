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
				noiseSuppression: false,
				echoCancellation: true,
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

export { decodeJWT, getMainContent, getDeviceStream };
