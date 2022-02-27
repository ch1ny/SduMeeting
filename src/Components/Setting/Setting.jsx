import React from "react";
// import Draggable from 'react-draggable';
import { Anchor, Modal, Select } from "antd";
import store from "Utils/Store/store";
import { DEVICE_TYPE, exchangeMediaDevice, updateAvailableDevices } from "Utils/Store/actions";
import './style.scss';

const { Link } = Anchor

export default class Setting extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            bounds: { left: 0, top: 0, bottom: 0, right: 0 },
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
            })
        }
    }

    componentDidMount() {
        this.getUserMediaDevices()
    }

    componentWillUnmount() {
        this.state.unsubscribe()
    }

    componentDidUpdate(prevProps) {
        if (prevProps === false) {
            this.getUserMediaDevices()
        }
    }

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
                    onCancel={this.props.closeFunc}
                    getContainer={this.props.fatherRef}
                    destroyOnClose={true}
                    centered={true}
                    zIndex={1000}
                    footer={null}
                >
                    <div className="settingContainer">
                        <div className="anchorContainer">
                            <Anchor getContainer={() => document.querySelector('.settingContainer .settings')}>
                                <Link href="#mediaDevices" title="音视频通话" />
                            </Anchor>
                        </div>
                        <div className="settings">
                            <>
                                <h2 id="mediaDevices">音视频通话</h2>
                                请选择录音设备:
                                <Select placeholder='请选择录音设备' style={{ width: 'calc(35vw)' }} onSelect={(label, option) => { this.changeMicroPhone(label, option) }} value={this.state.usingAudioDevice}>
                                    {
                                        this.state.audioDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                                    }
                                    <Option value={undefined} key={null}>禁用</Option>
                                </Select>
                                <br />
                                请选择录像设备:
                                <Select placeholder='请选择录像设备' style={{ width: 'calc(35vw)' }} onSelect={(label, option) => { this.changeCamera(label, option) }} value={this.state.usingVideoDevice}>
                                    {
                                        this.state.videoDevices.map((device) => (<Option value={device.label} key={device.deviceId}>{device.webLabel}</Option>))
                                    }
                                    <Option value={undefined} key={null}>禁用</Option>
                                </Select>
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
    }

    changeCamera(label, object) {
        this.setState({ usingVideoDevice: label })
        store.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, object))
    }
}