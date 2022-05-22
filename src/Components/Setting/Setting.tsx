import { SettingFilled } from '@ant-design/icons';
import { Anchor, Divider, Modal, Typography } from 'antd';
import React, { useEffect } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import { getMainContent } from 'Utils/Global';
import About from './About/About';
import General from './General/General';
import MediaDevices from './MediaDevices/MediaDevices';
import MeetingStatus from './MeetingStatus/MeetingStatus';
import './style.scss';

const { Link } = Anchor;
const { Title } = Typography;

interface SettingProps {
    visible: boolean,
    closeFunc: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
}

export default function Setting(props: SettingProps) {
    useEffect(() => {
        if (!props.visible) eventBus.emit('CLOSE_SETTING_MODAL');
    }, [props.visible]);

    return (
        <>
            <Modal
                title={<div style={{ width: '100%', userSelect: 'none' }}>设置</div>}
                visible={props.visible}
                closable={false}
                onCancel={props.closeFunc}
                centered={true}
                zIndex={1000}
                getContainer={getMainContent}
                footer={null}
                width='65vw'
                destroyOnClose={false}>
                <div className='settingContainer'>
                    <div className='anchorContainer'>
                        <Anchor
                            getContainer={
                                () => {
                                    const container = document.querySelector('.settingContainer .settings') as HTMLElement
                                    if (container) return container
                                    else return document.body;
                                }
                            }>
                            <Link href='#general' title='通用设置' />
                            <Link href='#mediaDevices' title='音视频设备' />
                            <Link href='#meetingStatus' title='与会状态' />
                            <Link href='#about' title='关于' />
                        </Anchor>
                    </div>
                    <div className='settings'>
                        <div>
                            <Title level={3} id='general'>
                                通用设置
                            </Title>
                            <General />
                        </div>
                        <Divider>
                            <SettingFilled />
                        </Divider>
                        <div>
                            <Title level={3} id='mediaDevices'>
                                音视频设备
                            </Title>
                            <MediaDevices />
                        </div>
                        <Divider>
                            <SettingFilled />
                        </Divider>
                        <div>
                            <Title level={3} id='meetingStatus'>
                                与会状态
                            </Title>
                            <MeetingStatus />
                        </div>
                        <Divider>
                            <SettingFilled />
                        </Divider>
                        <div>
                            <Title level={3} id='about'>
                                关于
                            </Title>
                            <About />
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
