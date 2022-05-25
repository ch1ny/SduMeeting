import { ReactNode } from "react"

export interface ChatMessage {
    date: number,
    fromId: number,
    id: number,
    message: string,
    toId: number,
    myId?: number,
    userId: number
}

export interface DeviceInfo {
    webLabel?: ReactNode
    deviceId: string,
    label: string,
}

export interface UserInfo {
    email: string,
    exp: number,
    iat: number,
    id: number,
    iss: string,
    profile: string | false,
    role: [
        {
            authority: string,
            id: number
        }
    ],
    sub: string,
    username: string
}

export interface ElectronWindow extends Window {
    captureDesktop: () => Promise<HTMLVideoElement>,
    ipc: {
        on: (channel: string, cb: Function) => void,
        once: (channel: string, cb: Function) => void,
        invoke: (channel: string, ...args: any) => Promise<any>,
        removeListener: (channel: string, cb: Function) => void,
        send: (channel: string, ...args: any) => void;
    }
}

// declare const window: Window & typeof globalThis & ElectronWindow