// src/components/ui/AppLayout.js
import React from "react";
import Header from "./Header";

const AppLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main style={{ paddingTop: "60px" }}>{children}</main>
    </>
  );
};

export default AppLayout;
