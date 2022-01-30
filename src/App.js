import './App.css';
import React from 'react';
import { BorderOutlined, ChromeFilled, CloseOutlined, ContactsFilled, MinusOutlined, SwitcherOutlined, UserOutlined, WechatFilled } from '@ant-design/icons/lib/icons';
import { Avatar, Badge, Dropdown, Menu } from 'antd';

class App extends React.Component {
  constructor(props) {
    super(props)
    const onlineStatus = localStorage.getItem('onlineStatus')
    this.state = {
      isMaximized: false,
      nowTag: undefined,
      onlineStatus: onlineStatus === null ? 1 : parseInt(onlineStatus)
    }
    window.electron = window.require('electron') // 全局引入 electron 模块
  }

  componentDidMount() {
    this.initIpcListener(window.electron.ipcRenderer)
  }

  render() {
    return (
      <div className="App">
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
              <div>
                <Badge dot>
                  <WechatFilled className='tab' />
                </Badge>
              </div>
              <div>
                <Badge dot>
                  <ContactsFilled className='tab' />
                </Badge>
              </div>
              <div>
                <Badge dot>
                  <ChromeFilled className='tab' />
                </Badge>
              </div>
            </div>
          </div>
          <div className='content'>

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

}

export default App;
