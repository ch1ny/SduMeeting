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

