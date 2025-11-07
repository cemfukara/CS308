import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1>About TechZone</h1>
        <p className="intro-text">
          At <strong>TechZone</strong>, we believe technology should be accessible, reliable, and
          exciting. Since our founding, we’ve been committed to connecting customers with the most
          innovative devices and electronics from trusted global brands.
        </p>

        <div className="about-sections">
          <div className="about-card">
            <h3>Our Mission</h3>
            <p>
              To empower people through technology by providing the best products, prices, and
              service possible. We aim to simplify shopping for electronics while delivering
              exceptional customer care.
            </p>
          </div>

          <div className="about-card">
            <h3>What We Offer</h3>
            <p>
              From smartphones and laptops to accessories and gaming gear, we provide a wide range
              of products to suit every need. Our team continuously updates our catalog with the
              latest releases to keep you ahead of the curve.
            </p>
          </div>

          <div className="about-card">
            <h3>Why Choose Us?</h3>
            <ul>
              <li>Trusted by thousands of customers nationwide</li>
              <li>Fast shipping and easy returns</li>
              <li>Secure payments and transparent pricing</li>
              <li>Friendly customer support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
