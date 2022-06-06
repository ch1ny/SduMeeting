import {
	CheckOutlined,
	CloseOutlined,
	PlusOutlined,
	SearchOutlined,
	UserAddOutlined,
} from '@ant-design/icons';
import Avatar from 'antd/lib/avatar';
import Badge from 'antd/lib/badge';
import Button from 'antd/lib/button';
import Divider from 'antd/lib/divider';
import Empty from 'antd/lib/empty';
import Input from 'antd/lib/input';
import List from 'antd/lib/list';
import Modal from 'antd/lib/modal';
import Segmented from 'antd/lib/segmented';
import { ChatMainComponent } from 'Components/ChatComponent/ChatMainComponent/ChatMainComponent';
import { ChatRTC } from 'Components/ChatComponent/ChatRTC';
import FriendBubble from 'Components/ChatComponent/FriendBubble';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useReducer, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import invokeSocket, { ChatSocket } from 'Utils/ChatSocket/ChatSocket';
import {
	ACCEPT_FRIEND_REQUEST,
	ChatWebSocketType,
	NO_OPERATION_FRIEND_REQUEST,
	REJECT_FRIEND_REQUEST,
} from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { decodeJWT, getMainContent } from 'Utils/Global';
import {
	ADD_MESSAGE_HISTORY,
	ADD_UNREAD_MESSAGE,
	setMessageHistory,
	setNowChattingId,
	setUnreadMessages,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';
import './style.scss';

export const ChatRTCContext = React.createContext<ChatRTC | undefined>(undefined);

export default function Chats() {
	const [nowChatting, setNowChatting] = useState(undefined);
	const [chatSocket, setChatSocket] = useState<ChatSocket | undefined>(undefined);

	useEffect(() => {
		const onReceiveMessage = ({ data }: { data: { message: any } }) => {
			// NOTE: 接收到消息，加入历史记录中，并根据当前打开的会话框决定是否加入未读消息队列中
			const { message } = data;
			message.myId = decodeJWT(store.getState().authToken).id;
			if (!nowChatting || (nowChatting as any).uid !== message.fromId) {
				store.dispatch(setUnreadMessages(ADD_UNREAD_MESSAGE, message));
				store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
			} else {
				store.dispatch(setMessageHistory(ADD_MESSAGE_HISTORY, message));
				invokeSocket().send({
					sender: (nowChatting as any).uid,
					type: ChatWebSocketType.CHAT_READ_MESSAGE,
				});
			}
			dispatchFriendsList({
				type: 'upgradeFriend',
				friend: {
					uid: message.fromId,
				},
			});
		};
		if (chatSocket) {
			chatSocket.on('MESSAGE_RECEIVER_OK', onReceiveMessage);
		}
		return () => {
			if (chatSocket) {
				chatSocket.removeAllListeners('MESSAGE_RECEIVER_OK');
			}
		};
	}, [nowChatting, chatSocket]);

	const [friendsList, dispatchFriendsList] = useReducer<
		(
			state: Map<number, any>,
			action: { type: string; payload?: any; friend?: any; friends?: any }
		) => Map<number, any>
	>((state, action) => {
		switch (action.type) {
			case 'addFriend':
				return new Map(state.set(action.friend.uid, action.friend));
			case 'removeFriend':
				state.delete(action.friend.uid);
				if (store.getState().nowWebrtcFriendId === action.friend.uid) {
					chatRtc?.hangUp();
				}
				if (nowChatting && (nowChatting as any).uid === action.friend.uid) {
					setNowChatting(undefined);
				}
				return new Map(state);
			case 'initFriends':
				return new Map(action.friends.map((item: any) => ({ 0: item.uid, 1: item })));
			case 'upgradeFriend':
				const friend = state.get(action.friend.uid);
				state.delete(action.friend.uid);
				return new Map(state.set(action.friend.uid, friend));
			default:
				throw new Error('非法的好友列表操作');
		}
	}, new Map());

	useEffect(() => {
		eventBus.handle('GET_FRIEND_INFO_BY_ID', (id: number) => {
			return friendsList.get(id);
		});
		const unsubscribe = store.subscribe(() => {
			const { nowChattingId } = store.getState();
			if (nowChattingId) {
				setNowChatting(friendsList.get(nowChattingId));
			}
		});
		return () => {
			unsubscribe();
			eventBus.removeHandler('GET_FRIEND_INFO_BY_ID');
		};
	}, [friendsList]);

	const [requests, setRequests] = useState([]);
	const onRequestReceived = (data: any) => {
		const newRequests = [...requests] as any;
		newRequests.push({
			date: data.date,
			uid: data.userId,
			profile: data.profile,
			id: data.id,
			email: data.email,
			username: data.username,
		});
		setRequests(newRequests);
	};
	useEffect(() => {
		if (chatSocket) {
			chatSocket.on('ON_REQUEST_RECEIVER_OK', onRequestReceived);
		}
		return () => {
			if (chatSocket) {
				chatSocket.removeAllListeners('ON_REQUEST_RECEIVER_OK');
			}
		};
	}, [requests, chatSocket]);

	const [unreadNumber, setUnreadNumber] = useState({});
	useEffect(
		() =>
			store.subscribe(() => {
				const { unreadMessages } = store.getState();
				const unreadNum = {};
				for (const id in unreadMessages) {
					if (Object.hasOwnProperty.call(unreadMessages, id)) {
						Object.defineProperty(unreadNum, `${id}`, {
							value: unreadMessages[id].length,
						});
					}
				}
				setUnreadNumber(unreadNum);
				// console.log(unreadNumber);
			}),
		[]
	);
	const [chatRtc, setChatRtc] = useState<ChatRTC | undefined>(undefined);
	useEffect(() => {
		eWindow.ipc.invoke('GET_USER_AUTH_TOKEN_AFTER_LOGIN').then((token: string) => {
			const _chatSocket = invokeSocket(token);
			const myId = decodeJWT(store.getState().authToken).id;
			_chatSocket.on('onopen', () => {
				console.log('chatsocket连接成功');
				ajax.get('/chat/getFriendsAndMessages')
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
							Object.defineProperty(unreadNum, `${message.fromId}`, {
								value: unreadNum[`${message.fromId}` as keyof typeof unreadNum]
									? unreadNum[`${message.fromId}` as keyof typeof unreadNum] + 1
									: 1,
							});
						}
						// setUnreadNumber(Object.assign({}, unreadNumber, unreadNum));
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
			_chatSocket.on('ON_REMOVED_BY_A_FRIEND', (data: { uid: number; id: number }) => {
				dispatchFriendsList({ type: 'removeFriend', friend: { uid: data.uid } });
			});
			_chatSocket.on('MESSAGE_SENDER_OK', (friendId: number) => {
				dispatchFriendsList({ type: 'upgradeFriend', friend: { uid: friendId } });
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

	const removeFriend = (id: number) => {
		chatSocket?.send({
			toId: id,
			type: ChatWebSocketType.REMOVE_FRIEND,
		});
		dispatchFriendsList({
			type: 'removeFriend',
			friend: {
				uid: id,
			},
		});
	};

	return (
		<ChatRTCContext.Provider value={chatRtc}>
			<div id='chatsHeader'>
				<div id='chatsTitle'>
					{nowChatting ? (nowChatting as any).username : '聊天界面'}
				</div>
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
									profile={friend.profile}
									onClick={() => {
										store.dispatch(setNowChattingId(friendId));
									}}
									onRemoveFriend={removeFriend}
									unreadNumber={
										unreadNumber[`${friend.uid}` as keyof typeof unreadNumber]
									}
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
							id={(nowChatting as any).uid}
							username={(nowChatting as any).username}
							profile={(nowChatting as any).profile}
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
				replyRequests={(reply: { type: any; friend: any; index: any }) => {
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
						type: ChatWebSocketType.CHAT_ANSWER_FRIEND_REQUEST,
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

interface AddFriendModalProps {
	visible: boolean;
	onCancel: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	requests: any;
	replyRequests: (arg0: { type: number; friend: unknown; index: number }) => void;
}

function AddFriendModal(props: AddFriendModalProps) {
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
								className='demo-loadmore-list'
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
								className='demo-loadmore-list'
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
