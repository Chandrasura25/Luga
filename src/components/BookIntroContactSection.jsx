import React from 'react';

const BookIntroSection = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <>
    <div className="mt-0.5 relative">
      {/* Background Image Container */}
      <div className="relative w-full h-[800px] rounded-3xl overflow-hidden">
        <img
          src="/bookintro.avif"
          alt="Arabic landscape"
          className="w-full h-full object-cover"
        />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-6">
          {/* Left side - Title */}
          <div className="mb-10 pl-4">
            <h2 className="text-5xl font-medium text-white max-w-2xl leading-tight text-left">
            Multilingual Multimodal Generative AI Solutions <br />
            for Content Creators and Cross-border Sellers
            </h2>
          </div>

          {/* Right side - Form */}
          <div className="w-[400px]">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-left mb-8">Contact us</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2 text-left">Name</label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    className="w-full p-3 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 text-left">Email</label>
                  <input
                    type="email"
                    placeholder="jane@framer.com"
                    className="w-full p-3 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2 text-left">Message</label>
                  <textarea
                    placeholder="Leave your message here"
                    rows={4}
                    className="w-full p-3 rounded-lg bg-gray-50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mt-4"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Contact Us Section */}
    <div className="py-20 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <button className="px-4 py-2 text-sm bg-black text-white rounded-lg">
            Contact us
          </button>
        </div>
        
        <h2 className="text-4xl font-medium text-center mb-16">
          See why leading Arabic businesses<br />
          choose Luga AI
        </h2>

        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-[0_0_50px_0_rgba(167,139,250,0.28)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2 text-left">Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full p-3 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2 text-left">Email</label>
                <input
                  type="email"
                  placeholder="jane@framer.com"
                  className="w-full p-3 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2 text-left">Message</label>
                <textarea
                  placeholder="Leave your message here"
                  rows={4}
                  className="w-full p-3 rounded-lg bg-gray-50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mt-4"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookIntroSection;