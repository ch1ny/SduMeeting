import React, { useState } from 'react';
import Asider from './Asider/Asider';
import DragBar from './DragBar/DragBar';
import Meeting from './Meeting/Meeting';
import './style.scss';
import User from './User/User';

export default function Index() {
	const [selectedTab, setSelectedTab] = useState(undefined);

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
											}}>
											聊天
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
