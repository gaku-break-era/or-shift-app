// src/components/ui/input.jsx
import React from "react";

export const Input = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "0.5rem",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
    />
  );
};
