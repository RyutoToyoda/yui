"use client";

import { useState } from "react";

const RAW_LOGO_SRC = "/images/logo.png";

type YuiLogoProps = {
  className?: string;
  alt?: string;
};

export default function YuiLogo({ className = "", alt = "結 Yui ロゴ" }: YuiLogoProps) {
  // Remove image-specific classes like object-contain so they don't interfere with the text logo
  const cleanClassName = className.replace('object-contain', '');

  return (
    <span
      className={`font-yui-logo text-yui-green-800 text-3xl font-black tracking-normal leading-none flex items-center ${cleanClassName}`}
      aria-label={alt}
    >
      結 Yui
    </span>
  );
}
