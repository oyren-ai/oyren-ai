import React from 'react';

interface SelectionRectangleProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const SelectionRectangle: React.FC<SelectionRectangleProps> = ({
  startX,
  startY,
  endX,
  endY
}) => {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
};

export default SelectionRectangle;