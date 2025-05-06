import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Footer from "../HomePage/Footer";

export default function Contactus({ darkMode, toggleDarkMode }) {
  return (
    <div className={darkMode ? "dark" : ""}>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div>
        <Section1 darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
}
