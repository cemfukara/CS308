import React from 'react';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import './Home.css'; // optional if you have custom styles

function Home() {
  return (
    <div className="home">
      {/* Banner Section */}
      <HeroSlider />

      {/* Start Shopping Button */}
      <div className="text-center my-10">
        <Link
          to="/products"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>

      {/* Featured Product Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Featured Product</h2>

        <div className="flex justify-center">
          <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition w-80 text-center bg-white">
            <img
              src="/src/assets/WM1.jpg" // change to any real image from your products
              alt="Wireless Headphones"
              className="w-full h-52 object-cover rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">Wireless Headphones</h3>
            <p className="text-gray-600 mb-3">
              High-quality sound with Bluetooth 5.0 and noise cancellation.
            </p>
            <p className="text-blue-600 font-bold text-lg mb-4">$79.99</p>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              View Product
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
