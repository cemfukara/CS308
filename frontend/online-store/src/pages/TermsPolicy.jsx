import React from 'react';
import './TermsPolicy.css';

const TermsPolicy = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>Terms & Privacy Policy</h1>

        <section className="terms-section">
          <h3>1. Introduction</h3>
          <p>
            Welcome to TechZone. By accessing our website, you agree to the terms and conditions
            outlined below. Please read them carefully before making any purchases or using our
            services.
          </p>
        </section>

        <section className="terms-section">
          <h3>2. Data Privacy</h3>
          <p>
            We value your privacy. Personal information such as name, email, and payment details are
            securely encrypted and used only to complete transactions and improve your experience.
          </p>
        </section>

        <section className="terms-section">
          <h3>3. Returns & Refunds</h3>
          <p>
            Products may be returned within 14 days of delivery if they are unused and in original
            packaging. Refunds will be processed within 5–7 business days once the returned item is
            received.
          </p>
        </section>

        <section className="terms-section">
          <h3>4. User Conduct</h3>
          <p>
            Users must not misuse our platform or attempt unauthorized access to other accounts or
            systems. Any such behavior may result in account suspension.
          </p>
        </section>

        <section className="terms-section">
          <h3>5. Updates</h3>
          <p>
            TechZone reserves the right to update these policies at any time. We encourage users to
            review this page periodically for any changes.
          </p>
        </section>

        <p className="terms-footer">
          For any questions regarding our policies, please contact us at{' '}
          <strong>support@techzone.com</strong>.
        </p>
      </div>
    </div>
  );
};

export default TermsPolicy;
