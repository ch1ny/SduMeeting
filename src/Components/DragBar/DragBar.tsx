import {
	BorderOutlined,
	CloseOutlined,
	MinusOutlined,
	SettingOutlined,
	SwitcherOutlined,
} from '@ant-design/icons';
import Setting from 'Components/Setting/Setting';
import React, { useEffect, useState } from 'react';
import eventBus from 'Utils/EventBus/EventBus';
import { eWindow } from 'Utils/Types';
import './style.scss';

export default function DragBar() {
	const [isMaximized, setIsMaximized] = useState(false);
	useEffect(() => {
		let isMax = isMaximized;
		const windowMaximizedChangeListener = function () {
			setIsMaximized(!isMax);
			isMax = !isMax;
		};
		eWindow.ipc.on('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS', windowMaximizedChangeListener);
		return () => {
			eWindow.ipc.removeListener(
				'EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS',
				windowMaximizedChangeListener
			);
		};
	}, []);

	const [showSetting, setShowSetting] = useState(false);

	return (
		<>
			<div className='dragBar'>
				<button
					className='titleBtn'
					id='shutdown'
					title='退出'
					onClick={() => {
						eWindow.ipc.send('QUIT');
					}}>
					<CloseOutlined />
				</button>
				<button
					className='titleBtn'
					id='maximize'
					title={isMaximized ? '还原' : '最大化'}
					onClick={() => {
						eWindow.ipc.send('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS');
					}}>
					{isMaximized ? <SwitcherOutlined /> : <BorderOutlined />}
				</button>
				<button
					className='titleBtn'
					id='minimize'
					title='最小化'
					onClick={() => {
						eWindow.ipc.send('MINIMIZE_MAIN_WINDOW');
						eventBus.emit('MAIN_WINDOW_MINIMIZE');
					}}>
					<MinusOutlined />
				</button>
				<button
					className='titleBtn'
					id='setting'
					title='设置'
					onClick={() => {
						setShowSetting(true);
					}}>
					<SettingOutlined />
				</button>
			</div>
			{/* NOTE: 挂载的设置页面 */}
			<Setting
				visible={showSetting}
				closeFunc={() => {
					setShowSetting(false);
				}}
			/>
		</>
	);
}
