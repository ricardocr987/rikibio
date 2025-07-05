import React, { ReactNode } from "react";

interface ScrollAreaProps {
  className?: string;
  children: ReactNode;
  maxHeight?: string;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({
  className = "",
  children,
  maxHeight = "100%",
}) => {
  return (
    <div
      className={`overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}
      style={{ maxHeight }}
    >
      <div className="p-10">{children}</div>
    </div>
  );
};

export { ScrollArea };
