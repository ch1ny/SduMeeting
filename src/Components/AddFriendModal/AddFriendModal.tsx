import { CheckOutlined, CloseOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Avatar from 'antd/lib/avatar';
import Badge from 'antd/lib/badge';
import Button from 'antd/lib/button';
import Divider from 'antd/lib/divider';
import Input from 'antd/lib/input';
import List from 'antd/lib/list';
import Modal from 'antd/lib/modal';
import Segmented from 'antd/lib/segmented';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import {
	ACCEPT_FRIEND_REQUEST,
	ChatWebSocketType,
	NO_OPERATION_FRIEND_REQUEST,
	REJECT_FRIEND_REQUEST,
} from 'Utils/Constraints';
import { getMainContent } from 'Utils/Global';

interface AddFriendModalProps {
	visible: boolean;
	onCancel: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	requests: any;
	replyRequests: (arg0: { type: number; friend: unknown; index: number }) => void;
}

export default function AddFriendModal(props: AddFriendModalProps) {
	const [segment, setSegment] = useState('添加好友');

	const [searchResult, setSearchResult] = useState([]);

	const onSearch = (searchStr: string) => {
		ajax.get('/login_and_register/findUser', {
			name: searchStr,
		}).then((res) => {
			if (res.code === 200) {
				const { users } = res.data;
				setSearchResult(users);
				if (users.length === 0) {
					globalMessage.warn({
						content: '没有查询到相关用户',
						getPopupContainer: getMainContent,
					});
				}
			}
		});
	};

	return (
		<>
			<Modal
				visible={props.visible}
				centered
				onCancel={props.onCancel}
				title={
					<>
						<Segmented
							options={[
								'添加好友',
								{
									label: (
										<>
											<Badge dot={props.requests.length !== 0} size={'small'}>
												好友申请
											</Badge>
										</>
									),
									value: '好友申请',
								},
							]}
							value={segment}
							onChange={(value) => {
								setSegment(value.toString());
							}}
						/>
					</>
				}
				footer={null}>
				<>
					<div
						style={{
							display: segment === '添加好友' ? '' : 'none',
							height: '50vh',
						}}>
						<Input.Search
							placeholder='输入昵称查询好友'
							enterButton={
								<>
									<SearchOutlined style={{ marginRight: '0.5em' }} />
									查询
								</>
							}
							onSearch={onSearch}
						/>
						<Divider />
						<div style={{ overflowY: 'auto', height: 'calc(100% - 5rem)' }}>
							<List
								itemLayout='horizontal'
								dataSource={searchResult}
								renderItem={(item) => (
									<List.Item
										actions={[
											<Button
												icon={<PlusOutlined />}
												type={'primary'}
												onClick={() => {
													// INFO: 发送好友请求
													invokeSocket().send({
														toId: (item as any).uid,
														type: ChatWebSocketType.CHAT_SEND_FRIEND_REQUEST,
													});
												}}>
												添加好友
											</Button>,
										]}>
										<List.Item.Meta
											avatar={
												<Avatar
													src={
														(item as any).profile
															? `http://meeting.aiolia.top:8080/file/pic/user/${
																	(item as any).uid
															  }.${(item as any).profile}`
															: (item as any).profile
													}
													size={50}
													children={(item as any).username}
												/>
											}
											title={<a href='#'>{(item as any).username}</a>}
											description={(item as any).email}
										/>
									</List.Item>
								)}
							/>
						</div>
					</div>
					<div style={{ display: segment === '好友申请' ? '' : 'none', height: '40vh' }}>
						<div style={{ overflowY: 'auto', height: '100%' }}>
							<List
								itemLayout='horizontal'
								dataSource={props.requests}
								renderItem={(item, index) => (
									<List.Item
										actions={[
											<div
												onClick={({ nativeEvent }) => {
													const path = nativeEvent.composedPath();
													for (const ele of path) {
														let result = undefined;
														switch ((ele as Node).nodeName) {
															case 'svg':
															case 'SPAN':
																continue;
															case 'BUTTON':
																// INFO: 1 是拒绝，2 是同意
																result = (
																	ele as HTMLElement
																).classList.contains(
																	'ant-btn-dangerous'
																)
																	? REJECT_FRIEND_REQUEST
																	: ACCEPT_FRIEND_REQUEST;
																break;
															default:
																result =
																	NO_OPERATION_FRIEND_REQUEST;
																break;
														}
														if (result) {
															props.replyRequests({
																type: result,
																friend: item,
																index,
															});
															break;
														}
													}
												}}>
												<div style={{ marginBottom: '0.25rem' }}>
													<Button
														size='small'
														icon={<CheckOutlined />}
														type={'primary'}
														style={{
															backgroundColor: '#67c23a',
															borderColor: '#67c23a',
														}}>
														接受
													</Button>
												</div>
												<div style={{ marginTop: '0.25rem' }}>
													<Button
														size='small'
														type={'primary'}
														icon={<CloseOutlined />}
														danger>
														拒绝
													</Button>
												</div>
											</div>,
										]}>
										<List.Item.Meta
											avatar={
												<Avatar
													src={
														(item as any).profile
															? `http://meeting.aiolia.top:8080/file/pic/user/${
																	(item as any).uid
															  }.${(item as any).profile}`
															: (item as any).profile
													}
													size={50}
													children={(item as any).username}
												/>
											}
											title={<a href='#'>{(item as any).username}</a>}
											description={(item as any).email}
										/>
									</List.Item>
								)}
							/>
						</div>
					</div>
				</>
			</Modal>
		</>
	);
}
