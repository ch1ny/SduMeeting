import { CopyOutlined, DisconnectOutlined, LeftOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import React, { useRef } from 'react';
import { globalMessage } from 'Utils/GlobalMessage/GlobalMessage';

interface TopbarProps {
	leaveMeeting: Function;
	meetingId: string;
}

export default function Topbar(props: TopbarProps) {
	const meetingIdRef = useRef<HTMLSpanElement>(null);

	return (
		<div className='topbar'>
			<Button
				type='text'
				className='btn'
				onClick={() => {
					Modal.confirm({
						title: '退出会议',
						icon: <DisconnectOutlined />,
						content: '您确认要退出会议吗？',
						onOk: () => {
							props.leaveMeeting();
						},
					});
				}}>
				<LeftOutlined />
				退出会议
			</Button>
			<span id='meetingIdSpan' ref={meetingIdRef}>
				{props.meetingId}
			</span>
			<Button
				type='text'
				id='copyBtn'
				title='复制会议号'
				onClick={() => {
					const clipBoard = navigator.clipboard;
					clipBoard.writeText(props.meetingId).then(() => {
						globalMessage.success('会议号复制成功');
					});
				}}>
				<CopyOutlined />
			</Button>
		</div>
	);
}
