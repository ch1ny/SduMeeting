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
		eventBus.on('SET_SELECTED_TAB', (selected: number) => {
			setSelectedTab(selected);
		});
		return () => {
			eventBus.offAll('SET_SELECTED_TAB');
		};
	}, []);
	useEffect(() => {
		if (selectedTab === 0) {
			eventBus.emit('SHOW_CHATS');
		}
		eventBus.handle('GET_SELECTED_TAB', () => {
			return selectedTab;
		});
		return () => {
			eventBus.removeHandler('GET_SELECTED_TAB');
		};
	}, [selectedTab]);

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
							<div
								style={{
									width: '100%',
									height: '100%',
								}}>
								<User />
							</div>
						)}
					</>
				</div>
			</div>
		</>
	);
}
