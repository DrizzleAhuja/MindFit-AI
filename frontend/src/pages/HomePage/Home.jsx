import React from "react";
import NavBar from "./NavBar";
import HeroSection from "./HeroSection";
import Section2 from "./Section2";
import CallToAction from "./CallToAction"; // Import the new CTA component
import HowItWorks from "./HowItWorks"; // Import the new HowItWorks component
import Footer from "./Footer";
// import NotificationsPage from "../NotificationsPage/Section1";

export default function Home() {
  return (
    <div className="home-container">
      <NavBar />
      <HeroSection />
      {/* <Section2 /> */}
      <CallToAction /> {/* Add the CallToAction component here */}
      <HowItWorks /> {/* Add the HowItWorks component here */}

      <Footer />
    </div>
  );
}
