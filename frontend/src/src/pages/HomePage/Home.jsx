import React from "react";
import NavBar from "./NavBar";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Footer from "./Footer";
// import NotificationsPage from "../NotificationsPage/Section1";

export default function Home() {
  return (
    <div className="home-container">
      <NavBar />
      {/* <Section1 /> */}
      <Section2 />

      <Footer />
    </div>
  );
}
