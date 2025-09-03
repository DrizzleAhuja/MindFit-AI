import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1"; // This will display user logs
import Footer from "../HomePage/Footer";

export default function UserLogsPage() {
  return (
    <div className="dark">
      <NavBar />
      <div>
        <Section1 />
        <Footer />
      </div>
    </div>
  );
}
