import React, { useEffect, useRef } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import { eWindow } from 'Utils/Types';

interface MainVideoProps {
	muted: boolean;
	stream: MediaStream;
	streamName: string;
}

export default function MainVideo(props: MainVideoProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		(videoRef.current as HTMLVideoElement).srcObject = props.stream;
	}, [props.stream]);

	useEffect(() => {
		/**
		 * INFO: 进入画中画模式
		 */
		const videoDOM = videoRef.current as HTMLVideoElement;
		const _requestPictureInPicture = () => {
			videoDOM.requestPictureInPicture();
		};
		eventBus.on('MAIN_WINDOW_MINIMIZE', _requestPictureInPicture);
		/**
		 * INFO: 退出画中画模式
		 */
		const _exitPictureInPicture = () => {
			document.exitPictureInPicture();
		};
		videoDOM.addEventListener('enterpictureinpicture', function () {
			eWindow.ipc.once('MAIN_WINDOW_RESTORE', _exitPictureInPicture);
		});
		videoDOM.addEventListener('leavepictureinpicture', function () {
			eWindow.ipc.send('MAIN_WINDOW_RESTORE');
			eWindow.ipc.removeListener('MAIN_WINDOW_RESTORE', _exitPictureInPicture);
		});
		return () => {
			eventBus.off('MAIN_WINDOW_MINIMIZE', _requestPictureInPicture);
		};
	}, []);

	return (
		<div id='mainVideo'>
			<div id='streamName'>正在观看: {props.streamName}</div>
			<video
				id='video'
				width='100%'
				height='100%'
				autoPlay={true}
				ref={videoRef}
				// NOTE: 有人分享屏幕时解除静音
				muted={props.muted}
			/>
		</div>
	);
}
