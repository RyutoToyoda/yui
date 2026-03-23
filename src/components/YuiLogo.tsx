"use client";

import Image from "next/image";

type YuiLogoProps = {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function YuiLogo({ className = "", alt = "結 Yui ロゴ", width = 120, height = 120 }: YuiLogoProps) {
  return (
    <Image
      src="/branding/yui_logo.png"
      alt={alt}
      width={width}
      height={height}
      className={`${className}`}
      priority
    />
  );
}
