import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import Member from './Member/Member';

interface MeetingMembersProps {
	allMembers: Map<number, string>;
	members: Map<number, { stream: MediaStream }>;
	onChoose: React.MouseEventHandler<HTMLDivElement>;
	userId: number;
}

export default function MeetingMembers(props: MeetingMembersProps) {
	// INFO: 用来判断用户列表是否超出高度
	const [memberHeight, setMemberHeight] = useState(0);
	const [memberScrollHeight, setMemberScrollHeight] = useState(0);
	const [memberScrollTop, setMemberScrollTop] = useState(0);
	const scrollMembersRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const scrollDOM = scrollMembersRef.current as HTMLDivElement;
		setMemberHeight(scrollDOM.clientHeight);
		setMemberScrollHeight(scrollDOM.scrollHeight);
	}, []);

	useEffect(() => {
		const scrollDOM = scrollMembersRef.current as HTMLDivElement;
		setMemberHeight(scrollDOM.clientHeight);
		setMemberScrollHeight(scrollDOM.scrollHeight);
		setMemberScrollTop(scrollDOM.scrollTop);
	}, [props.members]);

	return (
		<div id='members'>
			{memberScrollHeight > memberHeight && memberScrollTop > 0 && (
				<div
					className='scrollButton'
					onClick={() => {
						(scrollMembersRef.current as HTMLDivElement).scrollTop -= 50;
					}}>
					<CaretUpOutlined />
				</div>
			)}
			<div
				id='membersList'
				onScroll={() => {
					const scrollDOM = scrollMembersRef.current as HTMLDivElement;
					setMemberHeight(scrollDOM.clientHeight);
					setMemberScrollHeight(scrollDOM.scrollHeight);
					setMemberScrollTop(scrollDOM.scrollTop);
					// console.log(
					//     memberHeight.toFixed(1),
					//     memberScrollHeight.toFixed(1),
					//     memberScrollTop.toFixed(1)
					// );
				}}
				onDoubleClick={props.onChoose}
				ref={scrollMembersRef}>
				{(function () {
					const membersArr = [];
					for (const [key, value] of props.members) {
						membersArr.push(
							<Member
								key={key}
								stream={value.stream}
								member={`${props.allMembers.get(key)}`}
								muted={props.userId === key}
							/>
						);
					}
					return membersArr;
				})()}
			</div>
			{memberScrollHeight > memberHeight &&
				memberHeight + memberScrollTop < memberScrollHeight && (
					<div
						className='scrollButton'
						onClick={() => {
							(scrollMembersRef.current as HTMLDivElement).scrollTop += 50;
						}}>
						<CaretDownOutlined />
					</div>
				)}
		</div>
	);
}
