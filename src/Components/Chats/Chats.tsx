import { UserAddOutlined } from '@ant-design/icons';
import Badge from 'antd/lib/badge';
import Empty from 'antd/lib/empty';
import AddFriendModal from 'Components/AddFriendModal/AddFriendModal';
import { ChatMainContainer } from 'Components/ChatComponents/ChatMainContainer/ChatMainContainer';
import FriendBubble from 'Components/ChatComponents/FriendBubbles/FriendBubble';
import React, { useEffect, useReducer, useState } from 'react';
import ajax from 'Utils/Axios/Axios';
import invokeSocket, { ChatSocket } from 'Utils/ChatSocket/ChatSocket';
import { ChatWebSocketType } from 'Utils/Constraints';
import eventBus from 'Utils/EventBus/EventBus';
import { decodeJWT } from 'Utils/Global';
import {
	ADD_MESSAGE_HISTORY,
	ADD_UNREAD_MESSAGE,
	REMOVE_UNREAD_MESSAGES,
	setMessageHistory,
	setUnreadMessages,
} from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { eWindow } from 'Utils/Types';
import { ChatRTC } from 'Utils/WebRTC/ChatRTC';
import './style.scss';

export const ChatRTCContext = React.createContext<ChatRTC | undefined>(undefined);
const clearUnreadMessages = (id: number) => {
	invokeSocket().send({
		sender: id,
		type: ChatWebSocketType.CHAT_READ_MESSAGE,
	});
	store.dispatch(setUnreadMessages(REMOVE_UNREAD_MESSAGES, { userId: id }));
};

export default function Chats() {
	const [nowChatting, setNowChatting] = useState(undefined);
	const [chatSocket, setChatSocket] = useState<ChatSocket | undefined>(undefined);
	useEffect(() => {
		// NOTE: 签收未读消息并将它们移出未读消息列表
		if (nowChatting) {
			if (eventBus.invokeSync('GET_SELECTED_TAB') === 0) {
				clearUnreadMessages((nowChatting as any).uid);
			}
			eventBus.on('SHOW_CHATS', () => {
				clearUnreadMessages((nowChatting as any).uid);
			});
			return () => {
				eventBus.offAll('SHOW_CHATS');
			};
		}
	}, [nowChatting]);

	useEffect(() => {
		const onReceiveMessage = ({ data }: { data: { message: any } }) => {
			// NOTE: 接收到消息，加入历史记录中，并根据当前打开的会话框决定是否加入未读消息队列中
			const { message } = data;
			message.myId = decodeJWT(store.getState().authToken).id;
			if (
				eventBus.invokeSync('GET_SELECTED_TAB') !== 0 ||
				!nowChatting ||
				(nowChatting as any).uid !== message.fromId
			) {
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
						<ChatMainContainer
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
