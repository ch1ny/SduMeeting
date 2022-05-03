import {
	CheckOutlined,
	CloseOutlined,
	DisconnectOutlined,
	LoadingOutlined,
	PlusOutlined,
	SearchOutlined,
	UserAddOutlined,
} from '@ant-design/icons';
import {
	Avatar,
	Badge,
	Button,
	Divider,
	Empty,
	Input,
	List,
	Modal,
	Segmented,
	Skeleton,
} from 'antd';
import ChatInput from 'Components/ChatComponent/ChatInput';
import ChatMessages from 'Components/ChatComponent/ChatMessages';
import FriendBubble from 'Components/ChatComponent/FriendBubble';
import React, { useEffect, useReducer, useState } from 'react';
import { wsAjax } from 'Utils/Axios/Axios';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import {
	ACCEPT_FRIEND_REQUEST,
	CALL_STATUS_FREE,
	CALL_STATUS_OFFERING,
	CHAT_PRIVATE_WEBRTC_DISCONNECT,
	CHAT_SEND_FRIEND_REQUEST,
	NO_OPERATION_FRIEND_REQUEST,
	REJECT_FRIEND_REQUEST,
} from 'Utils/Constraints';
import { decodeJWT, getMainContent } from 'Utils/Global';
import {
	ADD_MESSAGE_HISTORY,
	ADD_UNREAD_MESSAGE,
	setCallStatus,
	setMessageHistory,
	setUnreadMessages,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export default function Chats() {
	const [nowChatting, setNowChatting] = useState(undefined);
	const [friendsList, dispatchFriendsList] = useReducer((state, action) => {
		switch (action.type) {
			case 'addFriend':
				return new Map(state.set(action.friend.uid, action.friend));
			case 'removeFriend':
				state.delete(action.friend.uid);
				return new Map(state);
			case 'initFriends':
				return new Map(action.friends.map((item) => ({ 0: item.uid, 1: item })));
			case 'upgradeFriend':
				const friend = state.get(action.friend.uid);
				state.delete(action.friend.uid);
				return new Map(state.set(action.friend.uid, friend));
			default:
				throw new Error('非法的好友列表操作');
		}
	}, new Map());

	const [requests, setRequests] = useState([]);
	useEffect(() => {
		window.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((token) => {
			const chatSocket = invokeSocket(token);
			chatSocket.on('onopen', () => {
				console.log('chatsocket连接成功');
				wsAjax
					.get('/getFriendsAndMessages')
					.then((res) => {
						const { friends, messages, requests } = res.data;
						// TODO: 初始化好友列表
						dispatchFriendsList({ type: 'initFriends', friends });
						// INFO: 初始化未读消息
						for (const message of messages) {
							store.dispatch(setUnreadMessages(ADD_UNREAD_MESSAGE, message));
							// TODO: 还需要与本地消息记录合并
							store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
						}
						// 初始化好友请求
						setRequests(requests);
					})
					.catch((err) => {
						console.log(err);
					});
			});
		});
	}, []);

	const [showAddFriendModal, setShowAddFriendModal] = useState(false);

	return (
		<>
			<div id='chatsHeader'>
				<div id='chatsTitle'>{nowChatting ? nowChatting.username : '聊天界面'}</div>
				<div id='controlPanel'>
					<div
						className='controlButton'
						title='添加好友'
						onClick={() => {
							setShowAddFriendModal(true);
						}}>
						<Badge dot>
							<UserAddOutlined />
						</Badge>
					</div>
				</div>
			</div>
			<div id='chatsContainer'>
				<div id='chatsFriendsPanel'>
					{(() => {
						const friends = [];
						for (const [friendId, friend] of friendsList) {
							friends.push(
								<FriendBubble
									key={friendId}
									id={friend.uid}
									username={friend.username}
									email={friend.email}
									profile={friend.profile}
									onClick={() => {
										setNowChatting(friend);
										// TODO: 签收未读消息
										// invokeSocket().send({
										// 	id: friend.uid,
										// 	type: CHAT_READ_MESSAGE
										// })
									}}
									style={{
										backgroundColor: nowChatting === friend ? '#e3e3e3f4' : '',
									}}
								/>
							);
						}
						return friends;
					})()}
				</div>
				<div id='chatsMainPanel'>
					{nowChatting ? (
						<ChatMainComponent
							id={nowChatting.uid}
							username={nowChatting.username}
							profile={nowChatting.profile}
						/>
					) : (
						<div
							style={{
								width: '100%',
								height: '100%',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}>
							{/* 							
								根据人机交互课的知识
								人会将页面中心看得偏上一点
								因此这里将空状态组件向上移动了一段距离
							 */}
							<Empty
								style={{ marginBottom: '15%' }}
								description={
									<>
										<span>找个好友聊天吧</span>
									</>
								}
							/>
						</div>
					)}
				</div>
			</div>

			{/* 添加好友模态屏 */}
			<AddFriendModal
				visible={showAddFriendModal}
				requests={requests}
				replyRequests={() => {}}
				onCancel={() => {
					setShowAddFriendModal(false);
				}}
			/>
		</>
	);
}

function ChatMainComponent(props) {
	const [myId, setMyId] = useState(undefined);
	useEffect(() => {
		setMyId(decodeJWT(store.getState().authToken).id);
	}, []);

	const [nowChattingId, setNowChattingId] = useState(undefined);
	const [nowChattingUsername, setNowChattingUsername] = useState(undefined);
	const [nowChattingProfile, setNowChattingProfile] = useState(undefined);
	useEffect(() => {
		const { id, username, profile } = props;
		setNowChattingId(id);
		setNowChattingUsername(username);
		setNowChattingProfile(profile);
	}, [props.id, props.username, props.profile]);

	return (
		<>
			<div id='chatMainComponent'>
				<div id='chatMessages'>
					<ChatMessages id={props.id} username={props.username} profile={props.profile} />
				</div>
				<div id='chatInput'>
					<ChatInput
						nowChattingId={nowChattingId}
						myId={myId}
						onCall={() => {
							// TODO: 补充发起会话函数，发送 OFFER 信号
							if (store.getState().callStatus === CALL_STATUS_FREE) {
								store.dispatch(setCallStatus(CALL_STATUS_OFFERING));
								invokeSocket().send({
									sender: myId,
									receiver: props.id,
								});
								Modal.info({
									title: '发起通话',
									content: (
										<>
											<LoadingOutlined style={{ color: 'dodgerblue' }} />
											<span style={{ marginLeft: '10px' }}>
												已向 {props.username}{' '}
												发送视频通话请求，正在等待对方响应
											</span>
										</>
									),
									width: '60%',
									centered: true,
									okButtonProps: {
										type: 'default',
									},
									okText: (
										<>
											<DisconnectOutlined style={{ color: 'orange' }} />
											<span>挂断电话</span>
										</>
									),
									onOk: () => {
										store.dispatch(setCallStatus(CALL_STATUS_FREE));
										// TODO: 发送断开连接的ws
										invokeSocket().send({
											type: CHAT_PRIVATE_WEBRTC_DISCONNECT,
											sender: myId,
											receiver: props.id,
											target: props.id,
										});
									},
									getContainer: getMainContent,
								});
							} else {
								Modal.error({
									title: '无法发起通话',
									content:
										'当前正处于通话状态中，请在退出其他通话后再次尝试发起通话',
									width: '60%',
									centered: true,
								});
							}
						}}
					/>
				</div>
			</div>
		</>
	);
}

function AddFriendModal(props) {
	const [segment, setSegment] = useState('添加好友');

	const [searchResult, setSearchResult] = useState([
		{
			avatar: 'http://meeting.aiolia.top:8080/file/pic/user/7.jpeg',
			name: '樊晨煜',
			email: '1056317718@qq.com',
			id: 7,
		},
	]);
	const [searching, setSearching] = useState(false);

	const onSearch = () => {
		setSearching(true);
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
											<Badge dot size={'small'}>
												好友申请
											</Badge>
										</>
									),
									value: '好友申请',
								},
							]}
							value={segment}
							onChange={setSegment}
						/>
					</>
				}
				footer={null}>
				<>
					<div style={{ display: segment === '添加好友' ? '' : 'none', height: '40vh' }}>
						<Input.Search
							placeholder='输入关键字查询好友'
							allowClear
							enterButton={
								<>
									<SearchOutlined style={{ marginRight: '0.5em' }} />
									查询
								</>
							}
							onSearch={onSearch}
						/>
						<Divider />
						<div style={{ overflowY: 'auto', height: '75%' }}>
							<List
								className='demo-loadmore-list'
								itemLayout='horizontal'
								dataSource={searchResult}
								renderItem={(item) => (
									<Skeleton avatar title={false} loading={searching} active>
										<List.Item
											actions={[
												<Button
													icon={<PlusOutlined />}
													type={'primary'}
													onClick={() => {
														// INFO: 发送好友请求
														invokeSocket().send({
															toId: item.id,
															type: CHAT_SEND_FRIEND_REQUEST,
														});
													}}>
													添加好友
												</Button>,
											]}>
											<List.Item.Meta
												avatar={<Avatar src={item.avatar} size={50} />}
												title={<a href='#'>{item.name}</a>}
												description={item.email}
											/>
										</List.Item>
									</Skeleton>
								)}
							/>
						</div>
					</div>
					<div style={{ display: segment === '好友申请' ? '' : 'none', height: '40vh' }}>
						<div style={{ overflowY: 'auto', height: '100%' }}>
							<List
								className='demo-loadmore-list'
								itemLayout='horizontal'
								dataSource={props.requests}
								renderItem={(item) => (
									<List.Item
										actions={[
											<div
												onClick={({ nativeEvent }) => {
													const path = nativeEvent.path;
													for (const ele of path) {
														let result = undefined;
														switch (ele.nodeName) {
															case 'svg':
															case 'SPAN':
																continue;
															case 'BUTTON':
																// INFO: 1 是拒绝，2 是同意
																result = ele.classList.contains(
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
																id: item.id,
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
														item.profile
															? `http://meeting.aiolia.top:8080/file/pic/user/${item.id}.${item.profile}`
															: undefined
													}
													size={50}>
													{item.username}
												</Avatar>
											}
											title={<a href='#'>{item.username}</a>}
											description={item.email}
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
