import { EventEmitter } from 'events';

export default class SoundMeter extends EventEmitter {
	instant;
	script;
	clip;
	slow;
	context;
	mic;
	constructor(context) {
		super();
		this.context = context;
		this.instant = 0.0;
		this.slow = 0.0;
		this.clip = 0.0;
		this.script = context.createScriptProcessor(4096, 1, 1);
		this.script.onaudioprocess = (event) => {
			const inputs = event.inputBuffer.getChannelData(0);
			let volume = 0;
			const clipcount = 0;
			for (const input of inputs) {
				volume = Math.max(volume, input);
			}
			this.instant = volume;
			this.emit('COUNTED_VOLUME', volume);
			this.slow = 0.95 * this.slow + 0.05 * this.instant;
			this.clip = clipcount / inputs.length;
		};
	}
	connectToSource = (stream, callback) => {
		console.log('SoundMeter connecting');
		try {
			this.mic = this.context.createMediaStreamSource(stream);
			this.mic.connect(this.script);
			// necessary to make sample run, but should not be.
			this.script.connect(this.context.destination);
			if (typeof callback !== 'undefined') {
				callback(null);
			}
		} catch (e) {
			console.error(e);
			if (typeof callback !== 'undefined') {
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
