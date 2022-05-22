import { message } from 'antd';

const vh = window.innerHeight / 100;

message.config({
    maxCount: 2,
    top: 10 * vh,
    duration: 1,
});

export { message as globalMessage };

