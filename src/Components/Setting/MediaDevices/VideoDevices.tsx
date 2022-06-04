import Button from 'antd/lib/button';
import Select from 'antd/lib/select';
import React, { useEffect, useRef, useState } from 'react';
import { DEVICE_TYPE } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { getDeviceStream } from 'Utils/Global';
import { exchangeMediaDevice } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { DeviceInfo } from 'Utils/Types';

interface VideoDevicesProps {
	videoDevices: Array<DeviceInfo>;
	usingVideoDevice: string;
	setUsingVideoDevice: React.Dispatch<React.SetStateAction<string>>;
}

export default function VideoDevices(props: VideoDevicesProps) {
	const [isExamingCamera, setIsExamingCamera] = useState(false);
	const examCameraRef = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		if (isExamingCamera) {
			videoConnect(examCameraRef);
		} else {
			const examCameraDOM = examCameraRef.current as HTMLVideoElement;
			examCameraDOM.pause();
			examCameraDOM.srcObject = null;
		}
	}, [isExamingCamera]);

	useEffect(() => {
		const onCloseSettingModal = function () {
			setIsExamingCamera(false);
		};
		eventBus.on('CLOSE_SETTING_MODAL', onCloseSettingModal);
		return () => {
			eventBus.off('CLOSE_SETTING_MODAL', onCloseSettingModal);
		};
	}, []);

	return (
		<div>
			请选择录像设备:
			<Select
				placeholder='请选择录像设备'
				style={{ width: '100%' }}
				onSelect={(
					label: string,
					option: { key: string; value: string; children: string }
				) => {
					props.setUsingVideoDevice(label);
					store.dispatch(
						exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, {
							deviceId: option.key,
							label: option.value,
							webLabel: option.children,
						})
					);
					if (isExamingCamera) {
						videoConnect(examCameraRef);
					}
				}}
				value={props.usingVideoDevice}>
				{props.videoDevices.map((device) => (
					<Select.Option value={device.label} key={device.deviceId}>
						{device.webLabel}
					</Select.Option>
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
				<video
					ref={examCameraRef}
					style={{
						background: 'black',
						width: '40vw',
						height: 'calc(40vw / 1920 * 1080)',
					}}
				/>
			</div>
		</div>
	);
}

async function videoConnect(examCameraRef: React.RefObject<HTMLVideoElement>) {
	const videoStream = await getDeviceStream(DEVICE_TYPE.VIDEO_DEVICE);
	const examCameraDOM = examCameraRef.current as HTMLVideoElement;
	examCameraDOM.srcObject = videoStream;
	examCameraDOM.play();
}
