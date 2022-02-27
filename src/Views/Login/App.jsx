import Icon, { LockOutlined, UserOutlined } from "@ant-design/icons";
import React from "react";
import RippleButton from "Components/RippleButton/RippleButton";
import './App.scss'
import { Victor } from './Victor'
import { Checkbox, Input } from "antd";
import $fetch from "Utils/Fetch/fetch";

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            showRegister: false,
            rotating: false,
            rememberPassword: localStorage.getItem('rememberPassword') === 'true',
            autoLogin: localStorage.getItem('autoLogin') === 'true',
            userId: localStorage.getItem('userId'),
            userPassword: ''
        }
    }

    mainBodyRef = React.createRef()

    componentDidMount() {
        let victor = new Victor("header", "canvas");
        let theme = ["#18bbff", "#00486b"]
        victor(theme).set()
    }

    electron = window.require('electron')

    render() {
        this.electron.ipcRenderer.on('userSafePsw', (event, hasUserPsw, userPsw) => {
            if (hasUserPsw) {
                this.setState({
                    userPassword: userPsw
                })
            }
        })
        return (
            <>
                <div id="dragBar" />
                <div id="mainBody" ref={this.mainBodyRef}>
                    <div id="header">
                        <div id="titleBar"><LogoIcon style={{ fontSize: '1.5rem' }} /><span style={{ fontFamily: 'Microsoft Yahei' }}>山大会议</span>
                            <button className="titleBtn" id="shutdown" title="退出" onClick={() => { this.electron.ipcRenderer.send('quit') }}><ShutdownIcon /></button>
                            <button className="titleBtn" id="minimize" title="最小化" onClick={() => { this.electron.ipcRenderer.send('minimize') }}><MinimizeIcon /></button>
                            <button className="titleBtn" id="switch" title={this.state.showRegister ? "返回登录" : "注册账号"} onClick={() => { this.rotateTable() }}><RegisterIcon /></button>
                        </div>
                        <div id="canvas"></div>
                    </div>
                    <div className="main">
                        <div className="form" id="loginForm" style={{ display: this.state.showRegister ? 'none' : 'block' }}>
                            <div>
                                <Input
                                    placeholder="请输入用户名或邮箱"
                                    spellCheck={false}
                                    prefix={<UserOutlined />}
                                    size={'large'}
                                    style={{ width: '65%' }}
                                    value={this.state.userId}
                                    onChange={(event) => {
                                        this.setState({
                                            userId: event.target.value
                                        })
                                    }}
                                />
                            </div>
                            <div>
                                <Input.Password
                                    placeholder="请输入密码"
                                    spellCheck={false}
                                    prefix={<LockOutlined />}
                                    size={'large'}
                                    style={{ width: '65%' }}
                                    value={this.state.userPassword}
                                    onChange={(event) => {
                                        this.setState({
                                            userPassword: event.target.value
                                        })
                                    }}
                                />
                            </div>
                            <div style={{ marginBlock: '-0.5rem' }}>
                                <Checkbox
                                    style={{ fontSize: '0.75rem' }}
                                    checked={this.state.rememberPassword}
                                    onChange={(e) => {
                                        this.setState({
                                            rememberPassword: e.target.checked
                                        })
                                    }}
                                >
                                    记住密码
                                </Checkbox>
                                <Checkbox
                                    style={{ fontSize: '0.75rem' }}
                                    checked={this.state.autoLogin}
                                    onChange={(e) => {
                                        this.setState({
                                            autoLogin: e.target.checked
                                        })
                                    }}
                                >
                                    自动登录
                                </Checkbox>
                            </div>
                            <div>
                                <RippleButton className="submit" onClick={() => { this.login() }}>登 录</RippleButton>
                            </div>
                        </div>
                        <div className="form" id="registerForm" style={{ display: this.state.showRegister ? 'block' : 'none' }}>
                            <div>

                            </div>
                            <div>

                            </div>
                            <div>
                                <RippleButton className="submit">注 册</RippleButton>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    rotateTable() {
        if (!this.state.rotating) {
            this.setState({
                rotating: true
            }, () => {
                this.mainBodyRef.current.style.animationName = 'rotateOut'
                setTimeout(() => {
                    this.mainBodyRef.current.style.animationName = 'rotateIn'
                    this.setState({
                        showRegister: !this.state.showRegister,
                    }, () => {
                        setTimeout(() => {
                            this.setState({
                                rotating: false
                            })
                        }, 250)
                    })
                }, 250)
            })
        }
    }

    login() {
        // $fetch.post('http://localhost:8080/login', {
        //     username: this.state.userId,
        //     password: this.state.userPassword
        // }).then((res) => {
        //     console.log(res);
        // })

        new Promise((resolve, reject) => {
            resolve()
        }).then(() => {
            localStorage.setItem('rememberPassword', this.state.rememberPassword)
            localStorage.setItem('autoLogin', this.state.autoLogin)
            if (this.state.rememberPassword) {
                if (localStorage.getItem('userId') === this.state.userId) {
                    this.electron.ipcRenderer.send('safePsw', 0);
                } else {
                    this.electron.ipcRenderer.send('safePsw', 1, this.state.userPassword);
                }
            } else {
                this.electron.ipcRenderer.send('safePsw', -1);
            }
            localStorage.setItem('userId', this.state.userId)
        }).then(() => {
            this.electron.ipcRenderer.send('login', this.state.userId)
        })
    }
}

const LogoIcon = props => <Icon component={() => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em">
        <path d="M704.034133 261.905067l253.354667 253.354666a110.8992 110.8992 0 0 1 0 156.842667l-83.421867 83.421867a8.533333 8.533333 0 0 1-12.066133 0l-162.696533-162.7136-170.8544 170.871466-163.242667-163.089066a8.533333 8.533333 0 0 1-0.989867-10.888534l0.989867-1.194666 164.7616-164.5056 162.0992-162.0992a8.533333 8.533333 0 0 1 12.066133 0z m-384.068266 0a8.533333 8.533333 0 0 1 12.066133 0l161.8432 161.8432-331.776 331.776a8.533333 8.533333 0 0 1-10.888533 0.9728l-1.194667-0.9728-83.4048-83.421867a110.8992 110.8992 0 0 1 0-156.842667z" fill="currentColor" />
    </svg>
)} {...props} />

