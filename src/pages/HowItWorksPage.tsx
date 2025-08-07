import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserSearch, Users, ClipboardCheck, BarChart3, ShieldCheck, CalendarClock } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';
import TwoColumnSection from '../components/ui/TwoColumnSection';

const HowItWorksPage: React.FC = () => {
  return (
    <>
      <Hero 
        title="How It Works"
        subtitle="Our streamlined process makes finding and working with the perfect outsourcing partner simple and secure"
        primaryCTA={{ text: "Get Started", link: "/contact" }}
        backgroundImage="https://images.pexels.com/photos/3183186/pexels-photo-3183186.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Process Overview Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="The Collabov Process"
            subtitle="A simple, four-step approach to finding and working with your ideal outsourcing partner"
            centered={true}
          />
          
          <div className="relative mt-20">
            {/* Connect line between steps (desktop only) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-primary-100 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div 
                className="relative z-10 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white p-2 rounded-full mb-6 shadow-md">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <UserSearch className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Submit Requirements</h3>
                <p className="text-secondary-600">
                  Tell us about your project needs, budget constraints, and preferred vendor qualities.
                </p>
              </motion.div>
              
              <motion.div 
                className="relative z-10 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white p-2 rounded-full mb-6 shadow-md">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <Users className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Review Vendors</h3>
                <p className="text-secondary-600">
                  Compare matched vendors' profiles, previous work, client reviews, and pricing structures.
                </p>
              </motion.div>
              
              <motion.div 
                className="relative z-10 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="bg-white p-2 rounded-full mb-6 shadow-md">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <ClipboardCheck className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Secure Agreement</h3>
                <p className="text-secondary-600">
                  Finalize terms, sign legally-binding contracts, and set up secure payment escrow.
                </p>
              </motion.div>
              
              <motion.div 
                className="relative z-10 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="bg-white p-2 rounded-full mb-6 shadow-md">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <BarChart3 className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">4. Manage & Track</h3>
                <p className="text-secondary-600">
                  Monitor progress, communicate with your team, and release payments as milestones are completed.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Finding the Right Match Section */}
      <TwoColumnSection
        title="Finding Your Perfect Match"
        description="Our AI-powered matching system considers over 50 different factors to connect you with the most suitable vendors for your specific project needs."
        image="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        imageAlt="Team working on project match"
      >
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-4">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="text-sm font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-semibold">Technical Requirements</h4>
              <p className="text-secondary-600">We match based on technical skills, expertise level, and previous project experience.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="text-sm font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-semibold">Budget Alignment</h4>
              <p className="text-secondary-600">We consider your budget constraints and match with vendors offering appropriate pricing models.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="text-sm font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-semibold">Cultural Fit</h4>
              <p className="text-secondary-600">We evaluate communication style, working hours, and business values for optimal collaboration.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-1">
              <span className="text-sm font-semibold">4</span>
            </div>
            <div>
              <h4 className="font-semibold">Availability & Capacity</h4>
              <p className="text-secondary-600">We only match you with vendors who have the bandwidth to take on your project immediately.</p>
            </div>
          </div>
        </div>
        <Link to="/contact" className="btn-primary">
          Start Matching Process
        </Link>
      </TwoColumnSection>

      {/* Our Platform Features */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="Platform Features"
            subtitle="Our purpose-built platform provides all the tools you need for successful outsourcing projects"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Secure Contracts"
              description="Use our legally-vetted contract templates or upload your own. All agreements are digitally signed and stored securely."
              delay={0}
            />
            <FeatureCard 
              icon={<Wallet className="h-6 w-6" />}
              title="Payment Protection"
              description="Our escrow system holds funds until work is approved, protecting both parties and ensuring quality delivery."
              delay={0.2}
            />
            <FeatureCard 
              icon={<CalendarClock className="h-6 w-6" />}
              title="Project Tracking"
              description="Monitor milestones, deadlines, and deliverables in real-time through our interactive dashboard."
              delay={0.4}
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6" />}
              title="Team Management"
              description="Add team members, assign roles, and manage access permissions for collaborative projects."
              delay={0.2}
            />
            <FeatureCard 
              icon={<ClipboardCheck className="h-6 w-6" />}
              title="Quality Assurance"
              description="Built-in review processes and feedback mechanisms to ensure deliverables meet expectations."
              delay={0.4}
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6" />}
              title="Performance Analytics"
              description="Track project metrics, team productivity, and budget utilization with detailed reporting."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Frequently Asked Questions"
            subtitle="Common questions about our outsourcing process and platform"
            centered={true}
          />
          
          <div className="max-w-3xl mx-auto mt-12">
            <div className="space-y-6">
              <motion.div 
                className="border border-secondary-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-2">How long does the vendor matching process take?</h3>
                  <p className="text-secondary-600">
                    Typically, you'll receive your first vendor recommendations within 48 hours after submitting your requirements. For more specialized projects, it may take up to 5 business days to find the perfect matches.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="border border-secondary-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-2">What if I'm not satisfied with the recommended vendors?</h3>
                  <p className="text-secondary-600">
                    We'll work with you to refine your requirements and provide additional matches until you find the right fit. There's no obligation to proceed with any vendor until you're completely satisfied.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="border border-secondary-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-2">How does payment protection work?</h3>
                  <p className="text-secondary-600">
                    You deposit project funds into our secure escrow system. Funds are only released to vendors when you approve completed work or milestone deliverables. If work isn't completed to specification, your payment remains protected.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="border border-secondary-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-2">What fees does Collabov charge?</h3>
                  <p className="text-secondary-600">
                    Collabov charges no fees to clients. Our commission is paid by vendors after successful project completion. This aligns our interests with delivering successful outcomes for your business.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="border border-secondary-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-semibold mb-2">How are contracts managed?</h3>
                  <p className="text-secondary-600">
                    We provide legally-vetted contract templates tailored to different project types. You can customize these templates or upload your own. All contracts are digitally signed and stored securely on our platform.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Ready to Start Your Outsourcing Journey?"
        description="Connect with verified vendors and transform your business operations today."
        buttonText="Get Started Now"
        buttonLink="/contact"
      />
    </>
  );
};

export default HowItWorksPage;