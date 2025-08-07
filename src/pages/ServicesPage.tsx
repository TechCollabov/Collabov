import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, Database, TestTube, Users, Palette, 
  Lightbulb, Shield, Cloud, Smartphone, CheckCircle, 
  ArrowRight 
} from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';

const ServicesPage: React.FC = () => {
  const services = [
    {
      icon: <Code />,
      title: 'Front-end Development',
      description: 'Expert React, Vue, and Angular developers',
      rate: 'From £1,700/month'
    },
    {
      icon: <Database />,
      title: 'Back-end Development',
      description: 'Node.js, Python, and Java specialists',
      rate: 'From £2,000/month'
    },
    {
      icon: <TestTube />,
      title: 'Quality Testing',
      description: 'Automated and manual testing experts',
      rate: 'From £1,500/month'
    },
    {
      icon: <Users />,
      title: 'Project Management',
      description: 'Certified Scrum and Prince2 practitioners',
      rate: 'From £2,500/month'
    },
    {
      icon: <Palette />,
      title: 'Web Design',
      description: 'UI/UX and graphic design professionals',
      rate: 'From £1,800/month'
    },
    {
      icon: <Lightbulb />,
      title: 'Product Development',
      description: 'Full-cycle product development teams',
      rate: 'From £2,200/month'
    },
    {
      icon: <Shield />,
      title: 'Network & Security',
      description: 'Cybersecurity and network specialists',
      rate: 'From £2,300/month'
    },
    {
      icon: <Cloud />,
      title: 'DevOps',
      description: 'AWS and Azure certified engineers',
      rate: 'From £2,400/month'
    },
    {
      icon: <Smartphone />,
      title: 'Mobile Development',
      description: 'iOS and Android app developers',
      rate: 'From £2,100/month'
    }
  ];

  const dedicatedTeams = [
    {
      title: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      rate: '£1,700/month'
    },
    {
      title: 'Senior Frontend Developer',
      skills: ['React', 'Vue.js', 'TypeScript'],
      rate: '£2,200/month'
    },
    {
      title: 'Backend Developer',
      skills: ['Python', 'Django', 'AWS'],
      rate: '£2,000/month'
    },
    {
      title: 'Mobile Developer',
      skills: ['React Native', 'iOS', 'Android'],
      rate: '£2,100/month'
    },
    {
      title: 'QA Engineer',
      skills: ['Selenium', 'Jest', 'Cypress'],
      rate: '£1,500/month'
    },
    {
      title: 'DevOps Engineer',
      skills: ['Docker', 'Kubernetes', 'CI/CD'],
      rate: '£2,400/month'
    }
  ];

  return (
    <>
      <Hero 
        title="Our Services"
        subtitle="Comprehensive technology solutions delivered by verified experts"
        primaryCTA={{ text: "Get Matched", link: "/contact" }}
        backgroundImage="https://images.pexels.com/photos/3182811/pexels-photo-3182811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Technology Services"
            subtitle="Expert teams across all major technology domains"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {services.map((service, index) => (
              <motion.div 
                key={service.title}
                className="bg-white p-6 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-semibold">{service.rate}</span>
                  <Link to="/contact" className="text-primary-600 hover:text-primary-700">
                    Learn more →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dedicated Teams Section */}
      <section className="section bg-gray-50">
        <div className="container">
          <SectionTitle 
            title="Dedicated Team Pricing"
            subtitle="Transparent monthly rates for full-time dedicated team members"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {dedicatedTeams.map((team, index) => (
              <motion.div 
                key={team.title}
                className="bg-white p-6 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-semibold mb-4">{team.title}</h3>
                <div className="space-y-3 mb-6">
                  {team.skills.map((skill) => (
                    <div key={skill} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary-600">{team.rate}</span>
                  <Link to="/contact" className="btn-primary">
                    Hire Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Why Choose Our Services"
            subtitle="Benefits of working with our verified technology experts"
            centered={true}
          />
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <FeatureCard 
              icon={<Shield className="h-6 w-6" />}
              title="Verified Experts"
              description="All team members are thoroughly vetted for technical skills and communication abilities"
              delay={0}
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6" />}
              title="Dedicated Teams"
              description="Full-time resources working exclusively on your projects"
              delay={0.2}
            />
            <FeatureCard 
              icon={<Cloud className="h-6 w-6" />}
              title="Modern Tech Stack"
              description="Expertise in latest technologies and best practices"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Ready to Build Your Team?"
        description="Get matched with verified technology experts within 48 hours"
        buttonText="Start Now"
        buttonLink="/contact"
      />
    </>
  );
};

export default ServicesPage;