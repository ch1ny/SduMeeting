import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Progress from 'antd/lib/progress';
import Select from 'antd/lib/select';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useRef, useState } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { getDeviceStream } from 'Utils/Global';
import { useVolume } from 'Utils/MyHooks/MyHooks';
import { exchangeMediaDevice } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { DeviceInfo } from 'Utils/Types';

interface AudioDevicesProps {
	audioDevices: Array<DeviceInfo>;
	usingAudioDevice: string;
	setUsingAudioDevice: React.Dispatch<React.SetStateAction<string>>;
}

export default function AudioDevices(props: AudioDevicesProps) {
	const [isExamingMicroPhone, setIsExamingMicroPhone] = useState(false);
	const [isSoundMeterConnecting, setIsSoundMeterConnecting] = useState(false);
	const examMicroPhoneRef = useRef<HTMLAudioElement>(null);

	const [volume, connectStream, disconnectStream] = useVolume();

	useEffect(() => {
		const examMicroPhoneDOM = examMicroPhoneRef.current as HTMLAudioElement;
		if (isExamingMicroPhone) {
			getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE).then((stream) => {
				connectStream(stream).then(() => {
					globalMessage.success('完成音频设备连接');
					setIsSoundMeterConnecting(false);
				});
				examMicroPhoneDOM.srcObject = stream;
				examMicroPhoneDOM.play();
			});
		} else {
			disconnectStream();
			examMicroPhoneDOM.pause();
		}
	}, [isExamingMicroPhone]);

	useEffect(() => {
		const onCloseSettingModal = function () {
			setIsExamingMicroPhone(false);
			setIsSoundMeterConnecting(false);
		};
		eventBus.on('CLOSE_SETTING_MODAL', onCloseSettingModal);
		return () => {
			eventBus.off('CLOSE_SETTING_MODAL', onCloseSettingModal);
		};
	}, []);

	const [noiseSuppression, setNoiseSuppression] = useState(
		localStorage.getItem('noiseSuppression') !== 'false'
	);
	const [echoCancellation, setEchoCancellation] = useState(
		localStorage.getItem('echoCancellation') !== 'false'
	);

	return (
		<div>
			请选择录音设备:
			<Select
				placeholder='请选择录音设备'
				style={{ width: '100%' }}
				onSelect={(
					label: string,
					option: { key: string; value: string; children: string }
				) => {
					props.setUsingAudioDevice(label);
					store.dispatch(
						exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, {
							deviceId: option.key,
							label: option.value,
							webLabel: option.children,
						})
					);
					if (isExamingMicroPhone) {
						getDeviceStream(DEVICE_TYPE.AUDIO_DEVICE).then((stream) => {
							connectStream(stream).then(() => {
								globalMessage.success('完成音频设备连接');
								setIsSoundMeterConnecting(false);
							});
							const examMicroPhoneDOM = examMicroPhoneRef.current as HTMLAudioElement;
							examMicroPhoneDOM.pause();
							examMicroPhoneDOM.srcObject = stream;
							examMicroPhoneDOM.play();
						});
					}
				}}
				value={props.usingAudioDevice}>
				{props.audioDevices.map((device) => (
					<Select.Option value={device.label} key={device.deviceId}>
						{device.webLabel}
					</Select.Option>
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
						percent={volume}
						showInfo={false}
						strokeColor={
							isExamingMicroPhone ? (volume > 70 ? '#e91013' : '#108ee9') : 'gray'
						}
						size='small'
					/>
				</div>
				<audio ref={examMicroPhoneRef} />
			</div>
			<div style={{ display: 'flex', marginTop: '0.5em' }}>
				<div style={{ fontWeight: 'bold' }}>音频选项：</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
					}}>
					<Checkbox
						checked={noiseSuppression}
						onChange={(evt) => {
							setNoiseSuppression(evt.target.checked);
							localStorage.setItem('noiseSuppression', `${evt.target.checked}`);
						}}>
						噪音抑制
					</Checkbox>
					<Checkbox
						checked={echoCancellation}
						onChange={(evt) => {
							setEchoCancellation(evt.target.checked);
							localStorage.setItem('echoCancellation', `${evt.target.checked}`);
						}}>
						回声消除
					</Checkbox>
				</div>
			</div>
		</div>
	);
}
