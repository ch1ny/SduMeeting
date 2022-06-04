export const AUDIO_TYPE = {
	MESSAGE_RECEIVED: 'info',
	WEBRTC_CALLING: 'call',
	WEBRTC_ANSWERING: 'answer',
};

export const buildPropmt = function (audioType: string, loop = false) {
	const audioContext = new AudioContext();
	let source = audioContext.createBufferSource();
	const audio = require(`./audios/${audioType}.aac`);

	let abortController = new AbortController();
	let abortSignal = abortController.signal;

	const startAudioPropmt = () => {
		if (source.buffer) {
			source.stop();
			source = audioContext.createBufferSource();
		}
		fetch(audio.default, {
			signal: abortSignal,
		})
			.then((res) => {
				return res.arrayBuffer();
			})
			.then((arrayBuffer) => {
				return audioContext.decodeAudioData(arrayBuffer, (decodeData) => {
					return decodeData;
				});
			})
			.then((audioBuffer) => {
				stopAudioPropmt();
				source.buffer = audioBuffer;
				source.loop = loop;
				source.connect(audioContext.destination);
				source.start(0);
			})
			.catch((message) => {
				console.log(message);
			});
	};

	const stopAudioPropmt = () => {
		if (source.buffer) {
			source.stop();
			source = audioContext.createBufferSource();
		} else {
			abortController.abort();
			abortController = new AbortController();
			abortSignal = abortController.signal;
		}
	};
	return [startAudioPropmt, stopAudioPropmt];
};
