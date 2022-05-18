import {
	CloudSyncOutlined,
	DisconnectOutlined,
	LoadingOutlined,
	SmileOutlined,
	WhatsAppOutlined,
} from '@ant-design/icons';
import { Button, Modal, Popover } from 'antd';
import { ChatRTCContext } from 'Components/Chats/Chats';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useEffect, useRef, useState } from 'react';
import { wsAjax } from 'Utils/Axios/Axios';
import invokeSocket from 'Utils/ChatSocket/ChatSocket';
import { CALL_STATUS_FREE, CHAT_SEND_PRIVATE_MESSAGE } from 'Utils/Constraints';
import { decodeJWT, getMainContent } from 'Utils/Global';
import { setMessageHistory, SYNC_CLOUD_MESSAGE_HISTORY } from 'Utils/Store/actions';
import store from 'Utils/Store/store';
import { emojiRegExp } from '../../emoji';
import './ChatInput.scss';

export default function ChatInput(props) {
	const chatRtc = React.useContext(ChatRTCContext);

	const [rawHtml, setRawHtml] = useState('');
	const inputRef = useRef();
	useEffect(() => {
		// 光标位置
		const caretOffset = getCaretPosition(inputRef.current);
		let htmlStr = rawHtml;

		// NOTE: 很离谱，这里必须要使用 &zwj; 隔开，不然就有bug
		htmlStr = htmlStr.replace(emojiRegExp, `<img class="emoji" src="./emoji/$2.png">&zwj;`);

		inputRef.current.innerHTML = htmlStr;
		setLastEditRange(
			setCaretPosition(inputRef.current, caretOffset + htmlStr.length - rawHtml.length)
		);
		inputRef.current.focus();
	}, [rawHtml]);

	// 表情选择气泡
	const [showEmojis, setShowEmojis] = useState(false);

	// 上一轮光标位置
	const [lastEditRange, setLastEditRange] = useState(undefined);

	// 发送消息
	const sendMessage = function () {
		const emojiRegex = new RegExp('<img class="emoji" src="./emoji/(.*?).png">', 'gim');
		const tagRegex = new RegExp('<.*?>', 'gim');
		const rawMessage = rawHtml.replace(emojiRegex, '[:$1:]').replace(tagRegex, '');
		invokeSocket().send({
			toId: props.nowChattingId,
			message: rawMessage,
			type: CHAT_SEND_PRIVATE_MESSAGE,
		});
		setRawHtml('');
	};

	return (
		<>
			<div className='chatInputControlPanel'>
				<Popover
					content={
						<Emojis
							onChoose={({ title, id }) => {
								inputRef.current.focus();
								setShowEmojis(false);
								const selection = getSelection();
								// 判断是否存在上一次光标对象
								if (lastEditRange) {
									selection.removeAllRanges();
									selection.addRange(lastEditRange); // 判断选定对象范围是编辑框还是文本节点
									if (selection.anchorNode.nodeType !== Node.TEXT_NODE) {
										// 如果是编辑框范围。则创建表情文本节点进行插入
										const emojiText = document.createTextNode(`[:${id}:]`);
										if (inputRef.current.childNodes.length > 0) {
											// 如果文本框的子元素大于0，则表示有其他元素，则按照位置插入表情节点
											for (
												let i = 0;
												i < inputRef.current.childNodes.length;
												i++
											) {
												if (i === selection.anchorOffset) {
													inputRef.current.insertBefore(
														emojiText,
														inputRef.current.childNodes[i]
													);
												}
											}
										} else {
											// 否则直接插入一个表情元素
											inputRef.current.appendChild(emojiText);
										}
										// 创建新的光标对象
										const range = document.createRange();
										// 光标对象的范围界定为新建的表情节点
										range.selectNodeContents(emojiText);
										// 光标位置定位在表情节点的最大长度
										range.setStart(emojiText, emojiText.length);
										// 使光标开始和光标结束重叠
										range.collapse(true);
										// 清除选定对象的所有光标对象
										selection.removeAllRanges();
										// 插入新的光标对象
										selection.addRange(range);
									} else {
										// 如果是文本节点则先获取光标对象
										const range = selection.getRangeAt(0);
										// 获取光标对象的范围界定对象，一般就是textNode对象
										const textNode = range.startContainer;
										// 获取光标位置
										const rangeStartOffset = range.startOffset;
										// 文本节点在光标位置处插入新的表情内容
										textNode.insertData(rangeStartOffset, `[:${id}:]`);
										// 光标移动到到原来的位置加上新内容的长度
										range.setStart(
											textNode,
											rangeStartOffset + `[:${id}:]`.length
										);
										// 光标开始和光标结束重叠
										range.collapse(true);
										// 清除选定对象的所有光标对象
										selection.removeAllRanges();
										// 插入新的光标对象
										selection.addRange(range);
									}
									// 无论如何都要记录最后光标对象
									try {
										setLastEditRange(selection.getRangeAt(0));
									} catch (err) {
										console.warn(err);
									}
									setRawHtml(inputRef.current.innerHTML);
								}
							}}
						/>
					}
					placement='topLeft'
					arrowPointAtCenter
					trigger={'click'}
					visible={showEmojis}
					onVisibleChange={setShowEmojis}>
					<div className='chatInputControlButtons' title='表情'>
						<SmileOutlined />
					</div>
				</Popover>
				<div
					className='chatInputControlButtons'
					title={props.onVideo ? '断开通话' : '发起通话'}
					onClick={() => {
						if (props.onVideo) {
							chatRtc.hangUp();
						} else {
							if (store.getState().callStatus === CALL_STATUS_FREE) {
								const modal = Modal.info({
									title: '发起通话',
									content: (
										<>
											<LoadingOutlined style={{ color: 'dodgerblue' }} />
											<span style={{ marginLeft: '10px' }}>
												已向 {props.nowChattingName}{' '}
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
										chatRtc.hangUp();
									},
									getContainer: getMainContent,
								});
								chatRtc.createOffer(
									props.nowChattingId,
									decodeJWT(store.getState().authToken).username,
									modal
								);
							} else {
								Modal.error({
									title: '无法发起通话',
									content:
										'当前正处于通话状态中，请在退出其他通话后再次尝试发起通话',
									width: '60%',
									centered: true,
								});
							}
						}
					}}>
					{props.onVideo ? <DisconnectOutlined /> : <WhatsAppOutlined />}
				</div>
				<div
					className='chatInputControlButtons'
					title='强制同步聊天记录'
					onClick={() => {
						wsAjax
							.get('/getHistoryMessage', {
								toId: props.nowChattingId,
							})
							.then((res) => {
								if (res.code === 200) {
									const { list } = res.data;
									store.dispatch(
										setMessageHistory(SYNC_CLOUD_MESSAGE_HISTORY, {
											[`${props.nowChattingId}`]: list.reverse(),
										})
									);
									globalMessage.success({
										content: '聊天消息同步成功',
									});
								} else {
									globalMessage.error({
										content: '聊天消息同步失败',
									});
								}
							})
							.catch((err) => {
								globalMessage.error({
									content: '聊天消息同步失败',
								});
							});
					}}>
					<CloudSyncOutlined />
				</div>
				<div style={{ marginLeft: 'auto' }}>
					<Button type='primary' onClick={sendMessage} disabled={rawHtml === ''}>
						发送
					</Button>
				</div>
			</div>
			<div
				ref={inputRef}
				className='chatInputContentDiv'
				contentEditable={'plaintext-only'}
				spellCheck={false}
				onInput={(evt) => {
					setRawHtml(evt.target.innerHTML);
				}}
				onKeyUp={() => {
					const selection = getSelection();
					setLastEditRange(selection.getRangeAt(0));
				}}
			/>
		</>
	);
}

