import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, FileText, Bot, UserSearch, LockKeyhole } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';

const AiCalculatorPage: React.FC = () => {
  return (
    <>
      <Hero 
        title="AI Outsourcing Calculator"
        subtitle="Coming Soon: Discover what to outsource – instantly with our AI-powered decision engine"
        primaryCTA={{ text: "Join Waitlist", link: "/contact" }}
        backgroundImage="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Coming Soon Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Discover What to Outsource – Instantly"
            subtitle="Our AI calculator will analyze your business and recommend the most effective outsourcing strategy based on your specific needs, budget, and goals."
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <FeatureCard 
              icon={<BrainCircuit className="h-6 w-6" />}
              title="AI-Powered Analysis"
              description="Advanced algorithms analyze your business needs and market conditions to provide tailored recommendations."
              delay={0}
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6" />}
              title="PDF Report Generation"
              description="Receive a comprehensive report with detailed outsourcing recommendations and cost projections."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Bot className="h-6 w-6" />}
              title="Smart Chatbot"
              description="Interactive chatbot helps refine your requirements and answers questions about the recommendations."
              delay={0.4}
            />
            <FeatureCard 
              icon={<UserSearch className="h-6 w-6" />}
              title="Vendor Matching"
              description="Direct links to matched vendors who meet your specific requirements and budget constraints."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="How It Will Work"
            subtitle="A simple yet powerful process to determine your optimal outsourcing strategy"
            centered={true}
          />
          
          <div className="max-w-3xl mx-auto mt-12">
            <div className="border border-secondary-200 rounded-lg bg-white overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold mb-2">Step 1: Business Assessment</h3>
                <p className="text-secondary-600">
                  Answer a series of smart questions about your business, current operations, and goals.
                </p>
              </div>
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold mb-2">Step 2: AI Analysis</h3>
                <p className="text-secondary-600">
                  Our algorithm processes your inputs against industry benchmarks and outsourcing best practices.
                </p>
              </div>
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold mb-2">Step 3: Recommendation Report</h3>
                <p className="text-secondary-600">
                  Receive a detailed report with actionable outsourcing recommendations, cost projections, and ROI analysis.
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Step 4: Vendor Matching</h3>
                <p className="text-secondary-600">
                  Get connected with pre-vetted vendors that match your specific requirements and business needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="section">
        <div className="container">
          <div className="bg-primary-50 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-4">Join Our Waitlist</h2>
                <p className="text-lg text-secondary-600 mb-6">
                  Be among the first to access our AI Outsourcing Calculator when it launches. Early access members will receive:
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
                      <span className="text-sm font-semibold">1</span>
                    </div>
                    <p>Priority access to the beta version</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
                      <span className="text-sm font-semibold">2</span>
                    </div>
                    <p>Free in-depth consultation with our outsourcing experts</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
                      <span className="text-sm font-semibold">3</span>
                    </div>
                    <p>Exclusive discount on your first outsourcing engagement</p>
                  </li>
                </ul>
                <Link to="/contact" className="btn-primary">
                  Join Waitlist
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Calculator Preview</h3>
                    <LockKeyhole className="h-5 w-5 text-secondary-500" />
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary-700">Business Type</label>
                      <select className="w-full p-2 border border-secondary-300 rounded-md bg-secondary-50 text-secondary-400 cursor-not-allowed" disabled>
                        <option>Select business type...</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary-700">Team Size</label>
                      <select className="w-full p-2 border border-secondary-300 rounded-md bg-secondary-50 text-secondary-400 cursor-not-allowed" disabled>
                        <option>Select team size...</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary-700">Monthly Budget</label>
                      <select className="w-full p-2 border border-secondary-300 rounded-md bg-secondary-50 text-secondary-400 cursor-not-allowed" disabled>
                        <option>Select budget range...</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary-700">Needs Assessment</label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="h-4 w-4 cursor-not-allowed opacity-50" disabled />
                        <span className="text-secondary-400">Development</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="h-4 w-4 cursor-not-allowed opacity-50" disabled />
                        <span className="text-secondary-400">Design</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="h-4 w-4 cursor-not-allowed opacity-50" disabled />
                        <span className="text-secondary-400">Marketing</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full btn bg-secondary-200 text-secondary-400 cursor-not-allowed" disabled>
                    Coming Soon
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Stay Updated on Our AI Calculator Launch"
        description="Join our newsletter to receive updates on the development and launch of our AI Outsourcing Calculator."
        buttonText="Subscribe Now"
        buttonLink="/contact"
      />
    </>
  );
};

export default AiCalculatorPage;