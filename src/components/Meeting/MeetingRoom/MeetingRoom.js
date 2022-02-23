import { Select } from "antd";
import React from "react";
import { StoreContext } from "../../../app/context";
import { DEVICE_TYPE, exchangeMediaDevice } from "../../../store/actions";
import './MeetingRoom.css'

export default class MeetingRoom extends React.Component {
    static contextType = StoreContext

    constructor(props) {
        super(props)
        this.state = {
            stream: new Blob(),
            videoDevices: [],
            audioDevices: [],
            usingVideoDevice: undefined,
            usingAudioDevice: undefined
        }
        this.audioRef = React.createRef()
        this.videoRef = React.createRef()
        this.setMediaStream = this.setMediaStream.bind(this)
        this.changeCamera = this.changeCamera.bind(this)
        this.changeMicroPhone = this.changeMicroPhone.bind(this)
    }

    componentDidMount() {
        const storeState = this.context.getState()
        this.setState({
            videoDevices: storeState.availableVideoDevices,
            audioDevices: storeState.availableAudioDevices,
            usingVideoDevice: storeState.usingVideoDevice,
            usingAudioDevice: storeState.usingAudioDevice
        })
        if (storeState.usingVideoDevice) this.setMediaStream(DEVICE_TYPE.VIDEO_DEVICE, storeState.usingVideoDevice)
        if (storeState.usingAudioDevice) this.setMediaStream(DEVICE_TYPE.AUDIO_DEVICE, storeState.usingAudioDevice)
    }

    async setMediaStream(mediaType, object) {
        switch (mediaType) {
            case DEVICE_TYPE.VIDEO_DEVICE:
                switch (object.value) {
                    case 'screen':
                        this.videoRef.current.srcObject = await window.navigator.mediaDevices.getDisplayMedia()
                        break
                    case null:
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
                if (object.value) {
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

    changeMicroPhone(label, object) {
        this.setState({ usingAudioDevice: label })
        this.context.dispatch(exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, object))
        this.setMediaStream(DEVICE_TYPE.AUDIO_DEVICE, object)
    }

    changeCamera(label, object) {
        this.setState({ usingVideoDevice: label })
        this.context.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, object))
        this.setMediaStream(DEVICE_TYPE.VIDEO_DEVICE, object)
    }

    render() {
        const { Option } = Select
        return (
            <>
                <div id="videoContainer">
                    <video id="video" width="100%" height="100%" autoPlay={true} ref={this.videoRef} />
                    <audio id="audio" autoPlay={true} ref={this.audioRef} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Select placeholder='请选择录音设备' style={{ width: 'calc(40vw)' }} onSelect={this.changeMicroPhone} value={this.state.usingAudioDevice}>
                        {
                            this.state.audioDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                        }
                    </Select>
                    <Select placeholder='请选择录像设备' style={{ width: 'calc(40vw)' }} onSelect={this.changeCamera} value={this.state.usingVideoDevice}>
                        {
                            this.state.videoDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                        }
                    </Select>
                </div>
            </>
        )
    }
}