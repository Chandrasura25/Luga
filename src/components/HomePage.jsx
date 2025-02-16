import {useState, useEffect} from 'react'
import PricingSection from './PricingSection'; 
import FAQSection from './FAQSection';
import BookIntroContactSection from './BookIntroContactSection';
import Footer from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpeg'
import axios from '../api/axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
        });
      }
    };

  const getUserEmail = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
        return payload.sub; // Assuming email is stored in 'sub' claim
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
    return "";
  };  

  const logOut = async (e) => {
    const token = localStorage.getItem("access_token");
    e.preventDefault();
    try {
      const response = await axios.post("/user/logout", { token });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Logout failed:", errorData.detail);
      } else {
        console.log("Logout successful");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
    localStorage.removeItem("access_token");
    navigate("/login");
  }  

  useEffect(() => {
    setUserEmail(getUserEmail()); // Set email when the component loads
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <img src={logo} alt="Luga Logo" style={{ height: "100px", width: "auto" }} />
        </div>
        {/* <div className="flex items-center">
          <span className="text-xl font-medium">لغة Luga</span>
        </div>
         */}
        <div className="hidden md:flex items-center space-x-12">
        <button 
            onClick={() => scrollToSection('features')} 
            className="text-base hover:text-gray-600 transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="text-base hover:text-gray-600 transition-colors"
          >
            Roadmap
          </button>
          <button 
            onClick={() => scrollToSection('pricing')} 
            className="text-base hover:text-gray-600 transition-colors"
          >
            Pricing
          </button>
          <Link 
            to="/about" 
            className="text-base hover:text-gray-600 transition-colors"
          >
            About
          </Link>
          <button 
            onClick={() => scrollToSection('book-intro')} 
            className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
          >
            Book an intro
          </button>

          <div className="relative">
            <div 
              className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
              onClick={() => {setIsProfileOpen(!isProfileOpen); console.log("drop down");}}
            >
              <span>{userEmail || "Guest"}</span>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {isProfileOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                <div
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={logOut}
                >
                  Log out
                </div>
              </div>
            )}
            </div>
          
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto mt-32 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-medium leading-tight tracking-tight text-gray-900">
            Multilingual multimodal AI agent for cross-border content creation
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Create your text, audio, and video in different languages in one stop!
          </p>

          <div className="mt-10">
                  <Link 
                to="/demo"
                className="px-6 py-3 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
            >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            </svg>
            <span>Try our demo</span>
          </Link>
          </div>
        </div>

        {/* Demo Image Section */}
        <div className="mt-20 relative w-screen max-w-[150rem] -mx-4 px-2">
          <div className="relative">
            {/* Background gradient overlay */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(to bottom, rgba(238, 235, 255, 0.1), rgba(238, 235, 255, 1))',
                transform: 'scale(1.05)',
                filter: 'blur(40px)'
              }}
            />
            
            {/* Image container with reduced padding */}
            <div className="relative p-8">
              <img 
                src="/image_demo_home.avif" 
                alt="Luga AI Demo Interface" 
                className="w-full rounded-3xl shadow-xl relative z-10 max-w-[140rem] mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Supported By Section
        <div className="mt-32 max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-medium text-center mb-12">
            Selected and supported by
          </h2>
          
          <div className="relative overflow-hidden">
            <style jsx>{`
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-scroll {
                animation: scroll 20s linear infinite;
              }
            `}</style>
            <div className="flex animate-scroll whitespace-nowrap">
              {/* First set of logos */}
              {/* <div className="flex items-center space-x-16 mx-8">
                <img src="/api/placeholder/120/32" alt="Company 1" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 2" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 3" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 4" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 5" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 6" className="h-8 bg-gray-200 rounded opacity-50" />
              </div>
              {/* Duplicate set for seamless loop */}
              {/* <div className="flex items-center space-x-16 mx-8">
                <img src="/api/placeholder/120/32" alt="Company 1" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 2" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 3" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 4" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 5" className="h-8 bg-gray-200 rounded opacity-50" />
                <img src="/api/placeholder/120/32" alt="Company 6" className="h-8 bg-gray-200 rounded opacity-50" />
              </div>
            </div>
          </div>
        </div> */} 

        {/* Features Section */}
        <div id="features" className="mt-32 pb-16 bg-gradient-to-b from-purple-50/50">
          <div className="max-w-6xl mx-auto px-4">
            {/* Features Header */}
            <div className="text-center mb-24">
              <span className="inline-block px-4 py-2 bg-purple-100 rounded-full text-lg mb-4">
                Features
              </span>
              <h2 className="text-4xl font-medium mb-4">
                Create localised contents and go to market easily!
              </h2>
              <p className="text-gray-600 text-xl">
                Discover Luga&apos;s cutting-edge features <br /> tailored for multimarket content creators and cross-border sellers.
              </p>
            </div>
            
            {/* "New Idea?" Text
            <div className="mb-6">
              <h3 className="text-3xl font-semibold text-gray-800 text-left">New Idea for script?</h3>
            </div> */}

            {/* 2x2 Grid for First Four Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Feature Card 1 */}
              <div className="bg-white rounded-3xl p-8 text-left">
                <img src="/generate_fluency.avif" alt="" className="w-full max-w-md aspect-[16/9] object-cover rounded-xl mb-6" />
                <h3 className="text-2xl font-medium mb-3">New Idea for script?</h3>
                <p className="text-gray-600">Luga utilises the best large language model to help you generate fluency and ideas for content creation</p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-white rounded-3xl p-8 text-left">
                <img src="/add_voice.avif" alt="" className="w-full max-w-md aspect-[16/9] object-cover rounded-xl mb-6" />
                <h3 className="text-2xl font-medium mb-3">Add A Voice To Your Text</h3>
                <p className="text-gray-600">Clone your voice and use any customised human narratives</p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-white rounded-3xl p-8 text-left">
                <img src="/visual_interface.svg" alt="" className="w-full max-w-md aspect-[16/9] object-cover rounded-xl mb-6" />
                <h3 className="text-2xl font-medium mb-3">Customise Your Visual Interface</h3>
                <p className="text-gray-600">Upload any +1 min video of yours and lipsync in real-time</p>
              </div>

              {/* Feature Card 4 */}
              <div className="bg-white rounded-3xl p-8 text-left">
                <img src="/globe.svg" alt="" className="w-full max-w-md aspect-[16/9] object-cover rounded-xl mb-6" />
                <h3 className="text-2xl font-medium mb-3">Use 24/7 AI Companions and Bots</h3>
                <p className="text-gray-600">Design your own characters and let your AI agent to interact with fans and customers on your behalf</p>
              </div>
            </div>

            
          </div>
        </div>

            {/* How It Works Section */}
      <div id="how-it-works" className="mt-16 pb-16 bg-gradient-to-b from-purple-50">
        <div className="max-w-6xl mx-auto px-4 text-left">
          {/* How It Works Header */}
          <div className="mb-24">
            <span className="inline-block px-4 py-2 bg-purple-100 rounded-full text-sm mb-4">
            Business Clients?
            </span>
            <h2 className="text-4xl font-medium mb-4">
              Integrate Luga to your business<br />
              in 4 simple steps
            </h2>
          </div>

                    {/* How It Works Content */}
          <div className="flex flex-col space-y-20">
            {/* Step 1 */}
            <div className="flex items-start">
              <div className="mr-6">
                <img src="/schedule.png" alt="Schedule icon" className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">1. Schedule A Call</h3>
                <p className="text-gray-600">
                  Unleash your creativity with our VividVisions UI Kit!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start">
              <div className="mr-6">
                <img src="/bus.png" alt="Understanding icon" className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">2. We understand your needs</h3>
                <p className="text-gray-600">
                  With a vibrant and energetic palette of colors
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start">
              <div className="mr-6">
                <img src="/guard.png" alt="Plans icon" className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">3. We propose plans</h3>
                <p className="text-gray-600">
                  Precision meets aesthetics with our PixelPerfect UI Kit.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start">
              <div className="mr-6">
                <img src="/guard.png" alt="Deliverables icon" className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">4. You receive our deliverables</h3>
                <p className="text-gray-600">
                  Implementation and integration of your customized Luga AI solution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div id="pricing">
          <PricingSection />
        </div>
        <FAQSection />
        <div id="book-intro">
          <BookIntroContactSection />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default HomePage;