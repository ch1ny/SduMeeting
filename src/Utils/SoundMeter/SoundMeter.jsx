import { EventEmitter } from 'events';

export default class SoundMeter extends EventEmitter {
	script;
	context;
	mic;
	constructor(context) {
		super();
		this.context = context;
		let instant = 0.0,
			slow = 0.0;
		this.script = context.createScriptProcessor(4096, 1, 1);
		this.script.onaudioprocess = (event) => {
			const inputs = event.inputBuffer.getChannelData(0);
			let volume = 0;
			for (const input of inputs) {
				volume = Math.max(volume, input);
			}
			instant = volume;
			this.emit('COUNTED_VOLUME', volume);
			slow = 0.95 * slow + 0.05 * instant;
		};
	}
	connectToSource = (stream, callback) => {
		console.log('SoundMeter connecting');
		try {
			this.mic = this.context.createMediaStreamSource(stream);
			this.mic.connect(this.script);
			// necessary to make sample run, but should not be.
			this.script.connect(this.context.destination);
			if (typeof callback === 'function') {
				callback(null);
			}
		} catch (e) {
			console.error(e);
			if (typeof callback === 'function') {
				callback(e);
			}
		}
	};
	stop = () => {
		this.mic.disconnect();
		this.script.disconnect();
		return 0;
	};
}
