import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const Products = () => {
  const { category } = useParams(); // e.g., "tops", "bottoms", etc.

  return (
    <>
      <Navbar />

      {/* Full-height section centered below navbar */}
      <div className="flex flex-col items-center justify-center text-center min-h-screen bg-white text-gray-800 pt-48 px-6">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">
          {category
            ? `Our ${category.charAt(0).toUpperCase() + category.slice(1)}`
            : "Our Products"}
        </h1>
        <p className="text-gray-700 text-lg max-w-xl">
          {category
            ? `Showing placeholder content for ${category}.`
            : "Explore our collection of amazing items!"}
        </p>
      </div>
    </>
  );
};

export default Products;