function getCaretPosition(element) {
	let caretOffset = 0;
	const doc = element.ownerDocument || element.document;
	const win = doc.defaultView || doc.parentWindow;
	let sel;
	sel = win.getSelection();
	if (sel.rangeCount > 0) {
		//选中的区域
		const range = win.getSelection().getRangeAt(0);
		const preCaretRange = range.cloneRange(); //克隆一个选中区域
		preCaretRange.selectNodeContents(element); //设置选中区域的节点内容为当前节点
		preCaretRange.setEnd(range.endContainer, range.endOffset); //重置选中区域的结束位置
		caretOffset = preCaretRange.toString().length;
	}
	return caretOffset;
}

function setCaretPosition(element, pos) {
	const range = createRange(element, { count: pos });
	const selection = window.getSelection();
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
	return range;
}

function createRange(node, chars, range) {
	if (!range) {
		range = document.createRange();
		range.selectNode(node);
		range.setStart(node, 0);
	}
	if (chars.count === 0) {
		range.setEnd(node, chars.count);
	} else if (node && chars.count > 0) {
		if (node.nodeType === Node.TEXT_NODE) {
			if (node.textContent.length < chars.count) {
				chars.count -= node.textContent.length;
			} else {
				range.setEnd(node, chars.count);
				chars.count = 0;
			}
		} else if (node.tagName === 'IMG') {
			range.setEndAfter(node);
		} else {
			for (let lp = 0; lp < node.childNodes.length; lp++) {
				range = createRange(node.childNodes[lp], chars, range);
				if (chars.count === 0) {
					break;
				}
			}
		}
	}
	return range;
}

function Emojis(props) {
	return (
		<div className='emojisContainer'>
			{emojis.map((emoji) => (
				<div
					className='emojiBlock'
					title={emoji.title}
					onClick={() => {
						props.onChoose(emoji);
					}}
					key={emoji.id}>
					<div
						className='emoji'
						style={{
							backgroundImage: `url(./emoji/${emoji.id}.png)`,
						}}
					/>
				</div>
			))}
		</div>
	);
}

