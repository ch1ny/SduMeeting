import React from 'react';
import {
	DEVICE_TYPE,
	exchangeMediaDevice,
	INIT_MESSAGE_HISTORY,
	setAuthToken,
	setMessageHistory,
	updateAvailableDevices,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './App.scss';
import Index from './Index/Index';

// INFO: 由于需要在所有组件挂载之前全局引入 electron ，故只能使用带有构造函数的类声明 App 组件
export default class App extends React.Component {
	constructor(props) {
		super(props);
		window.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken) => {
			store.dispatch(setAuthToken(authToken));
			window.ipc.invoke('GET_MESSAGE_HISTORY').then((history) => {
				store.dispatch(setMessageHistory(INIT_MESSAGE_HISTORY, JSON.parse(history)));
				store.subscribe(() => {
					const { unreadMessages, messageHistory } = store.getState();
					const alreadyReadMessages = {};
					for (const id in messageHistory) {
						if (Object.hasOwnProperty.call(messageHistory, id)) {
							if (unreadMessages[`${id}`]) {
								alreadyReadMessages[`${id}`] = messageHistory[`${id}`]
									.filter(
										(message) =>
											!unreadMessages[`${id}`].some(
												(unreadMessage) => message.id === unreadMessage.id
											)
									)
									.slice(0, 5);
							} else alreadyReadMessages[`${id}`] = messageHistory[`${id}`].slice(-5);
						}
					}
					window.ipc.invoke('SET_MESSAGE_HISTORY', alreadyReadMessages);
				});
			});
		});
	}

	componentDidMount() {
		this.overwriteGetDisplayMedia();
		this.getUserMediaDevices();
	}

	render() {
		return (
			<div className='App'>
				<Index />
			</div>
		);
	}

	/**
	 * 重写 window.mediaDevices.getDisplayMedia() 方法
	 */
	overwriteGetDisplayMedia() {
		window.navigator.mediaDevices.getDisplayMedia = () => {
			return new Promise(async (resolve, reject) => {
				try {
					const source = await window.ipc.invoke('DESKTOP_CAPTURE');
					const stream = await window.navigator.mediaDevices.getUserMedia({
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
					});
					resolve(stream);
				} catch (err) {
					reject(err);
				}
			});
		};
	}

	/**
	 * 获取用户多媒体设备
	 */
	getUserMediaDevices() {
		navigator.mediaDevices.enumerateDevices().then((devices) => {
			const generateDeviceJson = (device) => {
				const formerIndex = device.label.indexOf(' (');
				const latterIndex = device.label.lastIndexOf(' (');
				const { label, webLabel } = ((label, deviceId) => {
					switch (deviceId) {
						case 'default':
							return {
								label: label.replace('Default - ', ''),
								webLabel: label.replace('Default - ', '默认 - '),
							};
						case 'communications':
							return {
								label: label.replace('Communications - ', ''),
								webLabel: label.replace('Communications - ', '通讯设备 - '),
							};
						default:
							return { label: label, webLabel: label };
					}
				})(
					formerIndex === latterIndex
						? device.label
						: device.label.substring(0, latterIndex),
					device.deviceId
				);
				return { label, webLabel, deviceId: device.deviceId };
			};
			let videoDevices = [],
				audioDevices = [];
			for (const index in devices) {
				const device = devices[index];
				if (device.kind === 'videoinput') {
					videoDevices.push(generateDeviceJson(device));
				} else if (device.kind === 'audioinput') {
					audioDevices.push(generateDeviceJson(device));
				}
			}
			store.dispatch(updateAvailableDevices(DEVICE_TYPE.VIDEO_DEVICE, videoDevices));
			store.dispatch(updateAvailableDevices(DEVICE_TYPE.AUDIO_DEVICE, audioDevices));
			const lastVideoDevice = localStorage.getItem('usingVideoDevice');
			const lastAudioDevice = localStorage.getItem('usingAudioDevice');
			(() => {
				store.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, videoDevices[0]));
				for (const device of videoDevices) {
					if (device.deviceId === lastVideoDevice) {
						store.dispatch(
							exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, {
								key: device.deviceId,
								value: device.label,
								children: device.webLabel,
							})
						);
						return;
					}
				}
			})();
			(() => {
				store.dispatch(exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, audioDevices[0]));
				for (const device of audioDevices) {
					if (device.deviceId === lastAudioDevice) {
						store.dispatch(
							exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, {
								key: device.deviceId,
								value: device.label,
								children: device.webLabel,
							})
						);
						return;
					}
				}
			})();
		});
	}
}
