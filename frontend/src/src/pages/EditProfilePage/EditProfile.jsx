import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Footer from "../HomePage/Footer";

export default function EditProfile() {
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
