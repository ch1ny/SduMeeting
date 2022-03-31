import React, { useState } from 'react';
import MeetingList from './MeetingList/MeetingList';
import MeetingRoom from './MeetingRoom/MeetingRoom';
import './style.scss';

export default function Meeting() {
	const [meetingInfo, setMeetingInfo] = useState(null);

	return (
		<>
			{meetingInfo === null ? (
				<MeetingList joinMeeting={setMeetingInfo} />
			) : (
				<MeetingRoom
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
