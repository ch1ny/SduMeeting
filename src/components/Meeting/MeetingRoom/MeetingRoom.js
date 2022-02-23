import { Select } from "antd";
import React from "react";
import './MeetingRoom.css'

export default class MeetingRoom extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            stream: new Blob(),
            videoDevices: [{ label: 'screen', webLabel: '屏幕抓取', deviceId: 'screen' }],
            audioDevices: []
        }
        this.audioRef = React.createRef()
        this.videoRef = React.createRef()
        this.changeMicroPhone = this.changeMicroPhone.bind(this)
        this.changeCamera = this.changeCamera.bind(this)
    }

    async componentDidMount() {
        this.getUserMediaDevices()
    }

    getUserMediaDevices() {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const generateDeviceJson = (device) => {
                const formerIndex = device.label.indexOf(' (')
                const latterIndex = device.label.lastIndexOf(' (')
                const { label, webLabel } = ((label, deviceId) => {
                    switch (deviceId) {
                        case 'default':
                            return { label: label.replace('Default - ', ''), webLabel: label.replace('Default - ', '默认 - ') }
                        case 'communications':
                            return { label: label.replace('Communications - ', ''), webLabel: label.replace('Communications - ', '通讯设备 - ') }
                        default:
                            return { label: label, webLabel: label }
                    }
                })(formerIndex === latterIndex ? device.label : device.label.substring(0, latterIndex), device.deviceId)
                return { label, webLabel, deviceId: device.deviceId }
            }
            let videoDevices = [{ label: 'screen', webLabel: '屏幕抓取', deviceId: 'screen' }], audioDevices = []
            for (const index in devices) {
                const device = devices[index];
                if (device.kind === 'videoinput') {
                    videoDevices.push(generateDeviceJson(device))
                } else if (device.kind === 'audioinput') {
                    audioDevices.push(generateDeviceJson(device))
                }
            }
            this.setState({ videoDevices, audioDevices })
        })
    }

    async changeMicroPhone(label, object) {
        const audioConstraints = {
            deviceId: {
                exact: object.key
            }
        }
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        this.audioRef.current.srcObject = audioStream
    }

    async changeCamera(label, object) {
        if (label === 'screen') {
            this.videoRef.current.srcObject = await window.navigator.mediaDevices.getDisplayMedia()
        } else {
            const videoConstraints = {
                deviceId: {
                    exact: object.key
                }
            }
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
            this.videoRef.current.srcObject = videoStream
        }
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
                    <Select placeholder='请选择录音设备' style={{ width: 'calc(40vw)' }} onSelect={this.changeMicroPhone}>
                        {
                            this.state.audioDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                        }
                    </Select>
                    <Select placeholder='请选择录像设备' style={{ width: 'calc(40vw)' }} onSelect={this.changeCamera}>
                        {
                            this.state.videoDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                        }
                    </Select>
                </div>
            </>
        )
    }
}