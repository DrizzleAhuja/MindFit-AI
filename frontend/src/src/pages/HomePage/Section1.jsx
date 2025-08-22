import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LOST from "../../Images/LOST.png";
import FOUND from "../../Images/FOUND1.png";
import LOSTSMALL from '../../Images/LOST-SMALL.jpg';
import FOUNDSMALL from "../../Images/FOUND-SMALL.jpg"
import './Section.css';

const Section1 = ({ darkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManualControl, setIsManualControl] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isManualControl) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval); // Clean up the interval on component unmount
    }
  }, [isManualControl]);

  const goToSlide = (index) => {
    setIsManualControl(true);
    setCurrentIndex(index);
  };

  const prevSlide = () => {
    setIsManualControl(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setIsManualControl(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const images = [
    windowWidth <= 900 ? LOSTSMALL : LOST, // Replace LOST with LOSTSMALL on small screens
    windowWidth <= 900 ? FOUNDSMALL : FOUND, // Replace LOST with LOSTSMALL on small screens
  ];

  return (
    <div className={`section-container ${darkMode ? "dark" : "light"} min-h-screen p-8`}>
      <div className="text-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">
            What have you Lost/Found today?
          </h1>
          <div className="flex justify-center space-x-4 mb-8">
            <Link to="/LostItems">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
                Lost Item
              </button>
            </Link>
            <Link to="/FoundItems">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
                Found Item
              </button>
            </Link>
          </div>
        </div>

        {/* Image Carousel */}
        <div className={`carousel-container relative mt-8 md:mt-12`}>
          <div className={`carousel-inner ${darkMode ? "dark-mode" : ""}`}>
            <img src={images[currentIndex]} alt="Carousel" className={`carousel-image ${darkMode ? "dark-mode-image" : ""}`} />
          </div>
          {/* <button className="carousel-arrow left-arrow" onClick={prevSlide}>
            &#9664;
          </button>
          <button className="carousel-arrow right-arrow" onClick={nextSlide}>
            &#9654;
          </button> */}
          <div className="carousel-dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(index)}
              ></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Section1;



