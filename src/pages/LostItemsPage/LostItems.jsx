import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Footer from "../HomePage/Footer";

export default function Aboutus({ darkMode, toggleDarkMode }) {
  return (
    <div className={darkMode ? "dark" : ""}>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div>
        <Section1 darkMode={darkMode} />
        <Section2 darkMode={darkMode} />
        <Section3 darkMode={darkMode} />
        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
}
