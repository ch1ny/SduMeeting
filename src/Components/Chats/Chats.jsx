import {
	CheckOutlined,
	CloseOutlined,
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
	message,
	Modal,
	Segmented,
	Skeleton,
} from 'antd';
import { ChatMainComponent } from 'Components/ChatComponent/ChatMainComponent/ChatMainComponent';
import { ChatRTC } from 'Components/ChatComponent/ChatRTC';
import FriendBubble from 'Components/ChatComponent/FriendBubble';
import React, { useEffect, useReducer, useState } from 'react';
import { ajax, wsAjax } from 'Utils/Axios/Axios';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import {
	ACCEPT_FRIEND_REQUEST,
	CHAT_ANSWER_FRIEND_REQUEST,
	CHAT_READ_MESSAGE,
	CHAT_SEND_FRIEND_REQUEST,
	NO_OPERATION_FRIEND_REQUEST,
	REJECT_FRIEND_REQUEST,
} from 'Utils/Constraints';
import { decodeJWT, getMainContent } from 'Utils/Global';
import {
	ADD_MESSAGE_HISTORY,
	ADD_UNREAD_MESSAGE,
	setMessageHistory,
	setNowChattingId,
	setUnreadMessages,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import './style.scss';

export const ChatRTCContext = React.createContext(undefined);

export default function Chats() {
	const [nowChatting, setNowChatting] = useState(undefined);
	const [chatSocket, setChatSocket] = useState(undefined);
	const onReceiveMessage = ({ data }) => {
		// NOTE: 接收到消息，加入历史记录中，并根据当前打开的会话框决定是否加入未读消息队列中
		const { message } = data;
		message.myId = decodeJWT(store.getState().authToken).id;
		if (!nowChatting || nowChatting.uid !== message.fromId) {
			store.dispatch(setUnreadMessages(ADD_UNREAD_MESSAGE, message));
			store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
		} else {
			store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
			invokeSocket().send({
				sender: nowChatting.uid,
				type: CHAT_READ_MESSAGE,
			});
		}
		dispatchFriendsList({
			type: 'upgradeFriend',
			friend: {
				uid: message.fromId,
			},
		});
	};
	const onSendMessage = (friendId) => {
		dispatchFriendsList({ type: 'upgradeFriend', friend: { uid: friendId } });
	};

	useEffect(() => {
		if (chatSocket) {
			chatSocket.on('MESSAGE_RECEIVER_OK', onReceiveMessage);
			chatSocket.on('MESSAGE_SENDER_OK', onSendMessage);
		}
		return () => {
			if (chatSocket) {
				chatSocket.removeAllListeners('MESSAGE_RECEIVER_OK');
				chatSocket.removeAllListeners('MESSAGE_SENDER_OK');
			}
		};
	}, [nowChatting]);

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

	useEffect(
		() =>
			store.subscribe(() => {
				const { nowChattingId } = store.getState();
				if (nowChattingId) {
					setNowChatting(friendsList.get(nowChattingId));
				}
			}),
		[friendsList]
	);

	const [requests, setRequests] = useState([]);
	const [unreadNumber, setUnreadNumber] = useState({});
	useEffect(
		() =>
			store.subscribe(() => {
				const { unreadMessages } = store.getState();
				const unreadNum = {};
				for (const id in unreadMessages) {
					if (Object.hasOwnProperty.call(unreadMessages, id)) {
						unreadNum[id] = unreadMessages[id].length;
					}
				}
				setUnreadNumber(unreadNum);
			}),
		[]
	);
	const [chatRtc, setChatRtc] = useState(undefined);
	useEffect(() => {
		window.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((token) => {
			const _chatSocket = invokeSocket(token);
			const myId = decodeJWT(store.getState().authToken).id;
			_chatSocket.on('onopen', () => {
				console.log('chatsocket连接成功');
				wsAjax
					.get('/getFriendsAndMessages')
					.then((res) => {
						const { friends, messages, requests } = res.data;
						// 初始化好友列表
						dispatchFriendsList({ type: 'initFriends', friends });
						// NOTE: 初始化未读消息
						const unreadNum = {};
						for (const message of messages) {
							message.myId = myId;
							store.dispatch(setUnreadMessages(ADD_UNREAD_MESSAGE, message));
							// NOTE: 与本地消息记录合并
							store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
							unreadNum[`${message.fromId}`] = unreadNum[`${message.fromId}`]
								? unreadNum[`${message.fromId}`] + 1
								: 1;
						}
						setUnreadNumber(Object.assign({}, unreadNumber, unreadNum));
						// 初始化好友请求
						setRequests(requests);
					})
					.catch((err) => {
						console.log(err);
					});
			});
			_chatSocket.on('REPLY_RECEIVER_OK', (friend) => {
				dispatchFriendsList({ type: 'addFriend', friend });
			});
			setChatSocket(_chatSocket);
			setChatRtc(
				new ChatRTC({
					socket: _chatSocket,
					myId,
				})
			);
		});
	}, []);

	const [showAddFriendModal, setShowAddFriendModal] = useState(false);

	return (
		<ChatRTCContext.Provider value={chatRtc}>
			<div id='chatsHeader'>
				<div id='chatsTitle'>{nowChatting ? nowChatting.username : '聊天界面'}</div>
				<div id='controlPanel'>
					<div
						className='controlButton'
						title='添加好友'
						onClick={() => {
							setShowAddFriendModal(true);
						}}>
						<Badge dot={requests.length !== 0}>
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
										store.dispatch(setNowChattingId(friendId));
									}}
									unreadNumber={unreadNumber[`${friend.uid}`]}
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
				replyRequests={(reply) => {
					const { type, friend, index } = reply;
					let agree;
					switch (type) {
						case 1:
							agree = false;
							break;
						case 2:
							agree = true;
							break;
						default:
							return;
					}
					invokeSocket().send({
						id: friend.id,
						type: CHAT_ANSWER_FRIEND_REQUEST,
						agree,
					});
					if (agree) {
						dispatchFriendsList({ type: 'addFriend', friend });
					}
					const newRequests = [...requests];
					newRequests.splice(index, 1);
					setRequests(newRequests);
				}}
				onCancel={() => {
					setShowAddFriendModal(false);
				}}
			/>
		</ChatRTCContext.Provider>
	);
}

