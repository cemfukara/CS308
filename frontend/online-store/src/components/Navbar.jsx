import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineShoppingCart, AiOutlineUser } from "react-icons/ai";
import "./Navbar.css";

const Navbar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleMouseEnter = (category) => {
    setActiveDropdown(category);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="navbar">
      {/* Top Navbar */}
      <div className="navbar-top">
        <div className="navbar-logo">
          <Link to="/">TechZone</Link>
        </div>

        <div className="navbar-search">
          <input type="text" placeholder="Search for products..." />
          <button>Search</button>
        </div>

        <div className="navbar-icons">
          <Link to="/auth" className="icon">
            <AiOutlineUser />
          </Link>
          <Link to="/cart" className="icon">
            <AiOutlineShoppingCart />
          </Link>
        </div>
      </div>

      {/* Category Bar */}
      <div className="navbar-categories">
        {/* Laptops */}
        <div
          className="category"
          onMouseEnter={() => handleMouseEnter("laptops")}
          onMouseLeave={handleMouseLeave}
        >
          Laptops
          {activeDropdown === "laptops" && (
            <div className="dropdown">
              <Link to="/category/laptops/gaming" className="dropdown-item">
                Gaming Laptops
              </Link>
              <Link to="/category/laptops/ultrabook" className="dropdown-item">
                Ultrabooks
              </Link>
              <Link to="/category/laptops/business" className="dropdown-item">
                Business Laptops
              </Link>
            </div>
          )}
        </div>

        {/* Phones */}
        <div
          className="category"
          onMouseEnter={() => handleMouseEnter("phones")}
          onMouseLeave={handleMouseLeave}
        >
          Phones
          {activeDropdown === "phones" && (
            <div className="dropdown">
              <Link to="/category/phones/android" className="dropdown-item">
                Android Phones
              </Link>
              <Link to="/category/phones/iphone" className="dropdown-item">
                iPhones
              </Link>
              <Link to="/category/phones/accessories" className="dropdown-item">
                Phone Accessories
              </Link>
            </div>
          )}
        </div>

        {/* TVs */}
        <div
          className="category"
          onMouseEnter={() => handleMouseEnter("tvs")}
          onMouseLeave={handleMouseLeave}
        >
          TVs
          {activeDropdown === "tvs" && (
            <div className="dropdown">
              <Link to="/category/tvs/smart" className="dropdown-item">
                Smart TVs
              </Link>
              <Link to="/category/tvs/4k" className="dropdown-item">
                4K TVs
              </Link>
              <Link to="/category/tvs/oled" className="dropdown-item">
                OLED TVs
              </Link>
            </div>
          )}
        </div>

        {/* Computer Parts */}
        <div
          className="category"
          onMouseEnter={() => handleMouseEnter("parts")}
          onMouseLeave={handleMouseLeave}
        >
          Computer Parts
          {activeDropdown === "parts" && (
            <div className="dropdown">
              <Link to="/category/parts/cpu" className="dropdown-item">
                CPUs
              </Link>
              <Link to="/category/parts/gpu" className="dropdown-item">
                Graphics Cards
              </Link>
              <Link to="/category/parts/motherboards" className="dropdown-item">
                Motherboards
              </Link>
            </div>
          )}
        </div>

        {/* Accessories */}
        <div
          className="category"
          onMouseEnter={() => handleMouseEnter("accessories")}
          onMouseLeave={handleMouseLeave}
        >
          Accessories
          {activeDropdown === "accessories" && (
            <div className="dropdown">
              <Link to="/category/accessories/mouse" className="dropdown-item">
                Mouse
              </Link>
              <Link to="/category/accessories/keyboard" className="dropdown-item">
                Keyboard
              </Link>
              <Link to="/category/accessories/headphones" className="dropdown-item">
                Headphones
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
