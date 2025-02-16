import React from 'react';

const FooterSection = () => {
  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle subscription
  };

  return (
    <footer className="max-w-7xl mx-auto px-8 py-20">
      

      {/* Footer Bottom */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <p className="text-gray-600">
          Luga AI. All right reserved. © 2024
        </p>
        <div className="flex gap-6">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <img 
              src="/twitter.png" 
              alt="Twitter" 
              className="w-5 h-5 opacity-50 hover:opacity-75 transition-opacity"
            />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <img 
              src="/facebook.png" 
              alt="Facebook" 
              className="w-5 h-5 opacity-50 hover:opacity-75 transition-opacity"
            />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img 
              src="/youtube.png" 
              alt="YouTube" 
              className="w-5 h-5 opacity-50 hover:opacity-75 transition-opacity"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;