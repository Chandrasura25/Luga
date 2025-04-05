import { useState } from 'react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqItems = [
    {
      question: 'What is Luga AI?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      question: 'How does Luga work?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      question: 'What features does Luga AI offer?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      question: 'Is my data safe with Luga AI?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      question: 'Can Luga AI integrate with other apps?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      question: 'Upload Your Text?',
      answer: 'Please make sure your text does not exceed your allowed tier. Also, ensure your text is readable and not a scanned document.'
    },
    {
      question: 'Clone Your Voice?',
      answer: 'Please upload a well-recorded audio file that is between 1 and 5 minutes long.'
    }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-32 bg-gradient-to-b from-purple-50 via-purple-50/50 to-transparent">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-medium mb-4">
            FAQ
          </h2>
          <p className="text-2xl font-medium text-gray-900">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-purple-50/30 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-8 py-6 text-left flex items-center hover:bg-purple-50/50"
              >
                <span className="text-2xl text-gray-400 mr-6">
                  {openIndex === index ? '×' : '+'}
                </span>
                <span className="text-xl font-semibold">{item.question}</span>
              </button>
              {openIndex === index && (
                <div className="px-8 pb-6 pl-16 text-left text-gray-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;