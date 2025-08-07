import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Package, Wallet, Globe, Users, BadgeCheck, BarChart3 } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';
import TwoColumnSection from '../components/ui/TwoColumnSection';

const VendorsPage: React.FC = () => {
  return (
    <>
      <Hero 
        title="Grow Your Global Client Base"
        subtitle="Join Collabov's network of verified vendors and connect with businesses looking for your expertise"
        primaryCTA={{ text: "Register Your Company", link: "/vendor/signup" }}
        backgroundImage="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Benefits Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Benefits for Vendors"
            subtitle="Expand your business by joining our curated marketplace of outsourcing providers"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <FeatureCard 
              icon={<Globe className="h-6 w-6" />}
              title="Global Reach"
              description="Access clients from around the world without expensive marketing or sales operations."
              delay={0}
            />
            <FeatureCard 
              icon={<BadgeCheck className="h-6 w-6" />}
              title="Verified Status"
              description="Earn the Collabov verification badge to stand out from competitors and build trust."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Wallet className="h-6 w-6" />}
              title="Secure Payments"
              description="Get paid on time with our secure escrow system and standardized payment terms."
              delay={0.4}
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6" />}
              title="Growth Insights"
              description="Access market data and client preferences to optimize your service offerings."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="How It Works for Vendors"
            subtitle="A streamlined process to join our platform and start connecting with clients"
            centered={true}
          />
          
          <div className="max-w-3xl mx-auto mt-12">
            <div className="border border-secondary-200 rounded-lg bg-white overflow-hidden">
              <div className="p-6 border-b border-secondary-200 flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mr-4">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Apply</h3>
                  <p className="text-secondary-600">
                    Complete our vendor application with details about your company, services, team composition, and previous work. There's no fee to apply.
                  </p>
                </div>
              </div>
              <div className="p-6 border-b border-secondary-200 flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mr-4">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Verification</h3>
                  <p className="text-secondary-600">
                    Our team will review your application, check references, and may conduct interviews with your team. This process typically takes 1-2 weeks.
                  </p>
                </div>
              </div>
              <div className="p-6 border-b border-secondary-200 flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mr-4">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Profile Creation</h3>
                  <p className="text-secondary-600">
                    Once verified, create your detailed company profile, add team members, showcase your portfolio, and set up your service packages.
                  </p>
                </div>
              </div>
              <div className="p-6 flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 mr-4">
                  <span className="font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Start Receiving Inquiries</h3>
                  <p className="text-secondary-600">
                    Your profile becomes visible to clients, and you'll start receiving match recommendations and direct inquiries based on your expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Features Section */}
      <TwoColumnSection
        title="Vendor Dashboard & Features"
        description="Our purpose-built platform gives you all the tools you need to manage client relationships, track projects, and grow your business."
        image="https://images.pexels.com/photos/927022/pexels-photo-927022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        imageAlt="Vendor dashboard interface"
      >
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold">Comprehensive Profile</h4>
              <p className="text-secondary-600">Showcase your services, team expertise, case studies, and client testimonials.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold">Service Packages</h4>
              <p className="text-secondary-600">Create standardized service offerings with clear scopes and pricing for faster client decisions.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold">Performance Analytics</h4>
              <p className="text-secondary-600">Track profile views, inquiry rates, conversion metrics, and client satisfaction scores.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold">Secure Communication</h4>
              <p className="text-secondary-600">Built-in messaging, file sharing, and video conferencing with potential clients.</p>
            </div>
          </div>
        </div>
        <Link to="/vendor/signup" className="btn-primary">
          Register as a Vendor
        </Link>
      </TwoColumnSection>

      {/* Commission Structure Section */}
      <section className="section bg-primary-900 text-white">
        <div className="container">
          <SectionTitle 
            title="Transparent Commission Structure"
            subtitle="We only succeed when you succeed - our simple commission model aligns our interests"
            centered={true}
            light={true}
          />
          
          <div className="max-w-3xl mx-auto mt-12 bg-primary-800 rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 border-b md:border-b-0 md:border-r border-primary-700">
                <h3 className="text-2xl font-bold mb-3">First Engagement</h3>
                <p className="text-primary-200 mb-6">For your first project with any client through our platform</p>
                <div className="flex justify-center">
                  <div className="bg-primary-700 h-24 w-24 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold">10%</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-3">Ongoing Work</h3>
                <p className="text-primary-200 mb-6">For all subsequent projects with the same client</p>
                <div className="flex justify-center">
                  <div className="bg-primary-700 h-24 w-24 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold">5%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-primary-700">
              <p className="text-center text-primary-100">
                No hidden fees or additional charges. Commission is automatically calculated during payment processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Vendor Success Stories"
            subtitle="Hear from outsourcing companies that have grown their business with Collabov"
            centered={true}
          />
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-lg text-secondary-600 mb-6">
                "Since joining Collabov, we've seen a 40% increase in new client acquisition. The platform's verification process gives clients confidence in our services, and the dashboard tools help us manage relationships effectively."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-secondary-200 mr-4"></div>
                <div>
                  <h4 className="font-semibold">DevBridge Technologies</h4>
                  <p className="text-primary-600 text-sm">Software Development, Poland</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-lg text-secondary-600 mb-6">
                "Collabov has transformed how we find international clients. The secure payment system and standardized contracts have eliminated payment delays that used to plague our business. We've grown our team by 15 people this year alone."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-secondary-200 mr-4"></div>
                <div>
                  <h4 className="font-semibold">MarketingPro Agency</h4>
                  <p className="text-primary-600 text-sm">Digital Marketing, Philippines</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Ready to Expand Your Client Base?"
        description="Join Collabov today and connect with businesses seeking your expertise."
        buttonText="Apply as a Vendor"
        buttonLink="/vendor/signup"
      />
    </>
  );
};

export default VendorsPage;