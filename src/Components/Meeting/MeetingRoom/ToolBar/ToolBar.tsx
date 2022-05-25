import React, { ReactNode } from "react";

interface ToolBarProps {
    toolButtons: Array<ReactNode>
}

export default function ToolBar(props: ToolBarProps) {
    return (
        <div id='toolbar'>
            {
                props.toolButtons.map((node, index) => (
                    <React.Fragment key={index}>
                        {node}
                    </React.Fragment>
                ))
            }
        </div>
    )
}