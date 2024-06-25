import React from "react";

const IconArrowNarrowDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
        <path d="M6 2V10M6 10L9 7M6 10L3 7" stroke={props.stroke ?? "#FFF"} strokeWidth="1.5" strokeLinecap="round"
              strokeLinejoin="round"/>
    </svg>
);

export default IconArrowNarrowDown;