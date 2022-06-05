import Asider from 'Components/Asider/Asider';
import Chats from 'Components/Chats/Chats';
import DragBar from 'Components/DragBar/DragBar';
import Meeting from 'Components/Meeting/Meeting';
import User from 'Components/User/User';
import React, { useEffect, useState } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import './style.scss';

export default function Index() {
	const [selectedTab, setSelectedTab] = useState(0);
	useEffect(() => {
		eventBus.on('GET_PRIVATE_CALLED', () => {
			setSelectedTab(0);
		});
		return () => {
			eventBus.offAll('GET_PRIVATE_CALLED');
		};
	}, []);

	return (
		<>
			<DragBar />
			<div className='mainBody'>
				<Asider selectedTab={selectedTab} tabOnClick={setSelectedTab} />
				<div className='content' id='mainContent'>
					<>
						<div
							style={{
								display: selectedTab === 0 ? 'block' : 'none',
								width: '100%',
								height: '100%',
							}}>
							<Chats />
						</div>
						<div
							style={{
								display: selectedTab === 1 ? 'block' : 'none',
								width: '100%',
								height: '100%',
							}}>
							<Meeting />
						</div>
						{selectedTab === 2 && (
							<div>
								<User />
							</div>
						)}
					</>
				</div>
			</div>
		</>
	);
}
