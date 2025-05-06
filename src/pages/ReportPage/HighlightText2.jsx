import React from "react";

export default function HighlightText2({ prop }) {
  return (
    <span style={{ color: "yellow" }}>
      <b>{prop}</b>
    </span>
  );
}
