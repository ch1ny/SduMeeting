import { IdcardOutlined } from '@ant-design/icons';
import Typography from 'antd/lib/typography';
import { Victor } from 'Components/Victor/Victor';
import React, { useEffect } from 'react';
import './style.scss';

interface NameCardProps {
	username: string;
	email: string;
	userId: number;
}

export default function NameCard(props: NameCardProps) {
	// 设置动态背景
	useEffect(() => {
		const victor = Victor('nameCard', 'canvas');
		const theme = ['#ff1324', '#ff3851'];
		if (victor) victor(theme).set();
	}, []);

	return (
		<div className='mainInfo' id='nameCard'>
			<Typography.Title level={3} style={{ color: 'white', zIndex: 1 }}>
				<IdcardOutlined style={{ marginRight: '0.5rem' }} />
				{props.username}
			</Typography.Title>
			<div className='userInfoDescriptions email'>{props.email}</div>
			<div className='userInfoDescriptions welcome'>您是我们的第 {props.userId} 位用户！</div>
			<div id='canvas' />
			<div id='clay' />
		</div>
	);
}
