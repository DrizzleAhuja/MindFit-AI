import React from "react";
import NavBar from "../HomePage/NavBar";
import Section1 from "./Section1";
import Footer from "../HomePage/Footer";

export default function Signin({ darkMode, toggleDarkMode }) {
  return (
    <div className={darkMode ? "dark" : ""}>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div>
        <Section1 darkMode={darkMode} />
        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
}
