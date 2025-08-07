import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Scale, Globe, Users, Heart } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';
import TwoColumnSection from '../components/ui/TwoColumnSection';

const AboutPage: React.FC = () => {
  return (
    <>
      <Hero 
        title="Who We Are"
        subtitle="Our mission is to create a secure, efficient, and scalable outsourcing ecosystem for every business—small or large."
        primaryCTA={{ text: "Our Services", link: "/services" }}
        secondaryCTA={{ text: "Contact Us", link: "/contact" }}
        backgroundImage="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Mission & Vision Section */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-secondary-600 mb-6">
                To create a secure, efficient, and scalable outsourcing ecosystem for every business—small or large. We believe in transparent partnerships that drive growth through global collaboration.
              </p>
              <p className="text-lg text-secondary-600">
                We're committed to solving the inherent challenges in outsourcing by providing verified vendors, secure contracts, and personalized matching services that truly align with your business needs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-secondary-600 mb-6">
                To be the Platform of Record (PoR) for verified B2B outsourcing globally. We envision a world where businesses can confidently extend their capabilities through outsourcing without the traditional risks and uncertainties.
              </p>
              <p className="text-lg text-secondary-600">
                By 2030, we aim to connect over 100,000 businesses with quality outsourcing partners, creating a positive economic impact across the global workforce.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="Our Values"
            subtitle="The core principles that guide everything we do at Collabov"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6" />}
              title="Transparency"
              description="We believe in complete openness in all our operations, from vendor verification to pricing structures."
              delay={0}
            />
            <FeatureCard 
              icon={<Scale className="h-6 w-6" />}
              title="Accountability"
              description="We hold ourselves and our partners to the highest standards of reliability and responsibility."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6" />}
              title="Global Access"
              description="We're committed to breaking down geographical barriers to connect talent with opportunity."
              delay={0.4}
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6" />}
              title="Collaboration"
              description="We foster meaningful partnerships that create mutual value and sustainable growth."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Heart className="h-6 w-6" />}
              title="Customer Centricity"
              description="Every decision we make is driven by the needs and success of our customers and partners."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <TwoColumnSection
        title="Our Story"
        description="Collabov was founded in 2023 by a team of entrepreneurs who experienced firsthand the challenges of outsourcing. After navigating the complex landscape of finding reliable partners, managing remote teams, and dealing with the uncertainties of cross-border collaborations, they decided to create a solution."
        image="https://images.pexels.com/photos/3183172/pexels-photo-3183172.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        imageAlt="Collabov founding team"
      >
        <p className="mb-6 text-secondary-600">
          Starting with a small network of verified vendors in Eastern Europe, Collabov quickly expanded to include partners across Asia, Latin America, and Africa. Today, we're proud to connect businesses around the world with exceptional talent, regardless of geographic boundaries.
        </p>
        <p className="text-secondary-600">
          Our journey continues as we refine our platform, expand our vendor network, and develop innovative tools like our AI-powered matching system to make B2B outsourcing more accessible, secure, and successful for businesses of all sizes.
        </p>
      </TwoColumnSection>

      {/* Our Team Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="Our Team"
            subtitle="Meet the people driving the Collabov mission forward"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team member cards would go here */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-secondary-200 h-64 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold">Alex Robertson</h3>
              <p className="text-primary-600 mb-2">CEO & Co-founder</p>
              <p className="text-secondary-600">
                Former outsourcing consultant with 15+ years of experience in global team management.
              </p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="bg-secondary-200 h-64 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold">Maria Chen</h3>
              <p className="text-primary-600 mb-2">CTO & Co-founder</p>
              <p className="text-secondary-600">
                Tech leader with expertise in building secure, scalable platforms for global enterprises.
              </p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="bg-secondary-200 h-64 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold">Daniel Kowalski</h3>
              <p className="text-primary-600 mb-2">Head of Vendor Relations</p>
              <p className="text-secondary-600">
                Specializes in vendor vetting and relationship building across diverse global markets.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Join Our Mission"
        description="Whether you're looking to expand your team or offer your services, be part of the future of global B2B outsourcing."
        buttonText="Get Started"
        buttonLink="/contact"
      />
    </>
  );
};

export default AboutPage;