import React from 'react'

const IconCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
    <path
      d='M16.6666 5L7.49992 14.1667L3.33325 10'
      stroke={props.stroke ?? '#039855'}
      strokeWidth={props.strokeWidth ?? '1.66667'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export default IconCheck
