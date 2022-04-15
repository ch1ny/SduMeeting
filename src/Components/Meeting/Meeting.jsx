import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import store from 'Utils/Store/store';
import SFU from 'Utils/WebRTC/SFU';
import MeetingList from './MeetingList/MeetingList';
import MeetingRoom from './MeetingRoom/MeetingRoom';
import './style.scss';

export default function Meeting() {
	const [meetingInfo, setMeetingInfo] = useState(undefined);
	const [sfu, setSfu] = useState(undefined);
	const [joined, setJoined] = useState(false);

	const [userId, setUserId] = useState(undefined);
	useEffect(() => {
		setUserId(jwtDecode(store.getState().authToken).id);
	}, []);

	useEffect(() => {
		if (meetingInfo) {
			setSfu(new SFU(userId, meetingInfo.joinName, meetingInfo.meetingId));
		} else if (sfu) {
			sfu.socket.close();
			setJoined(false);
			setSfu(undefined);
		}
	}, [meetingInfo]);

	useEffect(() => {
		if (sfu) {
			sfu.on('connect', () => {
				console.log('SFU 连接成功');
				sfu.join();
				setJoined(true);
			});
			sfu.on('error', () => {
				console.warn('SFU 连接失败');
				setJoined(false);
				setSfu(undefined);
			});
		}
	}, [sfu]);

	return (
		<>
			{joined && meetingInfo ? (
				<MeetingRoom
					sfu={sfu}
					meetingId={meetingInfo.meetingId}
					userId={userId}
					joinName={meetingInfo.joinName}
					autoOpenMicroPhone={meetingInfo.autoOpenMicroPhone}
					autoOpenCamera={meetingInfo.autoOpenCamera}
					leaveMeeting={() => {
						setMeetingInfo(undefined);
					}}
				/>
			) : (
				<MeetingList joinMeeting={setMeetingInfo} />
			)}
		</>
	);
}
