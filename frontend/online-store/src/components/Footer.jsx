import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* ----- ABOUT SECTION ----- */}
        <div className="footer-section">
          <h3>About TechZone</h3>
          <p>
            TechZone is your go-to destination for the latest and greatest in electronics. From
            smartphones to laptops, we bring technology to your fingertips with trusted quality and
            competitive prices.
          </p>
        </div>

        {/* ----- QUICK LINKS ----- */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link to="/about-us">About Us</Link>
            </li>
            <li>
              <Link to="/terms-policy">Terms & Policy</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        {/* ----- CONTACT INFO ----- */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul className="contact-info">
            <li>Email: support@techzone.com</li>
            <li>Phone: +90 555 123 4567</li>
            <li>Address: Istanbul, Türkiye</li>
          </ul>
        </div>
      </div>

      {/* ----- COPYRIGHT BAR ----- */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} TechZone. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
