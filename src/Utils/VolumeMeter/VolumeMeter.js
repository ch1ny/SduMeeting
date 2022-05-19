import { EventEmitter } from 'events';

export default class VolumeMeter extends EventEmitter {
	constructor() {
		super();
	}

	connect(stream) {
		this.audioContext = new AudioContext();
		this.audioContext.audioWorklet
			.addModule('./electronAssets/worklet/volumeMeter.js')
			.then(() => {
				const source = this.audioContext.createMediaStreamSource(stream);
				const node = new AudioWorkletNode(this.audioContext, 'volumeMeter');
				node.port.onmessage = (evt) => {
					if (evt.data.volume) {
						const volume = Math.round(evt.data.volume * 200);
						this.emit('COUNTED_VOLUME', volume);
					}
				};
				source.connect(node).connect(this.audioContext.destination);
				this.emit('STREAM_CONNECTED');
				this.audioWorkletNode = node;
			});
	}

	disconnect() {
		return new Promise((resolve) => {
			if (this.audioWorkletNode) {
				this.audioWorkletNode.disconnect();
				this.audioWorkletNode = null;
				this.audioContext.close().then(() => {
					this.audioContext = null;
				});
				resolve();
			} else {
				resolve();
			}
		});
	}
}
