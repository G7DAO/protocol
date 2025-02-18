import React from "react";
interface Props {
  isHovered?: boolean;
}

const IconRelay: React.FC<React.SVGProps<SVGSVGElement> & Props> = ({
                                                                      isHovered = false,
                                                                      ...props
                                                                    }: Props & React.SVGProps<SVGSVGElement>) =>
  isHovered ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <mask
        id="mask0_19025_14610"
        maskUnits="userSpaceOnUse"
        x="2"
        y="1"
        width="20"
        height="22"
      >
        <path d="M21.5989 1H2.4028V23H21.5989V1Z" fill="white" />
      </mask>
      <g mask="url(#mask0_19025_14610)">
        <path
          d="M12.0738 19.0315L16.1853 16.6577V9.56174L10.04 6.01375L5.84324 8.43672L12.0738 12.0339V19.0315Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.40484 5.74767L12.0006 3.67166L14.2669 2.35814L12.2277 1.18079C12.0872 1.09967 11.914 1.09967 11.7735 1.18079L2.76546 6.38161C2.62495 6.46273 2.53839 6.61265 2.53839 6.77489V17.1765C2.53839 17.3388 2.62495 17.4887 2.76546 17.5698L11.7735 22.7706C11.914 22.8517 12.0872 22.8517 12.2277 22.7706L21.2357 17.5698C21.3763 17.4887 21.4628 17.3388 21.4628 17.1765V14.8179L19.1921 16.1277L12.0006 20.2798L4.80907 16.1277V7.82369L8.40484 5.74767Z"
          fill="white"
        />
        <path
          d="M17.3653 15.9887L21.4767 13.615V6.76806C21.4767 6.61393 21.3945 6.47154 21.261 6.39447L15.3314 2.97102L11.1347 5.39403L17.3653 8.99129V15.9887Z"
          fill="white"
        />
      </g>
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <mask
        id="mask0_19107_112534"
        maskUnits="userSpaceOnUse"
        x="2"
        y="1"
        width="20"
        height="22"
      >
        <path d="M21.5989 1H2.40283V23H21.5989V1Z" fill="white" />
      </mask>
      <g mask="url(#mask0_19107_112534)">
        <path
          d="M12.0738 19.0333L16.1853 16.6596V9.56362L10.04 6.01562L5.84326 8.4386L12.0738 12.0358V19.0333Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.40484 5.74881L12.0006 3.67281L14.2669 2.35929L12.2277 1.18194C12.0872 1.10081 11.914 1.10081 11.7735 1.18194L2.76546 6.38276C2.62495 6.46388 2.53839 6.6138 2.53839 6.77604V17.1777C2.53839 17.3399 2.62495 17.4898 2.76546 17.571L11.7735 22.7717C11.914 22.8528 12.0872 22.8528 12.2277 22.7717L21.2357 17.571C21.3763 17.4898 21.4628 17.3399 21.4628 17.1777V14.819L19.1921 16.1289L12.0006 20.2809L4.80907 16.1289V7.82483L8.40484 5.74881Z"
          fill="currentColor"
        />
        <path
          d="M17.3653 15.9903L21.4767 13.6166V6.76969C21.4767 6.61556 21.3945 6.47317 21.261 6.3961L15.3314 2.97266L11.1346 5.39566L17.3653 8.99292V15.9903Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );

export default IconRelay;
