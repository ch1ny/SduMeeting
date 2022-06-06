//'use strict';
const defaultCryptoKey = 'SDU_MEETING';
let currentKeyIdentifier = 0;

// If using crypto offset (controlled by a checkbox):
// Do not encrypt the first couple of bytes of the payload. This allows
// a middle to determine video keyframes or the opus mode being used.
// For VP8 this is the content described in
// 如果使用加密偏移（由一个复选框控制）。
// 不要对有效载荷的前几个字节进行加密。这允许
// 中间确定视频关键帧或正在使用的 opus 模式。
// 对于VP8来说，这就是 "视频 "中描述的内容。
//   https://tools.ietf.org/html/rfc6386#section-9.1
// which is 10 bytes for key frames and 3 bytes for delta frames.
// For opus (where encodedFrame.type is not set) this is the TOC byte from
//对关键帧来说是10个字节，对delta帧来说是3个字节。
// 对于opus（未设置encodedFrame.type），这是TOC字节，来自于
//   https://tools.ietf.org/html/rfc6716#section-3.1
//
// It makes the (encrypted) video and audio much more fun to watch and listen to
// as the decoder does not immediately throw a fatal error.
// 它使（加密的）视频和音频在观看和聆听时更有乐趣
// 因为解码器不会立即抛出一个致命的错误。
const frameTypeToCryptoOffset = {
	key: 10,
	delta: 3,
	undefined: 1,
};

function encodeFunction(encodedFrame: any, controller: any, cryptoKey?: string) {
	const currentCryptoKey = cryptoKey || defaultCryptoKey;
	// console.log(currentCryptoKey);
	const view = new DataView(encodedFrame.data);
	// Any length that is needed can be used for the new buffer.
	// 任何需要的长度都可以用于新的缓冲区。
	const newData = new ArrayBuffer(encodedFrame.data.byteLength + 5);
	const newView = new DataView(newData);

	const cryptoOffset =
		frameTypeToCryptoOffset[encodedFrame.type as keyof typeof frameTypeToCryptoOffset];
	for (let i = 0; i < cryptoOffset && i < encodedFrame.data.byteLength; ++i) {
		newView.setInt8(i, view.getInt8(i));
	}
	// This is a bitwise xor of the key with the payload. This is not strong encryption, just a demo.
	// 这是对密钥和有效载荷进行的位数交换。这不是强加密，只是一个演示。
	for (let i = cryptoOffset; i < encodedFrame.data.byteLength; ++i) {
		const keyByte = currentCryptoKey.charCodeAt(i % currentCryptoKey.length);
		newView.setInt8(i, view.getInt8(i) ^ keyByte);
	}
	// Append keyIdentifier.
	// 添加keyIdentifier。
	newView.setUint8(encodedFrame.data.byteLength, currentKeyIdentifier % 0xff);
	// Append checksum
	// 添加校验和
	newView.setUint32(encodedFrame.data.byteLength + 1, 0xdeadbeef);

	encodedFrame.data = newData;
	//console.log("encode");
	controller.enqueue(encodedFrame);
}

function decodeFunction(encodedFrame: any, controller: any, cryptoKey?: string) {
	const view = new DataView(encodedFrame.data);
	const checksum =
		encodedFrame.data.byteLength > 4 ? view.getUint32(encodedFrame.data.byteLength - 4) : false;
	const currentCryptoKey = cryptoKey || defaultCryptoKey;
	if (checksum !== 0xdeadbeef) {
		// console.log('Corrupted frame received, checksum ' + checksum.toString(16));
		return; // This can happen when the key is set and there is an unencrypted frame in-flight.
		// 这种情况可能发生在设置了密钥并且有一个未加密的帧在飞行的情况下。
	}
	const keyIdentifier = view.getUint8(encodedFrame.data.byteLength - 5);
	if (keyIdentifier !== currentKeyIdentifier) {
		// console.log(
		//     `Key identifier mismatch, got ${keyIdentifier} expected ${currentKeyIdentifier}.`
		// );
		return;
	}

	const newData = new ArrayBuffer(encodedFrame.data.byteLength - 5);
	const newView = new DataView(newData);
	const cryptoOffset =
		frameTypeToCryptoOffset[encodedFrame.type as keyof typeof frameTypeToCryptoOffset];

	for (let i = 0; i < cryptoOffset; ++i) {
		newView.setInt8(i, view.getInt8(i));
	}
	for (let i = cryptoOffset; i < encodedFrame.data.byteLength - 5; ++i) {
		const keyByte = currentCryptoKey.charCodeAt(i % currentCryptoKey.length);
		newView.setInt8(i, view.getInt8(i) ^ keyByte);
	}
	encodedFrame.data = newData;
	controller.enqueue(encodedFrame);
}

export function setupSenderTransform(sender: RTCRtpSender, cryptoKey?: string) {
	const senderStreams = (sender as any).createEncodedStreams();
	const transformStream = new TransformStream({
		transform: (frame, controller) => {
			encodeFunction(frame, controller, cryptoKey);
		},
	});
	senderStreams.readable.pipeThrough(transformStream).pipeTo(senderStreams.writable);
}

export function setupReceiverTransform(receiver: RTCRtpReceiver, cryptoKey?: string) {
	const receiverStreams = (receiver as any).createEncodedStreams();
	const transformStream = new TransformStream({
		transform: (frame, controller) => {
			decodeFunction(frame, controller, cryptoKey);
		},
	});
	receiverStreams.readable.pipeThrough(transformStream).pipeTo(receiverStreams.writable);
}
