import React from "react";
import MeetingRoom from "./MeetingRoom/MeetingRoom";

export default class Meeting extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <>
                <MeetingRoom />
            </>
        )
    }
}