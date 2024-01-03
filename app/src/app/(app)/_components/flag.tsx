import React from "react";

export default function Flag() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="30"
      height="20"
      viewBox="-120 -80 240 160"
    >
      <defs>
        <path
          id="A"
          strokeMiterlimit="10"
          d="M-1 55.426h2V-38c2-2 2-5 2-8 0-2 0-10-3-18.663C-3-56-3-48-3-46c0 3 0 6 2 8z"
          transform="rotate(30)"
        ></path>
      </defs>
      <path fill="#fff" d="M-120-80h240V80h-240z"></path>
      <path d="M-120-80h240v48h-240z"></path>
      <path fill="#060" d="M-120 32h240v48h-240z"></path>
      <g id="B">
        <use stroke="#000" xlinkHref="#A"></use>
        <use fill="#fff" xlinkHref="#A"></use>
      </g>
      <use transform="scale(-1 1)" xlinkHref="#B"></use>
      <path
        fill="#b00"
        d="M-120-24v48h101c3 8 13 24 19 24s16-16 19-24h101v-48H19C16-32 6-48 0-48s-16 16-19 24z"
      ></path>
      <path
        id="C"
        d="M19 24c3-8 5-16 5-24s-2-16-5-24c-3 8-5 16-5 24s2 16 5 24"
      ></path>
      <use transform="scale(-1 1)" xlinkHref="#C"></use>
      <g fill="#fff">
        <ellipse rx="4" ry="6"></ellipse>
        <path id="D" d="M1 5.85s4 8 4 21-4 21-4 21z"></path>
        <use transform="scale(-1)" xlinkHref="#D"></use>
        <use transform="scale(-1 1)" xlinkHref="#D"></use>
        <use transform="scale(1 -1)" xlinkHref="#D"></use>
      </g>
    </svg>
  );
}
