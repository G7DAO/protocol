import React, { forwardRef } from 'react'

const IconInfoCircle = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='20'
    height='20'
    viewBox='0 0 20 20'
    fill='none'
    ref={ref} // Forward the ref to the SVG element
    {...props}
  >
    <g clipPath='url(#clip0_9213_60512)'>
      <path
        d='M9.99996 13.3332V9.99984M9.99996 6.6665H10.0083M18.3333 9.99984C18.3333 14.6022 14.6023 18.3332 9.99996 18.3332C5.39759 18.3332 1.66663 14.6022 1.66663 9.99984C1.66663 5.39746 5.39759 1.6665 9.99996 1.6665C14.6023 1.6665 18.3333 5.39746 18.3333 9.99984Z'
        stroke={props.stroke ?? '#667085'}
        strokeWidth={props.strokeWidth ?? '1.66667'}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_9213_60512'>
        <rect width='20' height='20' fill='white' />
      </clipPath>
    </defs>
  </svg>
))

export default IconInfoCircle