import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MonitorSmartphone, ShoppingCart, HeartPulse, 
  Building2, Home, AreaChart, Truck, Scale
} from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import CTA from '../components/ui/CTA';
import TwoColumnSection from '../components/ui/TwoColumnSection';

const IndustriesPage: React.FC = () => {
  const industries = [
    {
      icon: <MonitorSmartphone className="h-6 w-6" />,
      title: 'SaaS',
      description: 'Development, maintenance, and customer support for software-as-a-service businesses.',
      image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: 'E-commerce',
      description: 'Store development, product management, and customer experience optimization.',
      image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <HeartPulse className="h-6 w-6" />,
      title: 'Healthcare',
      description: 'Administrative services, telehealth support, and data management solutions.',
      image: 'https://images.pexels.com/photos/263337/pexels-photo-263337.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Finance',
      description: 'Back-office operations, data analysis, and customer service for financial institutions.',
      image: 'https://images.pexels.com/photos/210607/pexels-photo-210607.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <Home className="h-6 w-6" />,
      title: 'Real Estate',
      description: 'Virtual tours, property management systems, and marketing support.',
      image: 'https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <AreaChart className="h-6 w-6" />,
      title: 'Marketing',
      description: 'Content creation, social media management, and campaign execution.',
      image: 'https://images.pexels.com/photos/905163/pexels-photo-905163.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Logistics',
      description: 'Route optimization, inventory management, and customer tracking systems.',
      image: 'https://images.pexels.com/photos/2226458/pexels-photo-2226458.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      icon: <Scale className="h-6 w-6" />,
      title: 'Legal & Compliance',
      description: 'Document processing, legal research, and compliance monitoring services.',
      image: 'https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    }
  ];

  return (
    <>
      <Hero 
        title="Industries We Serve"
        subtitle="Specialized outsourcing solutions for diverse business sectors"
        primaryCTA={{ text: "Find Your Solution", link: "/contact" }}
        backgroundImage="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Industries Grid Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Tailored Solutions for Every Industry"
            subtitle="We provide specialized outsourcing services designed for the unique needs of your business sector"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {industries.map((industry, index) => (
              <motion.div 
                key={industry.title}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-5">
                  {industry.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{industry.title}</h3>
                <p className="text-secondary-600 mb-4">{industry.description}</p>
                <Link to="/services" className="text-primary-600 font-medium hover:text-primary-700 transition-colors inline-flex items-center">
                  Learn more
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Industry Focus Matters */}
      <TwoColumnSection
        title="Why Industry Focus Matters"
        description="Generic outsourcing solutions rarely deliver optimal results. Our industry-specific approach ensures you receive services tailored to your unique business context and challenges."
        image="https://images.pexels.com/photos/3183132/pexels-photo-3183132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        imageAlt="Team working on industry-specific solutions"
      >
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Domain Expertise</h4>
              <p className="text-secondary-600">Our vendors have deep knowledge of your industry's specific processes, regulations, and best practices.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Faster Implementation</h4>
              <p className="text-secondary-600">Industry-focused teams require less training and onboarding, accelerating your time to value.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Higher Quality Results</h4>
              <p className="text-secondary-600">Teams with industry experience deliver more accurate, compliant, and valuable outputs.</p>
            </div>
          </div>
        </div>
        <Link to="/contact" className="btn-primary">
          Get Industry-Specific Solutions
        </Link>
      </TwoColumnSection>

      {/* Case Studies Section (preview) */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="Success Stories"
            subtitle="See how businesses in your industry have transformed with Collabov's outsourcing solutions"
            centered={true}
          />
          
          {/* Sample case study preview */}
          <div className="max-w-4xl mx-auto mt-12">
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <img 
                    className="h-48 w-full object-cover md:h-full md:w-48" 
                    src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="SaaS company team" 
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center">
                    <MonitorSmartphone className="h-5 w-5 text-primary-600" />
                    <span className="ml-2 text-sm font-medium text-primary-600">SaaS</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-secondary-900">
                    How CloudSync Reduced Development Costs by 40%
                  </h3>
                  <p className="mt-3 text-secondary-600">
                    CloudSync, a data synchronization platform, partnered with Collabov to build a dedicated development team in Eastern Europe, resulting in faster releases and significant cost savings.
                  </p>
                  <div className="mt-6">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-secondary-900">Results:</p>
                        <ul className="mt-1 text-secondary-600 space-y-1">
                          <li>• 40% reduction in development costs</li>
                          <li>• 2x faster feature deployment</li>
                          <li>• Scaled team from 3 to 15 engineers in 8 months</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="text-center mt-10">
              <Link to="/contact" className="btn-primary">
                See More Success Stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Find Industry-Specific Outsourcing Solutions"
        description="Connect with vendors who understand the unique challenges and opportunities in your sector."
        buttonText="Get Started"
        buttonLink="/contact"
      />
    </>
  );
};

export default IndustriesPage;