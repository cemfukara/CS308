import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 py-4 text-center mt-auto">
      <Link to="/about-us" className="hover:text-blue-500 mx-2">
        About Us
      </Link>
      |
      <Link to="/terms-policy" className="hover:text-blue-500 mx-2">
        Terms & Policy
      </Link>
    </footer>
  );
}

export default Footer;
