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
import './style.scss';

export default function DragBar(props) {
	const [isMaximized, setIsMaximized] = useState(false);
	useEffect(() => {
		const windowMaximizedChangeListener = () => {
			setIsMaximized(!isMaximized);
		};
		window.ipcRenderer.on(
			'EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS',
			windowMaximizedChangeListener
		);
		return () => {
			window.ipcRenderer.removeListener(
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
						window.ipcRenderer.send('QUIT');
					}}>
					<CloseOutlined />
				</button>
				<button
					className='titleBtn'
					id='maximize'
					title={isMaximized ? '还原' : '最大化'}
					onClick={() => {
						window.ipcRenderer.send('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS');
					}}>
					{isMaximized ? <SwitcherOutlined /> : <BorderOutlined />}
				</button>
				<button
					className='titleBtn'
					id='minimize'
					title='最小化'
					onClick={() => {
						window.ipcRenderer.send('MINIMIZE_MAIN_WINDOW');
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
			{/* INFO: 挂载的设置页面 */}
			<Setting
				visible={showSetting}
				closeFunc={() => {
					setShowSetting(false);
				}}
			/>
		</>
	);
}
