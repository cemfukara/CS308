import React, { useState } from "react";
import { FaBars, FaShoppingCart, FaUser, FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: menu icon */}
        <button onClick={toggleMenu} className="text-2xl md:hidden">
          <FaBars />
        </button>

        {/* Center-left: Logo */}
        <h1 className="text-3xl font-bold text-blue-500 ml-4 md:ml-0">
          Your Store
        </h1>

        {/* Right: Home, Cart, Login */}
        <div className="flex items-center space-x-6" style={{ marginRight: "40px" }}>
          <Link to="/">
            <FaHome className="hover:text-blue-600 transition text-2xl" />
          </Link>
          <Link to="/cart">
            <FaShoppingCart className="text-2xl" />
          </Link>
          <Link to="/login">
            <FaUser className="text-2xl" />
          </Link>
        </div>
      </div>

      {/* Mobile sliding menu */}
      {menuOpen && (
        <div className="bg-gray-100 w-64 p-6 space-y-4 shadow-lg md:hidden">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/products/tops" onClick={toggleMenu}>
                Tops
              </Link>
            </li>
            <li>
              <Link to="/products/bottoms" onClick={toggleMenu}>
                Bottoms
              </Link>
            </li>
            <li>
              <Link to="/products/accessories" onClick={toggleMenu}>
                Accessories
              </Link>
            </li>
            <li>
              <Link to="/products/new" onClick={toggleMenu}>
                New In
              </Link>
            </li>
            <li>
              <Link to="/products/popular" onClick={toggleMenu}>
                Popular
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Navbar;

