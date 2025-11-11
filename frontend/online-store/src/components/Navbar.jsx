import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCartShopping } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(
    JSON.parse(localStorage.getItem("loggedInUser"))
  );

  // ✅ Keep login state synced between tabs or refreshes
  useEffect(() => {
    const handleStorageChange = () => {
      setLoggedInUser(JSON.parse(localStorage.getItem("loggedInUser")));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Refresh check when Navbar mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) setLoggedInUser(user);
  }, []);

  // ✅ Handle Profile icon click correctly
  const handleProfileClick = () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) navigate("/account/profile");
    else navigate("/auth");
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="logo">
            TechZone
          </Link>
        </div>

        <div className="navbar-center">
          <input
            type="text"
            placeholder="Search for products..."
            className="search-input"
          />
          <button className="search-button">Search</button>
        </div>

        <div className="navbar-right">
          {/* 👤 Profile icon */}
          <span
            className="nav-link"
            aria-label="Login"
            onClick={handleProfileClick}
          >
            <span className="nav-icon">
              <FontAwesomeIcon icon={faUser} />
            </span>
          </span>

          {/* 🛒 Cart icon */}
          <Link to="/cart" className="nav-link" aria-label="Cart">
            <span className="nav-icon">
              <FontAwesomeIcon icon={faCartShopping} />
            </span>
          </Link>
        </div>
      </nav>

      <div className="category-bar">
        <ul className="categories">
          <li className="category-item">
            <Link to="/products">All Products</Link>
          </li>
          <li className="category-item">
            <span>Phones</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=smartphones">Smartphones</Link>
              </li>
              <li>
                <Link to="/products?category=cases">Cases & Accessories</Link>
              </li>
              <li>
                <Link to="/products?category=chargers">Chargers</Link>
              </li>
            </ul>
          </li>
          <li className="category-item">
            <span>Computers</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=laptops">Laptops</Link>
              </li>
              <li>
                <Link to="/products?category=desktops">Desktops</Link>
              </li>
              <li>
                <Link to="/products?category=monitors">Monitors</Link>
              </li>
            </ul>
          </li>
          <li className="category-item">
            <span>Accessories</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=headphones">Headphones</Link>
              </li>
              <li>
                <Link to="/products?category=keyboards">Keyboards</Link>
              </li>
              <li>
                <Link to="/products?category=mice">Mice</Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
