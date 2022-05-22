import { EventEmitter } from 'events';

export default class VolumeMeter extends EventEmitter {
    audioContext!: AudioContext | null;
    audioWorkletNode!: AudioWorkletNode | null;

    constructor() {
        super();
    }

    connect(stream: MediaStream) {
        this.audioContext = new AudioContext();
        this.audioContext.audioWorklet
            .addModule('../electronAssets/worklet/volumeMeter.js')
            .then(() => {
                const source = (this.audioContext as AudioContext).createMediaStreamSource(stream);
                const node = new AudioWorkletNode((this.audioContext as AudioContext), 'volumeMeter');
                node.port.onmessage = (evt) => {
                    if (evt.data.volume) {
                        const volume = Math.round(evt.data.volume * 200);
                        this.emit('COUNTED_VOLUME', volume);
                    }
                };
                source.connect(node).connect((this.audioContext as AudioContext).destination);
                this.emit('STREAM_CONNECTED');
                this.audioWorkletNode = node;
            });
    }

    disconnect() {
        return new Promise<void>((resolve) => {
            if (this.audioWorkletNode) {
                this.audioWorkletNode.disconnect();
                this.audioWorkletNode = null;
                (this.audioContext as AudioContext).close().then(() => {
                    this.audioContext = null;
                });
                resolve();
            } else {
                resolve();
            }
        });
    }
}
