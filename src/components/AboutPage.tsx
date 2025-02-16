import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  const navigateToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure the homepage has loaded
  };

  const team = [
    {
      name: "Hamid Rezaee",
      role: "CTO",
      description: "Originally from Afghanistan, Hamid is studying Information Science and Entrepreneurship as a junior at Cornell University, specializing in machine learning and generative AI applications.",
      imageUrl: "/hamid.avif"
    },
    {
      name: "Zhuorui Fu",
      role: "Co Founder",
      description: "Zhuorui Fu, CEO, serial entrepreneur in the Middle East, MENA study for 7 years, UPenn grad.",
      imageUrl: "/zhuorui.avif"
    },
    {
      name: "Gulidalai Aimin",
      role: "BD Lead",
      description: "Seasoned BD expert, ex-WeSDG leader, Beijing International Studies University grad.",
      imageUrl: "/gulidalai.avif"
    },
    {
      name: "Ruisi Huang",
      role: "Full Stack Engineer",
      description: "Ruisi Huang, Full-stack engineer, MENA enthusiast, Hubei University of Economics grad",
      imageUrl: "/ruisi.avif"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-medium">لغة Luga</Link>
        </div>
        
        <div className="flex items-center space-x-12">
          <button 
            onClick={() => navigateToSection('features')}
            className="text-base hover:text-gray-600 transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => navigateToSection('how-it-works')}
            className="text-base hover:text-gray-600 transition-colors"
          >
            Roadmap
          </button>
          <button 
            onClick={() => navigateToSection('pricing')}
            className="text-base hover:text-gray-600 transition-colors"
          >
            Pricing
          </button>
          <Link to="/about" className="text-base text-black font-medium">About</Link>
          <button 
            onClick={() => navigateToSection('book-intro')}
            className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
          >
            Book an intro
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mt-20 px-4 text-center">
        <h1 className="text-5xl font-semibold mb-6">
          We research multimodal models for Arabic users
        </h1>
        <p className="text-lg text-gray-600 mb-16">
          "The mission of Luga AI is bringing the newest technologies in the AI Industry to the Middle East, something I believe to be extremely important." - Hamid, CTO
        </p>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {team.map((member, index) => (
            <div key={index} className="flex flex-col items-start">
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-full h-96 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-1">{member.name} - {member.role}</h3>
              <p className="text-gray-600 text-left">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;