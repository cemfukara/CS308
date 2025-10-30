import React from "react";
import Navbar from "../components/Navbar";

function TermsPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 pt-28 px-6 text-center">
        <h1 className="text-4xl font-bold text-blue-500">Our Terms and Conditions</h1>
      </div>
    </div>
  );
}

export default TermsPolicy;
