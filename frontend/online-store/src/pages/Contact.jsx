import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="contact-container">
        <h1>Contact Us</h1>
        <p className="contact-intro">
          Have a question, issue, or feedback? Our team is here to help you. Reach out using the
          details below or fill out the quick contact form.
        </p>

        {/* CONTACT INFO SECTION */}
        <div className="contact-info">
          <div className="info-item">
            <h3>Email</h3>
            <p>support@techzone.com</p>
          </div>
          <div className="info-item">
            <h3>Phone</h3>
            <p>+90 555 123 4567</p>
          </div>
          <div className="info-item">
            <h3>Address</h3>
            <p>Istanbul, Türkiye</p>
          </div>
        </div>

        {/* CONTACT FORM SECTION */}
        <form className="contact-form" onSubmit={e => e.preventDefault()}>
          <div className="form-row">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
          </div>
          <textarea placeholder="Write your message here..." rows="5" required></textarea>
          <button type="submit" className="contact-btn">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
