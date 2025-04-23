import React from "react";
import { useDrop } from "react-dnd";

const DropCell = ({ room, currentTime, onDrop, onClick }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "surgery",
    drop: (item) => {
        onDrop(item); // item.docId, item.durationMinutes, item.room, item.start を渡せる
      },
      
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const backgroundColor = isOver
    ? "#c3f0ca"
    : canDrop
    ? "#e8f5e9"
    : "transparent";

  return (
    <td
      ref={drop}
      className="sr-cell"
      onClick={onClick}
      style={{
        backgroundColor,
        border: "1px solid #ccc",
        minWidth: "60px",
        height: "32px",
        cursor: "pointer",
        transition: "background-color 0.2s",
      }}
    />
  );
};

export default DropCell;
