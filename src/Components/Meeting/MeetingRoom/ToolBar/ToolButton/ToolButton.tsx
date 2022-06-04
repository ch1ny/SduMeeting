import React, { ReactNode } from 'react';

interface ToolButtonProps {
	onClick: React.MouseEventHandler<HTMLDivElement>;
	title: string;
	icon: ReactNode;
	text: string;
}
export default function ToolButton(props: ToolButtonProps) {
	return (
		<>
			<div className='mettingRoom_toolButton' onClick={props.onClick} title={props.title}>
				<div className='mettingRoom_toolButton_icon'>{props.icon}</div>
				<div className='mettingRoom_toolButton_text'>{props.text}</div>
			</div>
		</>
	);
}