const ShutdownIcon = props => <Icon component={() => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em">
        <path d="M109.9 935.8c-19.5-19.5-19.5-51.2 0-70.7l759.3-759.3c19.5-19.5 51.2-19.5 70.7 0s19.5 51.2 0 70.7L180.6 935.8c-19.6 19.6-51.2 19.6-70.7 0z" fill="currentColor" />
        <path d="M869.1 935.8L109.9 176.5c-19.5-19.5-19.5-51.2 0-70.7s51.2-19.5 70.7 0l759.3 759.3c19.5 19.5 19.5 51.2 0 70.7-19.6 19.6-51.2 19.6-70.8 0z" fill="currentColor" />
    </svg>
)} {...props} />

const MinimizeIcon = props => <Icon component={() => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em">
        <path d="M923 571H130.7c-27.6 0-50-22.4-50-50s22.4-50 50-50H923c27.6 0 50 22.4 50 50s-22.4 50-50 50z" fill="currentColor" />
    </svg>
)} {...props} />

const RegisterIcon = props => <Icon component={() => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em">
        <path d="M789.779 984.843c-31.732 0-61.762-6.041-90.096-18.134-28.334-12.088-53.08-28.709-74.234-49.865-21.151-21.156-37.772-45.897-49.864-74.229-12.087-28.334-18.134-58.362-18.134-90.1 0-31.732 6.047-61.762 18.134-90.095 12.091-28.333 28.714-52.893 49.864-73.664 21.154-20.78 45.899-37.214 74.234-49.301 28.333-12.091 58.363-18.136 90.096-18.136 31.734 0 61.765 6.044 90.098 18.136 28.334 12.087 52.888 28.521 73.665 49.301 20.779 20.774 37.21 45.334 49.3 73.664 12.088 28.333 18.137 58.362 18.137 90.095 0 31.737-6.049 61.766-18.137 90.1s-28.521 53.073-49.3 74.229c-20.78 21.157-45.332 37.778-73.665 49.865C851.545 978.802 821.514 984.843 789.779 984.843L789.779 984.843zM904.244 715.118l-83.865 0 0-78.197c0-10.581-3.395-19.645-10.198-27.203-6.801-7.554-15.489-11.332-26.069-11.332-10.575 0-18.887 3.778-24.929 11.332-6.043 7.559-9.068 16.622-9.068 27.203l0 78.197-73.665 0c-10.575 0-19.641 3.773-27.197 11.334-7.556 7.553-11.333 16.623-11.333 27.197 0 10.575 3.777 18.512 11.333 23.803 7.557 5.288 16.622 7.928 27.197 7.928l73.665 0 0 80.466c0 10.581 3.025 19.645 9.068 27.2 6.042 7.559 14.354 11.332 24.929 11.332 10.58 0 19.267-3.774 26.069-11.332 6.802-7.556 10.198-16.619 10.198-27.2L820.379 785.38l83.865 0 0 2.27c10.579 0 19.644-3.021 27.198-9.063 7.56-6.048 11.333-14.36 11.333-24.936 0-10.574-3.774-19.645-11.333-27.197C923.889 718.892 914.823 715.118 904.244 715.118L904.244 715.118zM624.321 432.927c-3.023 12.086-6.049 23.042-9.07 32.865-3.021 8.311-6.801 16.811-11.332 25.498-4.534 8.688-9.442 15.301-14.731 19.833-6.801 5.289-11.522 10.957-14.167 17-2.645 6.042-4.915 12.271-6.802 18.697-1.887 6.423-3.966 13.03-6.229 19.832-2.271 6.802-6.049 13.602-11.332 20.399-17.383 22.664-30.416 44.578-39.104 65.732-8.688 21.155-14.731 41.554-18.133 61.201-3.398 19.643-4.345 39.102-2.836 58.362 1.513 19.269 4.533 37.969 9.069 56.1 3.022 13.597 7.555 27.764 13.597 42.499 6.048 14.73 14.925 29.844 26.632 45.333 11.711 15.488 26.634 30.595 44.77 45.332 18.13 14.731 40.794 28.896 67.998 42.499-18.135 3.774-39.291 7.177-63.467 10.199-20.402 2.271-45.521 4.343-75.362 6.229-29.845 1.896-64.036 2.836-102.566 2.836-19.646 0-42.499-0.753-68.564-2.265-26.068-1.512-52.885-3.401-80.465-5.666-27.574-2.269-54.779-4.913-81.599-7.935-26.816-3.022-51.376-6.232-73.665-9.634-22.286-3.397-41.178-6.989-56.666-10.767-15.484-3.776-25.119-7.177-28.898-10.197-6.8-6.049-12.085-22.86-15.864-50.436-3.779-27.57-2.645-63.652 3.398-108.229 3.778-24.933 13.789-44.009 30.032-57.235 16.245-13.22 35.321-23.605 57.235-31.165 21.907-7.555 44.764-14.544 68.563-20.968 23.799-6.419 44.768-15.295 62.902-26.627 14.355-9.067 25.311-17.57 32.864-25.501 7.553-7.935 12.843-16.055 15.864-24.368 3.022-8.306 4.534-17 4.534-26.064 0-9.065-0.377-18.888-1.133-29.469-1.514-15.865-6.984-28.333-16.432-37.396-9.445-9.069-19.456-18.136-30.032-27.199-6.049-4.537-11.333-11.331-15.87-20.401-4.533-9.063-8.307-17.753-11.333-26.063-3.774-9.824-6.797-20.779-9.065-32.865-5.29-1.511-10.198-3.778-14.73-6.801-3.779-3.021-7.936-7.559-12.469-13.603-4.532-6.042-8.688-15.107-12.468-27.199-3.779-11.333-5.101-21.908-3.966-31.729 1.132-9.824 3.214-18.134 6.236-24.936 3.022-8.311 7.177-15.49 12.463-21.531 0-25.688 1.516-51.376 4.539-77.069 3.022-21.907 7.741-45.333 14.167-70.26 6.419-24.936 16.811-47.225 31.166-66.864 13.597-18.892 28.144-34.382 43.628-46.466 15.489-12.091 31.546-21.532 48.166-28.333 16.621-6.802 33.244-11.521 49.867-14.167C380.28 1.323 396.149 0 411.26 0c19.643 0 38.529 2.27 56.664 6.802 18.133 4.531 34.943 10.575 50.433 18.134 15.492 7.553 29.279 16.054 41.365 25.499 12.091 9.441 21.913 19.074 29.468 28.896 17.376 21.909 30.031 46.09 37.969 72.53 7.93 26.446 13.783 51.376 17.563 74.799 3.779 27.199 5.291 54.396 4.534 81.602 4.533 3.774 8.312 8.306 11.332 13.596 3.02 4.532 5.29 10.581 6.801 18.134 1.513 7.553 1.513 17 0 28.333-1.512 14.355-4.534 25.688-9.063 34-4.538 8.313-9.445 14.73-14.736 19.269C637.541 426.878 631.117 430.657 624.321 432.927L624.321 432.927z" fill="currentColor" />
    </svg>
)} {...props} />