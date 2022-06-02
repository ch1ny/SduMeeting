import { useCallback } from 'react';

const { useState, useRef, useReducer, useEffect } = require('react');

/**
 * 【自定义Hooks】保留数据在上一个时刻的状态
 * @param {any} value 需要保留的数据
 * @returns 数据在上一时刻的状态
 */
const usePrevious = (value: any): typeof value => {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
};

const useVolume = () => {
	const [volume, setVolume] = useState(0);
	const ref = useRef({});

	const onmessage = useCallback((evt) => {
		if (!ref.current.audioContext) {
			return;
		}
		if (evt.data.volume) {
			setVolume(Math.round(evt.data.volume * 200));
		}
	}, []);

	const disconnectAudioContext = useCallback(() => {
		if (ref.current.node) {
			try {
				ref.current.node.disconnect();
			} catch (err) {}
		}
		if (ref.current.source) {
			try {
				ref.current.source.disconnect();
			} catch (err) {}
		}
		ref.current.node = null;
		ref.current.source = null;
		ref.current.audioContext = null;
		setVolume(0);
	}, []);

	const connectAudioContext = useCallback(
		async (mediaStream: MediaStream) => {
			if (ref.current.audioContext) {
				disconnectAudioContext();
			}
			try {
				ref.current.audioContext = new AudioContext();
				await ref.current.audioContext.audioWorklet.addModule(
					'../electronAssets/worklet/volumeMeter.js'
				);
				if (!ref.current.audioContext) {
					return;
				}
				ref.current.source = ref.current.audioContext.createMediaStreamSource(mediaStream);
				ref.current.node = new AudioWorkletNode(ref.current.audioContext, 'vumeter');
				ref.current.node.port.onmessage = onmessage;
				ref.current.source
					.connect(ref.current.node)
					.connect(ref.current.audioContext.destination);
			} catch (errMsg) {
				disconnectAudioContext();
			}
		},
		[disconnectAudioContext, onmessage]
	);

	return [volume, connectAudioContext, disconnectAudioContext];
};

export { usePrevious, useVolume };
