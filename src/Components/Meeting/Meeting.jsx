import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { CALL_STATUS_CALLING, CALL_STATUS_FREE } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { decodeJWT } from 'Utils/Global';
import { setCallStatus } from 'Utils/Store/actions';
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
		return store.subscribe(() => {
			const state = store.getState();
			if (state.authToken) setUserId(decodeJWT(state.authToken).id);
		});
	}, []);

	useEffect(() => {
		if (meetingInfo) {
			setSfu(new SFU(userId, meetingInfo.joinName, meetingInfo.meetingId));
		} else if (sfu) {
			sfu.socket.close();
			setSfu(undefined);
		}
	}, [meetingInfo]);

	useEffect(() => {
		if (sfu) {
			sfu.on('connect', () => {
				console.log('SFU 连接成功');
				eventBus.emit('ATTEMPT_TO_JOIN');
				sfu.join();
				setJoined(true);
				store.dispatch(setCallStatus(CALL_STATUS_CALLING));
			});
			sfu.on('error', () => {
				message.error('房间连接失败！');
				console.warn('SFU 连接失败');
				eventBus.emit('ATTEMPT_TO_JOIN');
				setSfu(undefined);
			});
		} else {
			setJoined(false);
			store.dispatch(setCallStatus(CALL_STATUS_FREE));
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
