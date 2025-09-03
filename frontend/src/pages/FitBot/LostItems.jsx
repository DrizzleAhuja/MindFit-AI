import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Footer from "../HomePage/Footer";

export default function LostItems() {
  return (
    <div className="dark">
      <NavBar />
      <div>
        <Section1 />
        <Section2 />
        <Section3 />
        <Footer />
      </div>
    </div>
  );
}