function AddFriendModal(props) {
	const [segment, setSegment] = useState('添加好友');

	const [searchResult, setSearchResult] = useState([]);
	const [searching, setSearching] = useState(false);

	const onSearch = (searchStr) => {
		setSearching(true);
		ajax.get('/login_and_register/findUser', {
			name: searchStr,
		})
			.then((res) => {
				if (res.code === 200) {
					const { users } = res.data;
					setSearchResult(users);
					if (users.length === 0) {
						message.warn({
							content: '没有查询到相关用户',
							getPopupContainer: getMainContent,
						});
					}
				}
			})
			.finally(() => {
				setSearching(false);
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
							onChange={setSegment}
						/>
					</>
				}
				footer={null}>
				<>
					<div style={{ display: segment === '添加好友' ? '' : 'none', height: '40vh' }}>
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
															toId: item.uid,
															type: CHAT_SEND_FRIEND_REQUEST,
														});
													}}>
													添加好友
												</Button>,
											]}>
											<List.Item.Meta
												avatar={
													<Avatar
														src={
															item.profile
																? `http://meeting.aiolia.top:8080/file/pic/user/${item.uid}.${item.profile}`
																: item.profile
														}
														size={50}
														children={item.username}
													/>
												}
												title={<a href='#'>{item.username}</a>}
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
								renderItem={(item, index) => (
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
														item.profile
															? `http://meeting.aiolia.top:8080/file/pic/user/${item.uid}.${item.profile}`
															: item.profile
													}
													size={50}
													children={item.username}
												/>
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
