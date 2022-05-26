import React, { useEffect } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import {
	exchangeMediaDevice,
	INIT_MESSAGE_HISTORY,
	setAuthToken,
	setMessageHistory,
	updateAvailableDevices
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { ChatMessage, DeviceInfo, ElectronWindow } from 'Utils/Types';
import './App.scss';
import Index from './Index/Index';

declare const window: ElectronWindow & typeof globalThis

/**
 * 获取用户多媒体设备
 */
function getUserMediaDevices() {
	navigator.mediaDevices.enumerateDevices().then((devices) => {
		const generateDeviceJson = (device: DeviceInfo) => {
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
						exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, device)
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
						exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, device)
					);
					return;
				}
			}
		})();
	});
}

export default function App() {
	useEffect(() => {
		getUserMediaDevices();
	}, []);

	window.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((authToken: string) => {
		store.dispatch(setAuthToken(authToken));
		window.ipc.invoke('GET_MESSAGE_HISTORY').then((history: string) => {
			store.dispatch(setMessageHistory(INIT_MESSAGE_HISTORY, JSON.parse(history)));
			store.subscribe(() => {
				const { unreadMessages, messageHistory } = store.getState();
				const alreadyReadMessages: Object = {};
				for (const id in messageHistory) {
					if (Object.hasOwnProperty.call(messageHistory, id)) {
						if (unreadMessages[`${id}`]) {
							alreadyReadMessages[`${id}` as keyof typeof alreadyReadMessages] = messageHistory[`${id}`]
								.filter(
									(message: ChatMessage) =>
										!unreadMessages[`${id}`].some(
											(unreadMessage) => message.id === unreadMessage.id
										)
								)
								.slice(0, 5);
						} else alreadyReadMessages[`${id}` as keyof typeof alreadyReadMessages] = messageHistory[`${id}`].slice(-5);
					}
				}
				window.ipc.invoke('SET_MESSAGE_HISTORY', alreadyReadMessages);
			});
		});
	});
	return (
		<div className='App'>
			<Index />
			DEBUG: 测试视频加密
			{/* <Test /> */}
		</div>
	);
}
