import React from 'react';

function Sidebar({ categories, closeSidebar }) {
  return (
    <div className="p-4">
      <button 
        className="text-xl mb-4"
        onClick={closeSidebar}
      >
        &times;
      </button>
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      <ul>
        {categories.map((cat) => (
          <li key={cat} className="mb-2 hover:text-blue-500 cursor-pointer">
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
