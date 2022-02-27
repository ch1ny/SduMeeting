import React from "react";
// import Draggable from 'react-draggable';
import { Anchor, Button, Checkbox, Modal, Progress, Select } from "antd";
import store from "Utils/Store/store";
import { DEVICE_TYPE, exchangeMediaDevice, updateAvailableDevices } from "Utils/Store/actions";
import './style.scss';
import SoundMeter from "Components/SoundMeter/SoundMeter";

const { Link } = Anchor

export default class Setting extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            videoDevices: store.getState().availableVideoDevices,
            audioDevices: store.getState().availableAudioDevices,
            usingVideoDevice: undefined,
            usingAudioDevice: undefined,
            unsubscribe: store.subscribe(() => {
                this.setState({
                    videoDevices: store.getState().availableVideoDevices,
                    audioDevices: store.getState().availableAudioDevices,
                    usingVideoDevice: store.getState().usingVideoDevice,
                    usingAudioDevice: store.getState().usingAudioDevice
                })
            }),
            isExamingMicroPhone: false,
            microPhoneVolume: 0,
            isExamingCamera: false,
            autoLogin: localStorage.getItem('autoLogin') === 'true'
        }
        this.soundMeter = new SoundMeter(new window.AudioContext())
    }

    componentDidMount() {
        this.getUserMediaDevices()
    }

    componentWillUnmount() {
        this.state.unsubscribe()
    }

    // examMicroPhoneRef = React.createRef()
    examMicroPhoneInterval = undefined
    examCameraRef = React.createRef()

    render() {
        const { Option } = Select
        return (
            <>
                <Modal
                    title={
                        <div
                            onMouseOver={() => {
                                this.setState({ draggable: true })
                            }}
                            onMouseOut={() => {
                                this.setState({ draggable: false })
                            }}
                            style={{ width: '100%', userSelect: 'none' }}
                        >
                            设置
                        </div>
                    }
                    visible={this.props.visible}
                    closable={false}
                    onCancel={() => { this.onModalClose() }}
                    getContainer={this.props.fatherRef}
                    destroyOnClose={true}
                    centered={true}
                    zIndex={1000}
                    footer={null}
                >
                    <div className="settingContainer">
                        <div className="anchorContainer">
                            <Anchor getContainer={() => document.querySelector('.settingContainer .settings')}>
                                <Link href="#login" title="登录" />
                                <Link href="#mediaDevices" title="音视频通话" />
                            </Anchor>
                        </div>
                        <div className="settings">
                            <>
                                <div>
                                    <h2 id="login">登录</h2>
                                    <Checkbox
                                        checked={this.state.autoLogin}
                                        onChange={(e) => {
                                            this.setState({
                                                autoLogin: e.target.checked
                                            })
                                            localStorage.setItem('autoLogin', e.target.checked)
                                        }}
                                    >
                                        自动登录
                                    </Checkbox>
                                </div>
                                <div>
                                    <h2 id="mediaDevices">音视频通话</h2>
                                    请选择录音设备:
                                    <Select placeholder='请选择录音设备' style={{ width: '100%' }} onSelect={(label, option) => { this.changeMicroPhone(label, option) }} value={this.state.usingAudioDevice}>
                                        {
                                            this.state.audioDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                                        }
                                        <Option value={undefined} key={null}>禁用</Option>
                                    </Select>
                                    <div style={{ marginTop: '0.25rem', display: 'flex' }}>
                                        <div style={{ height: '1.2rem' }}>
                                            <Button style={{ width: '7em' }} onClick={() => { this.examMicroPhone() }}>
                                                {this.state.isExamingMicroPhone ? '停止检查' : '检查麦克风'}
                                            </Button>
                                        </div>
                                        <div style={{ width: '50%', margin: '0.25rem' }}>
                                            <Progress percent={this.state.microPhoneVolume} showInfo={false} strokeColor={this.state.isExamingMicroPhone ? (this.state.microPhoneVolume > 60 ? '#e91013' : '#108ee9') : 'gray'} size='small' />
                                        </div>
                                        {/* <audio ref={this.examMicroPhoneRef} /> */}
                                    </div>
                                    <br />
                                    请选择录像设备:
                                    <Select placeholder='请选择录像设备' style={{ width: '100%' }} onSelect={(label, option) => { this.changeCamera(label, option) }} value={this.state.usingVideoDevice}>
                                        {
                                            this.state.videoDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                                        }
                                        <Option value={undefined} key={null}>禁用</Option>
                                    </Select>
                                    <div style={{ margin: '0.25rem' }}>
                                        <Button style={{ width: '7em' }} onClick={() => { this.examCamera() }}>
                                            {this.state.isExamingCamera ? '停止检查' : '检查摄像头'}
                                        </Button>
                                    </div>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        <video ref={this.examCameraRef} style={{ background: 'black', width: '95%' }} />
                                    </div>
                                </div>
                            </>
                        </div>
                    </div>
                </Modal>
            </>
        )
    }

    /**
     * 获取用户多媒体设备
     */
    getUserMediaDevices() {
        return new Promise((resolve, reject) => {
            try {
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
                    let videoDevices = [], audioDevices = []
                    for (const index in devices) {
                        const device = devices[index];
                        if (device.kind === 'videoinput') {
                            videoDevices.push(generateDeviceJson(device))
                        } else if (device.kind === 'audioinput') {
                            audioDevices.push(generateDeviceJson(device))
                        }
                    }
                    videoDevices = [{ label: 'screen', webLabel: '屏幕抓取', deviceId: 'screen' }].concat(videoDevices);
                    store.dispatch(updateAvailableDevices(DEVICE_TYPE.VIDEO_DEVICE, videoDevices));
                    store.dispatch(updateAvailableDevices(DEVICE_TYPE.AUDIO_DEVICE, audioDevices));
                    resolve({ video: videoDevices, audio: audioDevices })
                })
            } catch (error) {
                console.warn('获取设备时发生错误');
                reject(error)
            }
        })
    }

    changeMicroPhone(label, object) {
        this.setState({ usingAudioDevice: label })
        store.dispatch(exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, object))
        if (this.state.isExamingMicroPhone) {
            this.soundMeter.stop()
            this.soundMeterConnect()
        }
    }

    changeCamera(label, object) {
        this.setState({ usingVideoDevice: label })
        store.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, object))
        if (this.state.isExamingCamera) {
            this.videoConnect()
        }
    }

    examMicroPhone() {
        if (this.state.isExamingMicroPhone) {
            new Promise((resolve) => {
                this.soundMeter.stop()
                // this.examMicroPhoneRef.current.pause()
                // this.examMicroPhoneRef.current.srcObject = null
                clearInterval(this.examMicroPhoneInterval)
                resolve()
            }).then(() => {
                this.setState({
                    microPhoneVolume: 0
                })
            })
        } else {
            this.soundMeterConnect()
        }
        this.setState({
            isExamingMicroPhone: !this.state.isExamingMicroPhone
        })
    }

    async soundMeterConnect() {
        const device = store.getState().usingAudioDevice
        const audioConstraints = {
            deviceId: {
                exact: device.key
            }
        }
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        // this.examMicroPhoneRef.current.srcObject = audioStream
        // this.examMicroPhoneRef.current.play()
        this.soundMeter.connectToSource(audioStream, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            this.examMicroPhoneInterval = setInterval(() => {
                const volume = Number((this.soundMeter.instant * 100).toFixed(0))
                this.setState({
                    microPhoneVolume: volume > 100 ? 100 : volume
                })
            }, 100)
        })
    }

    examCamera() {
        if (this.state.isExamingCamera) {
            this.examCameraRef.current.pause()
            this.examCameraRef.current.srcObject = null
        } else {
            this.videoConnect()
        }
        this.setState({
            isExamingCamera: !this.state.isExamingCamera
        })
    }

    async videoConnect() {
        const device = store.getState().usingVideoDevice
        switch (device.value) {
            case 'screen':
                this.examCameraRef.current.srcObject = await window.navigator.mediaDevices.getDisplayMedia()
                break
            case 'null':
                this.examCameraRef.current.srcObject = null
                break
            default:
                const videoConstraints = {
                    deviceId: {
                        exact: device.key
                    }
                }
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
                this.examCameraRef.current.srcObject = videoStream
                break
        }
        this.examCameraRef.current.play()
    }

    onModalClose() {
        this.props.closeFunc();
        this.getUserMediaDevices()
        this.setState({
            isExamingMicroPhone: false,
            microPhoneVolume: 0,
            isExamingCamera: false
        })
        if (this.examMicroPhoneInterval) {
            clearInterval(this.examMicroPhoneInterval)
            this.examMicroPhoneInterval = null
        }
    }
}