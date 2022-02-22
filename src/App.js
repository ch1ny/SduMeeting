import './App.css';
import React from 'react';
import { BorderOutlined, CloseOutlined, ContactsFilled, MediumCircleFilled, MessageFilled, MinusOutlined, SwitcherOutlined, UserOutlined } from '@ant-design/icons/lib/icons';
import { Avatar, Badge, Dropdown, Menu } from 'antd';
import Meeting from './components/Meeting/Meeting';

class App extends React.Component {
  constructor(props) {
    super(props)
    const onlineStatus = localStorage.getItem('onlineStatus')
    this.state = {
      isMaximized: false,
      selectedTabDiv: undefined,
      onlineStatus: onlineStatus === null ? 1 : parseInt(onlineStatus)
    }
    window.electron = window.require('electron') // 全局引入 electron 模块
  }

  componentDidMount() {
    this.initIpcListener(window.electron.ipcRenderer)

    /**
     * 事件代理选择Tab (时间换空间)
     */
    const tabContainer = document.querySelector('.tabContainer')
    tabContainer.addEventListener('click', (event) => {
      if (event.target === tabContainer) {
        return
      }
      for (const index in event.path) {
        const element = event.path[index];
        if (element.nodeName.toLowerCase() === 'div' && element.classList.contains('tabDiv')) {
          if (this.state.selectedTabDiv !== undefined) {
            this.state.selectedTabDiv.querySelector('.ant-badge')
              .querySelector('.tab')
              .classList.remove('selected')
          }
          const badge = element.querySelector('.ant-badge')
          const tab = badge.querySelector('.tab')
          tab.classList.add('selected')
          this.setState({
            selectedTabDiv: element
          }, () => {
            console.log(this.state.selectedTabDiv.getAttribute('tab_id'));
          })
          break;
        }
      }
    })
  }

  render() {
    return (
      <div className="App" >
        <div className='dragBar'>
          <button className="titleBtn" id="shutdown" title="退出" onClick={() => { window.electron.ipcRenderer.send('quit') }}>
            <CloseOutlined />
          </button>
          <button className="titleBtn" id="maximize" title={this.state.isMaximized ? "还原" : "最大化"} onClick={() => {
            window.electron.ipcRenderer.send('maximize')
          }}>
            {
              this.state.isMaximized ? <SwitcherOutlined /> : <BorderOutlined />
            }
          </button>
          <button className="titleBtn" id="minimize" title="最小化" onClick={() => { window.electron.ipcRenderer.send('minimize') }}>
            <MinusOutlined />
          </button>
        </div>
        <div className='mainBody'>
          <div className='tabbar'>
            <div className='avatarContainer'>
              <Dropdown overlay={(
                <Menu style={{ width: '5rem' }} onClick={({ key }) => {
                  const newStatus = parseInt(key)
                  if (this.state.onlineStatus !== newStatus) {
                    this.setState({
                      onlineStatus: newStatus
                    })
                    localStorage.setItem('onlineStatus', newStatus)
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
              )} trigger={['click']}>
                <Badge dot color={this.computeOnlineStatusColor()} style={{ transition: '500ms' }}>
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
          <div className='content'>
            {
              ((tabDiv) => {
                if (tabDiv === undefined) {
                  return (<></>)
                }
                switch (tabDiv.getAttribute('tab_id')) {
                  case '0':
                    return (
                      <>

                      </>)
                  case '1':
                    return (
                      <>

                      </>
                    )
                  case '2':
                    return (
                      <>
                        <Meeting />
                      </>
                    )
                }
              })(this.state.selectedTabDiv)
            }
          </div>
        </div>
      </div>
    );
  }

  initIpcListener(ipc) {
    ipc.on('exchangeMax', () => {
      this.setState({ isMaximized: !this.state.isMaximized })
    })
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
    }
  }

  /**
   * 获取麦克风设备
   * @returns {Promise} 麦克风设备
   */
  getMicrophones() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      for (const key in devices) {
        const element = devices[key];
        if (element.kind === 'audioinput') {
          const formerIndex = element.label.indexOf(' (')
          const latterIndex = element.label.lastIndexOf(' (')
          const type = ((deviceId) => {
            switch (deviceId) {
              case 'default':
                return 'default'
              case 'communications':
                return 'communications'
              default:
                return 'device'
            }
          })(element.deviceId)
          const label = ((label, type) => {
            switch (type) {
              case 'default':
                return label.replace('Default - ', '')
              case 'communications':
                return label.replace('Communications - ', '')
              default:
                return label
            }
          })(formerIndex === latterIndex ? element.label : element.label.substring(0, latterIndex), type)
          console.log({
            type,
            label
          });
        }
      }
    })
  }

  /**
   * 获取摄像头设备
   * @returns {Promise} 摄像头设备
   */
  getCameras() {
    return navigator.mediaDevices.enumerateDevices().then((devices) => devices.filter((device) => device.kind === 'videoinput'))
  }
}

export default App;