const emojis = [
	{
		title: '生气',
		id: 'angry',
	},
	{
		title: '傲娇',
		id: 'aojiao',
	},
	{
		title: '妙啊',
		id: 'awesome',
	},
	{
		title: '尴尬',
		id: 'awkward',
	},
	{
		title: '呲牙',
		id: 'bareTeeth',
	},
	{
		title: '黑洞',
		id: 'blackhole',
	},
	{
		title: '保佑',
		id: 'bless',
	},
	{
		title: '再见',
		id: 'bye',
	},
	{
		title: '阴险',
		id: 'cattiness',
	},
	{
		title: '打call',
		id: 'cheer',
	},
	{
		title: '干杯',
		id: 'cheers',
	},
	{
		title: '加油',
		id: 'cheerUp',
	},
	{
		title: '鼓掌',
		id: 'clap',
	},
	{
		title: '冷',
		id: 'cold',
	},
	{
		title: '酷',
		id: 'cool',
	},
	{
		title: '捂眼',
		id: 'coverEyes',
	},
	{
		title: '嫌弃',
		id: 'dislike',
	},
	{
		title: 'doge',
		id: 'doge',
	},
	{
		title: '歪嘴龙王',
		id: 'dragonKing',
	},
	{
		title: '鸡腿',
		id: 'drumstick',
	},
	{
		title: '囧',
		id: 'embarrassed',
	},
	{
		title: '辣眼睛',
		id: 'eyesore',
	},
	{
		title: '口罩',
		id: 'faceCover',
	},
	{
		title: '捂脸',
		id: 'facepalm',
	},
	{
		title: '奋斗',
		id: 'fighting',
	},
	{
		title: '打响指',
		id: 'fingerSnap',
	},
	{
		title: '抱拳',
		id: 'fistGrip',
	},
	{
		title: '滑稽',
		id: 'funny',
	},
	{
		title: '幽灵',
		id: 'ghost',
	},
	{
		title: '爱心',
		id: 'heart',
	},
	{
		title: '呵呵',
		id: 'hehe',
	},
	{
		title: '拥抱',
		id: 'hug',
	},
	{
		title: '嘘',
		id: 'hush',
	},
	{
		title: '跪了',
		id: 'kneeling',
	},
	{
		title: '锦鲤',
		id: 'koiFish',
	},
	{
		title: '绷不住了',
		id: 'laughToCry',
	},
	{
		title: '酸',
		id: 'lemon',
	},
	{
		title: '喜欢',
		id: 'like',
	},
	{
		title: '抓狂',
		id: 'mad',
	},
	{
		title: '吃瓜',
		id: 'melon',
	},
	{
		title: '月饼',
		id: 'mooncake',
	},
	{
		title: '调皮',
		id: 'naughty',
	},
	{
		title: 'ok',
		id: 'ok',
	},
	{
		title: '哦呼',
		id: 'oufu',
	},
	{
		title: '疼',
		id: 'pain',
	},
	{
		title: '抠鼻',
		id: 'pickNose',
	},
	{
		title: '撇嘴',
		id: 'pout',
	},
	{
		title: '大笑',
		id: 'risus',
	},
	{
		title: '悲伤',
		id: 'sad',
	},
	{
		title: '惊讶',
		id: 'shock',
	},
	{
		title: '吓',
		id: 'shocked',
	},
	{
		title: '耸肩',
		id: 'shrug',
	},
	{
		title: '害羞',
		id: 'shy',
	},
	{
		title: '生病',
		id: 'sick',
	},
	{
		title: '奸笑',
		id: 'sinisterSmile',
	},
	{
		title: '微笑',
		id: 'smile',
	},
	{
		title: '无语',
		id: 'speechless',
	},
	{
		title: '星星眼',
		id: 'starEyes',
	},
	{
		title: '点赞',
		id: 'support',
	},
	{
		title: '惊喜',
		id: 'surprise',
	},
	{
		title: '笑哭',
		id: 'tearsOfJoy',
	},
	{
		title: '思考',
		id: 'think',
	},
	{
		title: '怒赞',
		id: 'thumbUp',
	},
	{
		title: '藏狐',
		id: 'tibetanFox',
	},
	{
		title: '偷笑',
		id: 'titter',
	},
	{
		title: '胜利',
		id: 'victory',
	},
	{
		title: '呕吐',
		id: 'vomit',
	},
	{
		title: '大哭',
		id: 'wail',
	},
	{
		title: '白眼',
		id: 'whiteEyes',
	},
	{
		title: '呆',
		id: 'wildered',
	},
	{
		title: '疑惑',
		id: 'wondering',
	},
	{
		title: '委屈',
		id: 'wronged',
	},
	{
		title: '呵欠',
		id: 'yawn',
	},
];
