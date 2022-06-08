import { CustomerServiceOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import React, { useEffect, useState } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import { globalMessage } from 'Utils/GlobalMessage/GlobalMessage';
import { updateAvailableDevices } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { DeviceInfo } from 'Utils/Types';
import AudioDevices from './AudioDevices';
import VideoDevices from './VideoDevices';

export default function MediaDevices() {
	const [videoDevices, setVideoDevices] = useState(store.getState().availableVideoDevices);
	const [audioDevices, setAudioDevices] = useState(store.getState().availableAudioDevices);
	const [usingVideoDevice, setUsingVideoDevice] = useState('');
	const [usingAudioDevice, setUsingAudioDevice] = useState('');
	useEffect(
		() =>
			store.subscribe(() => {
				const storeState = store.getState();
				setVideoDevices(storeState.availableVideoDevices);
				setAudioDevices(storeState.availableAudioDevices);
				setUsingVideoDevice(`${(storeState.usingVideoDevice as DeviceInfo).webLabel}`);
				setUsingAudioDevice(`${(storeState.usingAudioDevice as DeviceInfo).webLabel}`);
			}),
		[]
	);

	useEffect(() => {
		getUserMediaDevices();
	}, []);

	return (
		<>
			<AudioDevices
				audioDevices={audioDevices}
				usingAudioDevice={usingAudioDevice}
				setUsingAudioDevice={setUsingAudioDevice}
			/>
			<VideoDevices
				videoDevices={videoDevices}
				usingVideoDevice={usingVideoDevice}
				setUsingVideoDevice={setUsingVideoDevice}
			/>
			<Button
				type='link'
				style={{ fontSize: '0.9em' }}
				icon={<CustomerServiceOutlined />}
				onClick={() => {
					getUserMediaDevices().then(() => {
						globalMessage.success('设备信息更新完毕', 0.5);
					});
				}}>
				没找到合适的设备？点我重新获取设备
			</Button>
		</>
	);
}

/**
 * 获取用户多媒体设备
 */
function getUserMediaDevices() {
	return new Promise((resolve, reject) => {
		try {
			navigator.mediaDevices.enumerateDevices().then((devices) => {
				const generateDeviceJson = (device: MediaDeviceInfo) => {
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
								return { label, webLabel: label };
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
				resolve({ video: videoDevices, audio: audioDevices });
			});
		} catch (error) {
			console.warn('获取设备时发生错误');
			reject(error);
		}
	});
}
