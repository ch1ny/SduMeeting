import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Progress, Select } from 'antd';
import { CustomerServiceOutlined } from '@ant-design/icons';
import store from 'Utils/Store/store';
import SoundMeter from 'Utils/SoundMeter/SoundMeter';
import { DEVICE_TYPE, exchangeMediaDevice, updateAvailableDevices } from 'Utils/Store/actions';
import eventBus from 'Utils/EventBus/EventBus';

const { Option } = Select;

export default function MediaDevices() {
	message.config({
		maxCount: 1,
	});

	const [videoDevices, setVideoDevices] = useState(store.getState().availableVideoDevices);
	const [audioDevices, setAudioDevices] = useState(store.getState().availableAudioDevices);
	const [usingVideoDevice, setUsingVideoDevice] = useState(undefined);
	const [usingAudioDevice, setUsingAudioDevice] = useState(undefined);
	useEffect(() =>
		store.subscribe(() => {
			const storeState = store.getState();
			setVideoDevices(storeState.availableVideoDevices);
			setAudioDevices(storeState.availableAudioDevices);
			setUsingVideoDevice(storeState.usingVideoDevice);
			setUsingAudioDevice(storeState.usingAudioDevice);
		})
	);

	useEffect(() => {
		getUserMediaDevices();
	}, []);

	const [isExamingMicroPhone, setIsExamingMicroPhone] = useState(false);
	const [microPhoneVolume, setMicroPhoneVolume] = useState(0);
	const [soundMeter, setSoundMeter] = useState(null);
	const [isSoundMeterConnecting, setIsSoundMeterConnecting] = useState(false);
	const examMicroPhoneRef = useRef();
	useEffect(() => {
		setSoundMeter(new SoundMeter(new window.AudioContext()));
		return () => {
			if (soundMeter) soundMeter.stop();
			setSoundMeter(null);
		};
	}, []);
	useEffect(() => {
		if (soundMeter) {
			soundMeter.on('STREAM_CONNECTED', () => {
				message.success('完成音频设备连接');
				setIsSoundMeterConnecting(false);
			});
			soundMeter.on('COUNTED_VOLUME', (volume) => {
				setMicroPhoneVolume(Number((volume * 100).toFixed(0)));
			});
		}
	}, [soundMeter]);
	useEffect(() => {
		if (isExamingMicroPhone) {
			soundMeterConnect(examMicroPhoneRef, soundMeter);
		} else {
			if (soundMeter) {
				soundMeter.stop();
				examMicroPhoneRef.current.pause();
				examMicroPhoneRef.current.srcObject = null;
			}
			setMicroPhoneVolume(0);
		}
	}, [isExamingMicroPhone]);

	const [isExamingCamera, setIsExamingCamera] = useState(false);
	const examCameraRef = useRef();
	useEffect(() => {
		if (isExamingCamera) {
			videoConnect(examCameraRef);
		} else {
			examCameraRef.current.pause();
			examCameraRef.current.srcObject = null;
		}
	}, [isExamingCamera]);

	useEffect(() => {
		const onCloseSettingModal = function () {
			setIsExamingCamera(false);
			setIsExamingMicroPhone(false);
			setIsSoundMeterConnecting(false);
		};
		eventBus.on('CLOSE_SETTING_MODAL', onCloseSettingModal);
		return () => {
			eventBus.off('CLOSE_SETTING_MODAL', onCloseSettingModal);
		};
	}, []);
	return (
		<>
			请选择录音设备:
			<Select
				placeholder='请选择录音设备'
				style={{ width: '100%' }}
				onSelect={(label, option) => {
					setUsingAudioDevice(label);
					store.dispatch(exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, option));
					if (isExamingMicroPhone) {
						soundMeter.stop();
						soundMeterConnect(examMicroPhoneRef, soundMeter);
					}
				}}
				value={usingAudioDevice}>
				{audioDevices.map((device) => (
					<Option value={device.label} key={device.deviceId}>
						{device.webLabel}
					</Option>
				))}
			</Select>
			<div style={{ marginTop: '0.25rem', display: 'flex' }}>
				<div style={{ height: '1.2rem' }}>
					<Button
						style={{ width: '7em' }}
						onClick={() => {
							if (!isExamingMicroPhone) setIsSoundMeterConnecting(true);
							setIsExamingMicroPhone(!isExamingMicroPhone);
						}}
						loading={isSoundMeterConnecting}>
						{isExamingMicroPhone ? '停止检查' : '检查麦克风'}
					</Button>
				</div>
				<div style={{ width: '50%', margin: '0.25rem' }}>
					<Progress
						percent={microPhoneVolume}
						showInfo={false}
						strokeColor={
							isExamingMicroPhone
								? microPhoneVolume > 70
									? '#e91013'
									: '#108ee9'
								: 'gray'
						}
						size='small'
					/>
				</div>
				<audio ref={examMicroPhoneRef} />
			</div>
			<br />
			请选择录像设备:
			<Select
				placeholder='请选择录像设备'
				style={{ width: '100%' }}
				onSelect={(label, option) => {
					setUsingVideoDevice(label);
					store.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, option));
					if (isExamingCamera) {
						videoConnect(examCameraRef);
					}
				}}
				value={usingVideoDevice}>
				{videoDevices.map((device) => (
					<Option value={device.label} key={device.deviceId}>
						{device.webLabel}
					</Option>
				))}
			</Select>
			<div style={{ margin: '0.25rem' }}>
				<Button
					style={{ width: '7em' }}
					onClick={() => {
						setIsExamingCamera(!isExamingCamera);
					}}>
					{isExamingCamera ? '停止检查' : '检查摄像头'}
				</Button>
			</div>
			<div
				style={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
				}}>
				<video ref={examCameraRef} style={{ background: 'black', width: '95%' }} />
			</div>
			<Button
				type='link'
				style={{ fontSize: '0.9em' }}
				icon={<CustomerServiceOutlined />}
				onClick={() => {
					getUserMediaDevices().then(() => {
						message.success('设备信息更新完毕', 0.5);
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
				resolve({ video: videoDevices, audio: audioDevices });
			});
		} catch (error) {
			console.warn('获取设备时发生错误');
			reject(error);
		}
	});
}

async function soundMeterConnect(examMicroPhoneRef, soundMeter) {
	const device = store.getState().usingAudioDevice;
	const audioConstraints = {
		deviceId: {
			exact: device.key,
		},
	};
	const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
	examMicroPhoneRef.current.srcObject = audioStream;
	examMicroPhoneRef.current.play();
	soundMeter.connectToSource(audioStream, (err) => {
		if (err) {
			console.log(err);
			return;
		}
	});
}

async function videoConnect(examCameraRef) {
	const device = store.getState().usingVideoDevice;
	switch (device.value) {
		case 'screen':
			examCameraRef.current.srcObject = await window.navigator.mediaDevices.getDisplayMedia();
			break;
		case 'null':
			examCameraRef.current.srcObject = null;
			break;
		default:
			const videoConstraints = {
				deviceId: {
					exact: device.key,
				},
			};
			const videoStream = await navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
			});
			examCameraRef.current.srcObject = videoStream;
			break;
	}
	examCameraRef.current.play();
}
