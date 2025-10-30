import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 pt-28 px-6 text-center">
        
        {/* Search bar with button */}
        <div className="mb-6 flex w-full max-w-sm">
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition">
            Search
          </button>
        </div>

        {/* Welcome text */}
        <h1 className="text-5xl font-bold text-blue-500 mb-6">
          Welcome to Your Store
        </h1>
        <p className="text-gray-700 mb-6">Find the best items for your style!</p>

        {/* Start shopping button */}
        <Link
          to="/products"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Start Shopping Now
        </Link>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
