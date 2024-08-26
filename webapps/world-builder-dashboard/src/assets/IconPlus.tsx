import React from 'react'

const IconPlus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' {...props}>
    <path
      d='M8.00065 3.33594V12.6693M3.33398 8.0026H12.6673'
      stroke={props.stroke ?? '#344054'}
      strokeWidth={props.strokeWidth ?? '1.33333'}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export default IconPlus
