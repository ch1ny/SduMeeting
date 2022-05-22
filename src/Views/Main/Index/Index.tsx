import Asider from 'Components/Asider/Asider';
import Chats from 'Components/Chats/Chats';
import DragBar from 'Components/DragBar/DragBar';
import Meeting from 'Components/Meeting/Meeting';
import User from 'Components/User/User';
import React, { useState } from 'react';
import './style.scss';

export default function Index() {
	const [selectedTab, setSelectedTab] = useState(0);

	return (
		<>
			<DragBar />
			<div className='mainBody'>
				<Asider selectedTab={selectedTab} tabOnClick={setSelectedTab} />
				<div className='content' id='mainContent'>
					{(() => {
						switch (selectedTab) {
							case undefined:
								return <></>;
							default:
								return (
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
										<div
											style={{
												display: selectedTab === 2 ? 'block' : 'none',
												width: '100%',
												height: '100%',
											}}>
											<User />
										</div>
									</>
								);
						}
					})()}
				</div>
			</div>
		</>
	);
}
