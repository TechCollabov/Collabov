import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VendorSearch: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const examplePrompts = [
    "I need a React development team with e-commerce experience",
    "Looking for UI/UX designers who specialize in SaaS products",
    "Need Python developers with machine learning expertise",
    "Seeking QA engineers with automated testing experience"
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSearching(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsSearching(false);
      navigate(`/search?q=${encodeURIComponent(prompt)}`);
    }, 1500);
  };

  return (
    <section className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Find the Perfect Vendor with AI
          </motion.h2>
          <motion.p 
            className="text-lg text-primary-100 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Describe your project needs in natural language, and our AI will match you with the most suitable vendors
          </motion.p>

          <motion.form 
            onSubmit={handleSearch}
            className="relative mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., I need a React development team with e-commerce experience"
                className="w-full px-6 py-4 rounded-lg pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader className="h-6 w-6 animate-spin" />
                ) : (
                  <Search className="h-6 w-6" />
                )}
              </button>
            </div>
          </motion.form>

          <motion.div
            className="text-primary-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-sm mb-4">Try these examples:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-sm bg-primary-800 hover:bg-primary-700 text-primary-100 px-4 py-2 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VendorSearch;