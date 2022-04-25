import { SmileOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { emojiRegExp } from "./emoji";
import './style.scss'

export default function ChatInput(props) {
    const [rawHtml, setRawHtml] = useState('');
    const inputRef = useRef()
    useEffect(() => {
        // 光标位置
        const caretOffset = getCaretPosition(inputRef.current)
        let htmlStr = rawHtml
        // const regex1 = new RegExp("(i?)(\<img)(?!(.*?class=['\"](.*)['\"])[^\>]+\>)", "gmi");
        // //给不含class="" 或 class='' 的img标签加上class=""
        // htmlstr = htmlstr.replace(regex1, "$2 class=\"\"$3");
        // //正则匹配含有class的img标签
        // const regex2 = new RegExp("(i?)(\<img.*?class=['\"])(['\"][^\>]+\>)", "gmi");
        // //在img标签的class里面增加类名
        // htmlstr = htmlstr.replace(regex2, "$2test-class$3");

        htmlStr = htmlStr.replace(emojiRegExp, `<img class="emoji" src="./emoji/$2.png" />`)
        inputRef.current.innerHTML = htmlStr
        setCaretPosition(inputRef.current, caretOffset)
    }, [rawHtml])

    const [showEmojis, setShowEmojis] = useState(false)

    return (
        <>
            <div className="chatInputControlPanel">
                <div className="chatInputControlButtons" title="表情">
                    <Popover
                        content={
                            <Emojis
                                onChoose={({ title, id }) => {
                                    setShowEmojis(false)
                                    console.log({ title, id })
                                }}
                            />
                        }
                        // title="Title"
                        placement='topLeft'
                        arrowPointAtCenter
                        trigger="click"
                        visible={showEmojis}
                        onVisibleChange={setShowEmojis}
                    >
                        <SmileOutlined />
                    </Popover>
                </div>
            </div>
            <div
                ref={inputRef}
                className="chatInputContentDiv"
                contentEditable={'plaintext-only'}
                onInput={(evt) => {
                    setRawHtml(evt.target.innerHTML);
                }}
            />
        </>
    )
}

function getCaretPosition(element) {
    let caretOffset = 0;
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    let sel;
    sel = win.getSelection();
    if (sel.rangeCount > 0) {//选中的区域
        const range = win.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();//克隆一个选中区域
        preCaretRange.selectNodeContents(element);//设置选中区域的节点内容为当前节点
        preCaretRange.setEnd(range.endContainer, range.endOffset);  //重置选中区域的结束位置
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

function setCaretPosition(element, pos) {
    const range = createRange(element, { count: pos })
    const selection = window.getSelection()
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
}

function createRange(node, chars, range) {
    if (!range) {
        range = document.createRange()
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
            range.setEndAfter(node)
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
};

function Emojis(props) {
    const emojis = [
        {
            title: '生气',
            id: 'angry'
        },
        {
            title: '傲娇',
            id: 'aojiao'
        },
        {
            title: '妙啊',
            id: 'awesome'
        },
        {
            title: '尴尬',
            id: 'awkward'
        },
        {
            title: '呲牙',
            id: 'bareTeeth'
        },
        {
            title: '黑洞',
            id: 'blackhole'
        },
        {
            title: '保佑',
            id: 'bless'
        },
        {
            title: '再见',
            id: 'bye'
        },
        {
            title: '阴险',
            id: 'cattiness'
        },
        {
            title: '打call',
            id: 'cheer'
        },
        {
            title: '干杯',
            id: 'cheers'
        },
        {
            title: '加油',
            id: 'cheerUp'
        },
        {
            title: '鼓掌',
            id: 'clap'
        }
    ]

    return (
        <div className="emojisContainer">
            {
                emojis.map(emoji => {
                    console.log(emoji)
                    return (
                        <div
                            className="emojiBlock"
                            title={emoji.title}
                            onClick={() => {
                                props.onChoose(emoji)
                            }}
                            key={emoji.id}
                        >
                            <div className='emoji'
                                style={{
                                    backgroundImage: `url(./emoji/${emoji.id}.png)`
                                }}
                            />
                        </div>
                    )
                })
            }
        </div>
    )
}