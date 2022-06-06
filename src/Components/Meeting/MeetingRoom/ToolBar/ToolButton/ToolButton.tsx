import classNames from 'classnames';
import React, { ReactNode } from 'react';
import './style.scss';

interface ToolButtonProps {
	onClick: React.MouseEventHandler<HTMLDivElement>;
	title: string;
	icon: ReactNode;
	text: string;
	disabled?: boolean;
}
export default function ToolButton(props: ToolButtonProps) {
	return (
		<>
			<div
				className={classNames({
					mettingRoom_toolButton: true,
					mettingRoom_toolButton_disabled: props.disabled,
				})}
				onClick={(evt) => {
					if (!props.disabled) props.onClick(evt);
				}}
				title={props.title}>
				<div className='mettingRoom_toolButton_icon'>{props.icon}</div>
				<div className='mettingRoom_toolButton_text'>{props.text}</div>
			</div>
		</>
	);
}
