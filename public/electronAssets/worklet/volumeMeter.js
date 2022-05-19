// /worklet/vumeter.js
/* eslint-disable no-underscore-dangle */
const SMOOTHING_FACTOR = 0.8;
registerProcessor(
	'volumeMeter',
	class extends AudioWorkletProcessor {
		_volume;
		_updateIntervalInMS;
		_nextUpdateFrame;

		constructor() {
			super();
			this._volume = 0;
			this._updateIntervalInMS = 50;
			this._nextUpdateFrame = this._updateIntervalInMS;
			this.port.onmessage = (event) => {
				if (event.data.updateIntervalInMS) {
					this._updateIntervalInMS = event.data.updateIntervalInMS;
					// console.log(event.data.updateIntervalInMS);
				}
			};
		}

		get intervalInFrames() {
			// eslint-disable-next-line no-undef
			return (this._updateIntervalInMS * sampleRate) / 1000;
		}

		process(inputs, outputs, parameters) {
			const input = inputs[0];

			// Note that the input will be down-mixed to mono; however, if no inputs are
			// connected then zero channels will be passed in.
			if (input.length > 0) {
				const samples = input[0];
				let sum = 0;

				// Calculated the squared-sum.
				for (const sample of samples) {
					sum += sample * sample;
				}

				// Calculate the RMS level and update the volume.
				const rms = Math.sqrt(sum / samples.length);
				this._volume = Math.max(rms, this._volume * SMOOTHING_FACTOR);

				// Update and sync the volume property with the main thread.
				this._nextUpdateFrame -= samples.length;
				if (this._nextUpdateFrame < 0) {
					this._nextUpdateFrame += this.intervalInFrames;
					this.port.postMessage({ volume: this._volume });
				}
			}

			return true;
		}
	}
);
