import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';

const ContactPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    alert('Your message has been sent! We will get back to you soon.');
  };

  return (
    <>
      <Hero 
        title="Contact Us"
        subtitle="Have questions about our platform or need guidance with your outsourcing strategy? We're here to help."
        primaryCTA={{ text: "", link: "" }}
        backgroundImage="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Contact Form Section */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionTitle 
                title="Get In Touch"
                subtitle="Fill out the form and our team will get back to you within 24 hours"
              />
              
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-secondary-700 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    id="company" 
                    className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-1">Subject</label>
                  <select 
                    id="subject" 
                    className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="vendor">Become a Vendor</option>
                    <option value="client">Find a Vendor</option>
                    <option value="support">Technical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-1">Message</label>
                  <textarea 
                    id="message" 
                    rows={5} 
                    className="w-full px-4 py-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="btn-primary inline-flex items-center">
                  Send Message <Send className="ml-2 h-4 w-4" />
                </button>
              </form>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionTitle 
                title="Contact Information"
                subtitle="Reach out directly or connect with us on social media"
              />
              
              <div className="mt-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Email</h3>
                    <p className="text-secondary-600 mb-1">For general inquiries:</p>
                    <a href="mailto:hello@collabov.com" className="text-primary-600 hover:text-primary-700 transition-colors">
                      hello@collabov.com
                    </a>
                    <p className="text-secondary-600 mt-2 mb-1">For support:</p>
                    <a href="mailto:support@collabov.com" className="text-primary-600 hover:text-primary-700 transition-colors">
                      support@collabov.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Phone</h3>
                    <p className="text-secondary-600 mb-1">Main Office:</p>
                    <a href="tel:+441234567890" className="text-primary-600 hover:text-primary-700 transition-colors">
                      +44 (0) 123 456 7890
                    </a>
                    <p className="text-secondary-600 mt-2 mb-1">Support Hotline:</p>
                    <a href="tel:+441234567891" className="text-primary-600 hover:text-primary-700 transition-colors">
                      +44 (0) 123 456 7891
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Location</h3>
                    <p className="text-secondary-600 mb-1">Headquarters:</p>
                    <p>123 Tech Hub Street<br />London, EC2A 4NS<br />United Kingdom</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-secondary-200">
                  <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="Facebook">
                      <Facebook size={20} />
                    </a>
                    <a href="#" className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="Twitter">
                      <Twitter size={20} />
                    </a>
                    <a href="#" className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="LinkedIn">
                      <Linkedin size={20} />
                    </a>
                    <a href="#" className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors" aria-label="Instagram">
                      <Instagram size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section bg-secondary-50 pb-0">
        <div className="container text-center mb-12">
          <SectionTitle 
            title="Our Location"
            subtitle="Visit our office or contact us online"
            centered={true}
          />
        </div>
        
        <div className="h-96 w-full bg-secondary-200 flex items-center justify-center">
          <p className="text-secondary-600">Interactive map would be embedded here</p>
        </div>
      </section>
    </>
  );
};

export default ContactPage;