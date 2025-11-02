// src/pages/AboutUs.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-36 text-center">
        <h1 className="text-4xl font-bold text-blue-500 mb-6">About TechZone</h1>
        <p className="max-w-2xl text-gray-700 text-lg leading-relaxed">
          TechZone is your trusted source for the latest in technology. We specialize in laptops,
          smartphones, accessories, and PC components — combining quality, affordability, and
          innovation. Our mission is to help people connect with the tools they need to stay ahead
          in today’s digital world.
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default AboutUs;
