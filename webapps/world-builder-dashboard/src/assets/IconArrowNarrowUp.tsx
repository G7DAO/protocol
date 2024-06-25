import React from "react";

const IconArrowNarrowUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
        <path d="M6 10V2M6 2L3 5M6 2L9 5" stroke={props.stroke ?? "#FFF"} strokeWidth="1.5" strokeLinecap="round"
              strokeLinejoin="round"/>
    </svg>
);

export default IconArrowNarrowUp;