"use client";

import { useState } from "react";

const RAW_LOGO_SRC = "/images/logo.png";

type YuiLogoProps = {
  className?: string;
  alt?: string;
};

export default function YuiLogo({ className = "", alt = "結 Yui ロゴ" }: YuiLogoProps) {
  const [hasImage, setHasImage] = useState(true);

  if (!hasImage) {
    return <span className={`font-yui-logo text-yui-green-800 ${className}`}>結 Yui</span>;
  }

  return <img src={RAW_LOGO_SRC} alt={alt} className={className} onError={() => setHasImage(false)} />;
}
