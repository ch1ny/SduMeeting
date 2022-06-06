import React, { useEffect, useRef } from 'react';
import './style.scss';

interface MemberProps {
	stream: MediaStream;
	muted: boolean;
	member: string;
}

export default function Member(props: MemberProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		(videoRef.current as HTMLVideoElement).srcObject = props.stream;
	}, [props.stream]);

	return (
		<div className='meetingMember'>
			<video
				width='100%'
				height='100%'
				ref={videoRef}
				autoPlay={true}
				muted={props.muted}
				className='meetingMemberVideo'
			/>
			<span className='memberName' title={props.member}>
				{props.member}
			</span>
		</div>
	);
}
