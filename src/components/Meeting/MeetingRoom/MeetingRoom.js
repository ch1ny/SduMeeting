import { Select } from "antd";
import React from "react";
import { StoreContext } from "../../../app/context";
import { DEVICE_TYPE, exchangeMediaDevice } from "../../../store/actions";
import store from "../../../store/store";
import './MeetingRoom.css'

export default class MeetingRoom extends React.Component {
    static contextType = StoreContext

    constructor(props) {
        super(props)
        this.state = {
            stream: new Blob(),
            usingVideoDevice: store.getState().availableVideoDevices,
            usingAudioDevice: store.getState().availableAudioDevices,
            unsubscribe: store.subscribe(() => {
                this.setState({
                    usingVideoDevice: store.getState().availableVideoDevices,
                    usingAudioDevice: store.getState().availableAudioDevices
                }, () => {
                    if (store.getState().usingVideoDevice) this.setMediaStream(DEVICE_TYPE.VIDEO_DEVICE, store.getState().usingVideoDevice)
                    if (store.getState().usingAudioDevice) this.setMediaStream(DEVICE_TYPE.AUDIO_DEVICE, store.getState().usingAudioDevice)
                })
            })
        }
        this.audioRef = React.createRef()
        this.videoRef = React.createRef()
        this.setMediaStream = this.setMediaStream.bind(this)
    }

    componentDidMount() {
        if (store.getState().usingVideoDevice) this.setMediaStream(DEVICE_TYPE.VIDEO_DEVICE, store.getState().usingVideoDevice)
        if (store.getState().usingAudioDevice) this.setMediaStream(DEVICE_TYPE.AUDIO_DEVICE, store.getState().usingAudioDevice)
    }

    componentWillUnmount() {
        this.state.unsubscribe()
    }

    async setMediaStream(mediaType, object) {
        switch (mediaType) {
            case DEVICE_TYPE.VIDEO_DEVICE:
                switch (object.value) {
                    case 'screen':
                        this.videoRef.current.srcObject = await window.navigator.mediaDevices.getDisplayMedia()
                        break
                    case 'null':
                        this.videoRef.current.srcObject = null
                        break
                    default:
                        const videoConstraints = {
                            deviceId: {
                                exact: object.key
                            }
                        }
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
                        this.videoRef.current.srcObject = videoStream
                        break
                }
                break
            case DEVICE_TYPE.AUDIO_DEVICE:
                if (object.value !== 'null') {
                    const audioConstraints = {
                        deviceId: {
                            exact: object.key
                        }
                    }
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
                    this.audioRef.current.srcObject = audioStream
                } else {
                    this.audioRef.current.srcObject = null
                }
                break
            default:
                console.warn('汤暖暖的，你能有这么多设备？');
        }
    }

    render() {
        return (
            <>
                <div id="videoContainer">
                    <video id="video" width="100%" height="100%" autoPlay={true} ref={this.videoRef} />
                    <audio id="audio" autoPlay={true} ref={this.audioRef} />
                </div>
            </>
        )
    }
}