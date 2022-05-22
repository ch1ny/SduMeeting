import { UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Image, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import { UploadChangeParam } from 'antd/lib/upload';
import { globalMessage } from 'Components/GlobalMessage/GlobalMessage';
import React, { useState } from 'react';
import './style.scss';

interface UploadAvatarProps {
    onCropped: (arg0: any) => Promise<any>;
    avatar: string | undefined;
    getContainer: any;
}

export default function UploadAvatar(props: UploadAvatarProps) {
    const [loading, setLoading] = useState(false);
    const beforeUpload = (file: Blob) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            globalMessage.error('请上传(JPG/PNG)图片!');
            return Upload.LIST_IGNORE;
        }

        const isLt4M = file.size / 1024 / 1024 < 4;
        if (!isLt4M) {
            globalMessage.error('请上传4M以内的图片!');
            return Upload.LIST_IGNORE;
        }

        return isJpgOrPng && isLt4M;
    };

    return (
        <div className='uploadAvatarContainer'>
            <div className='uploadAvatarImageContainer'>
                <Image
                    width={120}
                    height={120}
                    src={props.avatar}
                    placeholder={<Avatar shape='square' size={120} icon={<UserOutlined />} />}
                    preview={props.avatar ? { getContainer: props.getContainer } : false}
                />
            </div>
            <div className='uploadAvatarTriggerContainer'>
                <ImgCrop rotate grid>
                    <Upload
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        onChange={(evt: UploadChangeParam) => {
                            switch (evt.file.status) {
                                case 'uploading':
                                    setLoading(true);
                                    break;
                                case 'done':
                                    setLoading(false);
                            }
                        }}
                        customRequest={async (evt: { file: any; }) => {
                            props.onCropped(evt.file).then(() => {
                                setLoading(false);
                            });
                        }}
                    >
                        <Button type='primary' ghost loading={loading}>
                            上传头像
                        </Button>
                    </Upload>
                </ImgCrop>
            </div>
        </div>
    );
}
