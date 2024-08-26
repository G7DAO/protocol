import React, { forwardRef } from 'react'

const IconAlertCircle = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none' ref={ref} {...props}>
    <g clipPath='url(#clip0_9941_66009)'>
      <path
        d='M9.99999 6.66699V10.0003M9.99999 13.3337H10.0083M18.3333 10.0003C18.3333 14.6027 14.6024 18.3337 9.99999 18.3337C5.39762 18.3337 1.66666 14.6027 1.66666 10.0003C1.66666 5.39795 5.39762 1.66699 9.99999 1.66699C14.6024 1.66699 18.3333 5.39795 18.3333 10.0003Z'
        strokeWidth='1.66667'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_9941_66009'>
        <rect width='20' height='20' fill='white' />
      </clipPath>
    </defs>
  </svg>
))

export default IconAlertCircle
