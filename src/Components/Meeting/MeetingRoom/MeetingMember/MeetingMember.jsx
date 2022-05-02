import React, { useEffect, useRef } from 'react';
import './style.scss';

export default function MeetingMember(props) {
	const videoRef = useRef();
	useEffect(() => {
		videoRef.current.srcObject = props.stream;
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
