import { PlusCircleOutlined } from "@ant-design/icons"
import { Dropdown, Empty, Menu } from "antd"
import ChatInput from "Components/ChatComponent/ChatInput"
import React, { useState } from "react"
import './style.scss'

export default function Chats() {
    const [nowChatting, setNowChatting] = useState(undefined)

    const plusMenu = (
        <Menu>
            <Menu.Item key={'addFriend'}>添加好友</Menu.Item>
        </Menu>
    )

    return (
        <>
            <div id="chatsHeader">
                <div id="chatsTitle">
                    {nowChatting ? nowChatting : '聊天界面'}
                </div>
                <div id="controlPanel">
                    <Dropdown overlay={plusMenu} placement='bottomRight' trigger={'click'}>
                        <div className="controlButton">
                            <PlusCircleOutlined />
                        </div>
                    </Dropdown>
                </div>
            </div>
            <div id="chatsContainer">
                <div id="chatsFriendsPanel">
                </div>
                <div id="chatsMainPanel">
                    {
                        !nowChatting
                            ? <ChatMainComponent />
                            : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* 
                                        根据人机交互课的知识
                                        人会将页面中心看得偏上一点
                                        因此这里将空状态组件向上移动了一段距离
                                    */}
                                    <Empty
                                        style={{ marginBottom: '15%' }}
                                        description={
                                            <>
                                                <span>找个好友聊天吧</span>
                                            </>
                                        }
                                    />
                                </div>
                            )
                    }
                </div>
            </div>
        </>
    )
}

function ChatMainComponent(props) {
    return (
        <div id="chatMainComponent">
            <div id="chatMessages" />
            <div id="chatInput">
                <ChatInput />
            </div>
        </div>
    )
}