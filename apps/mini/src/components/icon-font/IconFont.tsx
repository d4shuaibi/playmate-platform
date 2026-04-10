import { IconFont } from "@nutui/icons-react-taro";
import type { CSSProperties } from "react";

type AppIconFontProps = {
  name: string;
  className?: string;
  size?: string | number;
  color?: string;
  style?: CSSProperties;
};

export const AppIconFont = ({ name, className, size, color, style }: AppIconFontProps) => {
  return (
    <IconFont
      name={name}
      className={className}
      size={size}
      color={color}
      style={style}
      fontClassName="iconfont"
      classPrefix="icon"
    />
  );
};
