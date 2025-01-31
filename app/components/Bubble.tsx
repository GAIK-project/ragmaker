import React from "react";

interface BubbleProps {
    message: any;
}

const Bubble = ({ message }) => {
    const { content, role } = message
    return (
        <div className={`${role} bubble`}>{content}</div>
    )
}

export default Bubble