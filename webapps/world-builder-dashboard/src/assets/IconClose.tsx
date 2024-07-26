import React from 'react'

const IconClose: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' {...props}>
    <path
      d='M18 6L6 18M6 6L18 18'
      stroke={props.stroke ?? '#667085'}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export default IconClose