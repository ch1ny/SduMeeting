import { AudioMutedOutlined, AudioOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import Menu from 'antd/lib/menu';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './style.scss';

interface MemberProps {
	stream: MediaStream;
	muted: boolean;
	member: string;
}

export default function Member(props: MemberProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		(videoRef.current as HTMLVideoElement).setAttribute('memberName', props.member);
	}, []);
	useEffect(() => {
		(videoRef.current as HTMLVideoElement).srcObject = props.stream;
	}, [props.stream]);

	const [muted, setMuted] = useState(false);
	const innerDom = useMemo(
		() => (
			<div className='meetingMember'>
				<video
					width='100%'
					height='100%'
					ref={videoRef}
					autoPlay={true}
					muted={props.muted || muted}
					className='meetingMemberVideo'
				/>
				<span className='memberName' title={props.member}>
					{props.member}{' '}
					{props.muted || muted ? <AudioMutedOutlined /> : <AudioOutlined />}
				</span>
			</div>
		),
		[muted]
	);

	return (
		<>
			{props.muted ? (
				innerDom
			) : (
				<Dropdown
					overlay={
						<Menu
							items={[
								{
									label: muted ? '取消静音' : '暂时静音',
									key: `MeetingMembersMuteButton`,
									onClick: () => {
										setMuted(!muted);
									},
								},
							]}
						/>
					}
					trigger={['contextMenu']}>
					{innerDom}
				</Dropdown>
			)}
		</>
	);
}
