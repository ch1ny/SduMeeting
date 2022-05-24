import {
    ClockCircleOutlined,
    CommentOutlined,
    ForwardOutlined,
    PlusOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Button, Checkbox, Divider, Empty, Form, Input, Modal } from 'antd';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useState } from 'react';
import { CALL_STATUS_FREE, CALL_STATUS_OFFERING } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { decodeJWT, getMainContent } from 'Utils/Global';
import { setCallStatus } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { MeetingInfo } from '../Meeting';
import './style.scss';

interface MeetingListProps {
    joinMeeting: (values: MeetingInfo) => any;

}

export default function MeetingList(props: MeetingListProps) {
    const [meetings, setMeetings] = useState([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showRandomModal, setShowRandomModal] = useState(false);

    const [autoOpenMicroPhone, setAutoOpenMicroPhone] = useState(
        localStorage.getItem('autoOpenMicroPhone') === 'true'
    );
    const [autoOpenCamera, setAutoOpenCamera] = useState(
        localStorage.getItem('autoOpenCamera') === 'true'
    );

    const [isJoining, setIsJoining] = useState(false);

    const [username, setUsername] = useState('');
    useEffect(() => {
        return store.subscribe(() => {
            const authToken = store.getState().authToken;
            if (authToken) {
                setUsername(decodeJWT(authToken).username);
            }
        });
    }, []);

    return (
        <>
            <div className='meetingList'>
                <div className='header'>
                    <div className='meetingBtns'>
                        <MeetingButton
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setShowJoinModal(true);
                            }}>
                            加入会议
                        </MeetingButton>
                        <MeetingButton
                            icon={<ForwardOutlined />}
                            onClick={() => {
                                setShowRandomModal(true);
                            }}>
                            快速会议
                        </MeetingButton>
                        <MeetingButton icon={<ClockCircleOutlined />}>预定会议</MeetingButton>
                    </div>
                    <Divider style={{ margin: '1rem' }} />
                </div>
                <div className='list'>
                    {meetings.length === 0 ? (
                        <Empty
                            description={
                                <div>
                                    <div>暂无会议</div>
                                    <Button>现在预定</Button>
                                </div>
                            }
                        />
                    ) : (
                        <></>
                    )}
                </div>
            </div>
            <Modal
                title={'加入会议'}
                visible={showJoinModal}
                footer={null}
                onCancel={() => {
                    setShowJoinModal(false);
                }}
                getContainer={getMainContent}
                closable={false}
                maskClosable={!isJoining}
                destroyOnClose={false}>
                <Form
                    className='join-form'
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={(values) => {
                        if (store.getState().callStatus === CALL_STATUS_FREE) {
                            store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
                            setIsJoining(true);
                            eventBus.once('ATTEMPT_TO_JOIN', () => {
                                setIsJoining(false);
                                setShowJoinModal(false);
                            });
                            values.autoOpenCamera = autoOpenCamera;
                            values.autoOpenMicroPhone = autoOpenMicroPhone;
                            props.joinMeeting(values);
                        } else {
                            globalMessage.error('应用当前不处于空闲通话状态！');
                        }
                    }}>
                    <Form.Item
                        name='meetingId'
                        rules={[
                            {
                                message: '会议号由至少9位的纯数字组成',
                                pattern: /^[0-9]{9,}$/,
                            },
                            {
                                required: true,
                                message: '请输入会议号',
                            },
                        ]}>
                        <Input
                            prefix={<CommentOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                            placeholder='输入会议号'
                        />
                    </Form.Item>
                    <Form.Item
                        name='joinName'
                        initialValue={username}
                        rules={[
                            {
                                required: true,
                                message: '请输入与会名称',
                            },
                        ]}>
                        <Input
                            prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                            placeholder='您的名称'
                        />
                    </Form.Item>
                    <Form.Item>
                        <Checkbox
                            checked={autoOpenMicroPhone}
                            onChange={(e) => {
                                setAutoOpenMicroPhone(e.target.checked);
                                localStorage.setItem('autoOpenMicroPhone', `${e.target.checked}`);
                            }}>
                            与会时打开麦克风
                        </Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Checkbox
                            checked={autoOpenCamera}
                            onChange={(e) => {
                                setAutoOpenCamera(e.target.checked);
                                localStorage.setItem('autoOpenCamera', `${e.target.checked}`);
                            }}>
                            与会时打开摄像头
                        </Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Button type='primary' htmlType='submit' loading={isJoining}>
                            加入会议
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={'快速会议'}
                visible={showRandomModal}
                footer={null}
                onCancel={() => {
                    setShowRandomModal(false);
                }}
                getContainer={getMainContent}
                closable={false}
                maskClosable={!isJoining}
                destroyOnClose={false}>
                <Form
                    className='join-form'
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={(values) => {
                        if (store.getState().callStatus === CALL_STATUS_FREE) {
                            store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
                            setIsJoining(true);
                            eventBus.once('ATTEMPT_TO_JOIN', () => {
                                setIsJoining(false);
                                setShowRandomModal(false);
                            });
                            // TODO: 这里是快速生成的随机会议号
                            values.meetingId = `${Math.floor(Math.random() * 1e9)}`;
                            values.autoOpenCamera = autoOpenCamera;
                            values.autoOpenMicroPhone = autoOpenMicroPhone;
                            props.joinMeeting(values);
                        } else {
                            globalMessage.error('应用当前不处于空闲通话状态！');
                        }
                    }}>
                    <Form.Item
                        name='joinName'
                        initialValue={username}
                        rules={[
                            {
                                required: true,
                                message: '请输入与会名称',
                            },
                        ]}>
                        <Input
                            prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                            placeholder='您的名称'
                        />
                    </Form.Item>
                    <Form.Item>
                        <Checkbox
                            checked={autoOpenMicroPhone}
                            onChange={(e) => {
                                setAutoOpenMicroPhone(e.target.checked);
                                localStorage.setItem('autoOpenMicroPhone', `${e.target.checked}`);
                            }}>
                            与会时打开麦克风
                        </Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Checkbox
                            checked={autoOpenCamera}
                            onChange={(e) => {
                                setAutoOpenCamera(e.target.checked);
                                localStorage.setItem('autoOpenCamera', `${e.target.checked}`);
                            }}>
                            与会时打开摄像头
                        </Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Button type='primary' htmlType='submit' loading={isJoining}>
                            加入会议
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

interface MeetingButtonProps {
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    icon: React.ReactNode;
    children: React.ReactNode;
}
function MeetingButton(props: MeetingButtonProps) {
    return (
        <>
            <div className='meetingBtn' onClick={props.onClick}>
                <div className='iconContainer'>
                    <span>{props.icon}</span>
                </div>
                <div className='textContainer'>{props.children}</div>
            </div>
        </>
    );
}
