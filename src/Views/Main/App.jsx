import React from 'react';
import './App.scss';
import {
	BorderOutlined,
	CloseOutlined,
	ContactsFilled,
	MediumCircleFilled,
	MessageFilled,
	MinusOutlined,
	SettingOutlined,
	SwitcherOutlined,
	UserOutlined,
} from '@ant-design/icons/lib/icons';
import { Avatar, Badge, Dropdown, Menu } from 'antd';
import Meeting from 'Components/Meeting/Meeting';
import { DEVICE_TYPE, exchangeMediaDevice, updateAvailableDevices } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import Setting from 'Components/Setting/Setting';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		const onlineStatus = localStorage.getItem('onlineStatus');
		this.state = {
			isMaximized: false,
			selectedTabDiv: undefined,
			onlineStatus: onlineStatus === null ? 1 : parseInt(onlineStatus),
			showSetting: false,
		};
		window.electron = window.require('electron'); // 全局引入 electron 模块
	}

	componentDidMount() {
		this.overwriteGetDisplayMedia();
		this.initIpcListener(window.electron.ipcRenderer);
		this.getUserMediaDevices();
		this.proxyForChoosingTab();
	}

	settingFatherDomRef = React.createRef();

	render() {
		return (
			<div className='App'>
				<div className='dragBar'>
					<button
						className='titleBtn'
						id='shutdown'
						title='退出'
						onClick={() => {
							window.electron.ipcRenderer.send('QUIT');
						}}>
						<CloseOutlined />
					</button>
					<button
						className='titleBtn'
						id='maximize'
						title={this.state.isMaximized ? '还原' : '最大化'}
						onClick={() => {
							window.electron.ipcRenderer.send(
								'EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS'
							);
						}}>
						{this.state.isMaximized ? <SwitcherOutlined /> : <BorderOutlined />}
					</button>
					<button
						className='titleBtn'
						id='minimize'
						title='最小化'
						onClick={() => {
							window.electron.ipcRenderer.send('MINIMIZE_MAIN_WINDOW');
						}}>
						<MinusOutlined />
					</button>
					<button
						className='titleBtn'
						id='setting'
						title='设置'
						onClick={() => {
							this.setState({ showSetting: true });
						}}>
						<SettingOutlined />
					</button>
				</div>
				<div className='mainBody'>
					<div className='tabbar'>
						<div className='avatarContainer'>
							<Dropdown
								overlay={
									<Menu
										style={{ width: '5rem' }}
										onClick={({ key }) => {
											const newStatus = parseInt(key);
											if (this.state.onlineStatus !== newStatus) {
												this.setState({
													onlineStatus: newStatus,
												});
												localStorage.setItem('onlineStatus', newStatus);
											}
										}}>
										<Menu.Item key={1} style={{ fontSize: '0.75rem' }}>
											<Badge dot color='green' />
											在线
										</Menu.Item>
										<Menu.Item key={2} style={{ fontSize: '0.75rem' }}>
											<Badge dot color='gold' />
											离开
										</Menu.Item>
										<Menu.Item key={3} style={{ fontSize: '0.75rem' }}>
											<Badge dot color='red' />
											忙碌
										</Menu.Item>
										<Menu.Item key={0} style={{ fontSize: '0.75rem' }}>
											<Badge dot color='#c3c3c3' />
											隐身
										</Menu.Item>
									</Menu>
								}
								trigger={['click']}>
								<Badge
									dot
									color={this.computeOnlineStatusColor()}
									style={{ transition: '500ms' }}>
									<Avatar shape='square' icon={<UserOutlined />} size={40} />
								</Badge>
							</Dropdown>
						</div>
						<div className='tabContainer'>
							<div className='tabDiv' tab_id={0}>
								<Badge dot>
									<MessageFilled className='tab' />
								</Badge>
							</div>
							<div className='tabDiv' tab_id={1}>
								<Badge dot>
									<ContactsFilled className='tab' />
								</Badge>
							</div>
							<div className='tabDiv' tab_id={2}>
								<Badge dot>
									<MediumCircleFilled className='tab' />
								</Badge>
							</div>
						</div>
					</div>
					<div className='content' ref={this.settingFatherDomRef}>
						{((tabDiv) => {
							if (tabDiv === undefined) {
								return <></>;
							}
							return (
								<>
									<div
										style={{
											display:
												this.state.selectedTabDiv.getAttribute('tab_id') ===
												'0'
													? 'block'
													: 'none',
										}}>
										聊天
									</div>
									<div
										style={{
											display:
												this.state.selectedTabDiv.getAttribute('tab_id') ===
												'2'
													? 'block'
													: 'none',
											width: '100%',
											height: '100%',
										}}>
										<Meeting />
									</div>
								</>
							);
						})(this.state.selectedTabDiv)}
						<Setting
							visible={this.state.showSetting}
							closeFunc={() => {
								this.setState({ showSetting: false });
							}}
							fatherRef={this.settingFatherDomRef}
						/>
					</div>
				</div>
			</div>
		);
	}

	initIpcListener(ipc) {
		ipc.on('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS', () => {
			this.setState({ isMaximized: !this.state.isMaximized });
		});
	}

	/**
	 * 在线状态
	 * 0: 离线
	 * 1: 在线
	 * 2: 离开
	 * 3: 忙碌
	 */
	computeOnlineStatusColor() {
		switch (this.state.onlineStatus) {
			case 0:
				return '#c3c3c3';
			case 1:
				return 'green';
			case 2:
				return 'gold';
			case 3:
				return 'red';
			default:
				return 'rgba(0,0,0,0)';
		}
	}

	/**
	 * 获取用户多媒体设备
	 */
	getUserMediaDevices() {
		navigator.mediaDevices.enumerateDevices().then((devices) => {
			const generateDeviceJson = (device) => {
				const formerIndex = device.label.indexOf(' (');
				const latterIndex = device.label.lastIndexOf(' (');
				const { label, webLabel } = ((label, deviceId) => {
					switch (deviceId) {
						case 'default':
							return {
								label: label.replace('Default - ', ''),
								webLabel: label.replace('Default - ', '默认 - '),
							};
						case 'communications':
							return {
								label: label.replace('Communications - ', ''),
								webLabel: label.replace('Communications - ', '通讯设备 - '),
							};
						default:
							return { label: label, webLabel: label };
					}
				})(
					formerIndex === latterIndex
						? device.label
						: device.label.substring(0, latterIndex),
					device.deviceId
				);
				return { label, webLabel, deviceId: device.deviceId };
			};
			let videoDevices = [],
				audioDevices = [];
			for (const index in devices) {
				const device = devices[index];
				if (device.kind === 'videoinput') {
					videoDevices.push(generateDeviceJson(device));
				} else if (device.kind === 'audioinput') {
					audioDevices.push(generateDeviceJson(device));
				}
			}
			store.dispatch(updateAvailableDevices(DEVICE_TYPE.VIDEO_DEVICE, videoDevices));
			store.dispatch(updateAvailableDevices(DEVICE_TYPE.AUDIO_DEVICE, audioDevices));
			const lastVideoDevice = localStorage.getItem('usingVideoDevice');
			const lastAudioDevice = localStorage.getItem('usingAudioDevice');
			(() => {
				store.dispatch(exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, videoDevices[0]));
				for (const device of videoDevices) {
					if (device.deviceId === lastVideoDevice) {
						store.dispatch(
							exchangeMediaDevice(DEVICE_TYPE.VIDEO_DEVICE, {
								key: device.deviceId,
								value: device.label,
								children: device.webLabel,
							})
						);
						return;
					}
				}
			})();
			(() => {
				store.dispatch(exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, audioDevices[0]));
				for (const device of audioDevices) {
					if (device.deviceId === lastAudioDevice) {
						store.dispatch(
							exchangeMediaDevice(DEVICE_TYPE.AUDIO_DEVICE, {
								key: device.deviceId,
								value: device.label,
								children: device.webLabel,
							})
						);
						return;
					}
				}
			})();
		});
	}

	/**
	 * 事件代理选择Tab (时间换空间)
	 */
	proxyForChoosingTab() {
		const tabContainer = document.querySelector('.tabContainer');
		tabContainer.addEventListener('click', (event) => {
			if (event.target === tabContainer) {
				return;
			}
			for (const index in event.path) {
				const element = event.path[index];
				if (
					element.nodeName.toLowerCase() === 'div' &&
					element.classList.contains('tabDiv')
				) {
					if (this.state.selectedTabDiv !== undefined) {
						this.state.selectedTabDiv
							.querySelector('.ant-badge')
							.querySelector('.tab')
							.classList.remove('selected');
					}
					const badge = element.querySelector('.ant-badge');
					const tab = badge.querySelector('.tab');
					tab.classList.add('selected');
					this.setState(
						{
							selectedTabDiv: element,
						},
						() => {
							// console.log(this.state.selectedTabDiv.getAttribute('tab_id'));
						}
					);
					break;
				}
			}
		});
	}

	/**
	 * 重写 window.mediaDevices.getDisplayMedia() 方法
	 */
	overwriteGetDisplayMedia() {
		window.navigator.mediaDevices.getDisplayMedia = () => {
			return new Promise(async (resolve, reject) => {
				try {
					const source = await window.electron.ipcRenderer.invoke('DESKTOP_CAPTURE');
					const stream = await window.navigator.mediaDevices.getUserMedia({
						audio: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: source.id,
							},
						},
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: source.id,
							},
						},
					});
					resolve(stream);
				} catch (err) {
					reject(err);
				}
			});
		};
	}

	returnTabbarStyleByTheme(theme) {
		switch (theme) {
			case 'True Sunset':
				return 'linear-gradient(to bottom, #fa709a 0%, #fee140 100%)';
			case 'Above Clouds':
				return 'linear-gradient(to bottom, #29323c 0%, #485563 100%)';
			case 'Love Kiss':
				return 'linear-gradient(to top, #ff0844 0%, #ffb199 100%)';
		}
	}
}
