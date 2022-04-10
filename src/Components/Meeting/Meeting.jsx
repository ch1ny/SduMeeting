import React, { useEffect, useState } from 'react';
import SFU from 'Utils/WebRTC/SFU';
import MeetingList from './MeetingList/MeetingList';
import MeetingRoom from './MeetingRoom/MeetingRoom';
import './style.scss';

export default function Meeting() {
	const [meetingInfo, setMeetingInfo] = useState(null);
	const [sfu, setSfu] = useState(undefined);
	useEffect(() => {
		if (meetingInfo) {
			setSfu(new SFU(meetingInfo.joinName, meetingInfo.joinName, meetingInfo.meetingId));
		} else if (sfu) {
			sfu.socket.close();
			setSfu(undefined);
		}
	}, [meetingInfo]);

	return (
		<>
			{meetingInfo === null ? (
				<MeetingList joinMeeting={setMeetingInfo} />
			) : (
				<MeetingRoom
					sfu={sfu}
					meetingId={meetingInfo.meetingId}
					joinName={meetingInfo.joinName}
					leaveMeeting={() => {
						setMeetingInfo(null);
					}}
				/>
			)}
		</>
	);
}
