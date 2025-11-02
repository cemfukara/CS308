import React, { useState } from 'react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff',
      }}
    >
      <div
        style={{
          width: '400px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px',
        }}
      >
        {/* tabs */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            border: '1px solid #ccc',
            borderRadius: '4px 4px 0 0',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '8px 0',
              background: activeTab === 'login' ? '#d2d2d2' : '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '8px 0',
              background: activeTab === 'register' ? '#d2d2d2' : '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>

        {/* form */}
        <div
          style={{
            border: '1px solid #ccc',
            borderTop: 'none',
            padding: '10px',
          }}
        >
          {activeTab === 'login' ? (
            <form>
              <label>Email</label>
              <input
                type="email"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
                placeholder="example@email.com"
              />
              <label style={{ marginTop: '8px', display: 'block' }}>Password</label>
              <input
                type="password"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '6px',
                }}
              >
                Log In
              </button>
              <div style={{ textAlign: 'right', fontSize: '12px', marginTop: '6px' }}>
                <a href="#">Forgot password?</a>
              </div>
            </form>
          ) : (
            <form>
              <label>Full Name</label>
              <input
                type="text"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
              />
              <label>Phone Number</label>
              <input
                type="text"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
              />
              <label>Gender</label>
              <select style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}>
                <option value="">Select</option>
                <option value="f">Female</option>
                <option value="m">Male</option>
              </select>
              <label>Email</label>
              <input
                type="email"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
              />
              <label>Password</label>
              <input
                type="password"
                style={{ width: '100%', border: '1px solid #000', marginTop: '4px' }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '6px',
                }}
              >
                Create Account
              </button>
            </form>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '13px',
          }}
        >
          By continuing, you agree to our <a href="/terms">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}
