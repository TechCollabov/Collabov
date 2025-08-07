import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, Bot, Zap, Target, BarChart3, MessageSquare,
  Search, FileText, Code, Palette, TrendingUp, Shield
} from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import FeatureCard from '../components/ui/FeatureCard';
import CTA from '../components/ui/CTA';

const AiServicesPage: React.FC = () => {
  const aiServices = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'AI-Powered Vendor Matching',
      description: 'Our intelligent algorithm analyzes your project requirements and matches you with the most suitable vendors based on expertise, budget, and timeline.',
      features: ['Smart requirement analysis', 'Compatibility scoring', 'Real-time recommendations']
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'Automated Project Management',
      description: 'AI-driven project management tools that predict potential issues, optimize resource allocation, and ensure timely delivery.',
      features: ['Risk prediction', 'Resource optimization', 'Timeline management']
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Intelligent Communication Hub',
      description: 'AI-enhanced communication tools with real-time translation, sentiment analysis, and automated meeting summaries.',
      features: ['Real-time translation', 'Sentiment analysis', 'Meeting transcription']
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Predictive Analytics',
      description: 'Advanced analytics that provide insights into project success rates, vendor performance, and market trends.',
      features: ['Success rate prediction', 'Performance insights', 'Market analysis']
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Smart Quality Assurance',
      description: 'AI-powered quality checks that automatically review deliverables and ensure they meet your specifications.',
      features: ['Automated quality checks', 'Compliance monitoring', 'Performance scoring']
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Risk Assessment & Mitigation',
      description: 'Intelligent risk analysis that identifies potential project risks and suggests mitigation strategies.',
      features: ['Risk identification', 'Mitigation strategies', 'Continuous monitoring']
    }
  ];

  const aiTools = [
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Smart Search',
      description: 'Natural language search that understands context and intent to find exactly what you need.',
      comingSoon: false
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Contract Generator',
      description: 'AI-powered contract generation based on project requirements and industry best practices.',
      comingSoon: true
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: 'Code Review Assistant',
      description: 'Automated code review and quality assessment for development projects.',
      comingSoon: true
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Design Feedback AI',
      description: 'Intelligent design analysis and feedback based on UX/UI best practices.',
      comingSoon: true
    }
  ];

  return (
    <>
      <Hero 
        title="AI-Powered Outsourcing Solutions"
        subtitle="Leverage artificial intelligence to streamline your outsourcing process, make smarter decisions, and achieve better outcomes"
        primaryCTA={{ text: "Explore AI Features", link: "#ai-services" }}
        secondaryCTA={{ text: "Try AI Calculator", link: "/ai-calculator" }}
        backgroundImage="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* AI Services Section */}
      <section className="section" id="ai-services">
        <div className="container">
          <SectionTitle 
            title="AI-Enhanced Outsourcing Services"
            subtitle="Discover how artificial intelligence transforms every aspect of your outsourcing journey"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {aiServices.map((service, index) => (
              <motion.div 
                key={service.title}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <Zap className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="section bg-gray-50">
        <div className="container">
          <SectionTitle 
            title="AI Tools & Features"
            subtitle="Powerful AI-driven tools to enhance your outsourcing experience"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {aiTools.map((tool, index) => (
              <motion.div 
                key={tool.title}
                className="bg-white p-6 rounded-xl shadow-md relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {tool.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-accent-100 text-accent-600 text-xs font-medium px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                <p className="text-gray-600 text-sm">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How AI Improves Outsourcing */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="How AI Transforms Outsourcing"
            subtitle="See the measurable impact of AI on outsourcing success rates"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {[
              { metric: '85%', label: 'Faster Vendor Matching', description: 'AI reduces vendor selection time from weeks to hours' },
              { metric: '40%', label: 'Better Project Success Rate', description: 'Predictive analytics improve project outcomes' },
              { metric: '60%', label: 'Reduced Communication Issues', description: 'AI translation and sentiment analysis' },
              { metric: '50%', label: 'Lower Project Risks', description: 'Early risk detection and mitigation' }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.metric}</div>
                <h3 className="text-lg font-semibold mb-2">{stat.label}</h3>
                <p className="text-gray-600 text-sm">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI in Action */}
      <section className="section bg-primary-900 text-white">
        <div className="container">
          <SectionTitle 
            title="AI in Action"
            subtitle="Real examples of how our AI technology works for you"
            centered={true}
            light={true}
          />
          
          <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6">Smart Vendor Matching Process</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Requirement Analysis</h4>
                    <p className="text-primary-200">AI analyzes your project description, budget, timeline, and technical requirements</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Vendor Scoring</h4>
                    <p className="text-primary-200">Each vendor receives a compatibility score based on 50+ factors</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Recommendations</h4>
                    <p className="text-primary-200">Top 3-5 vendors are recommended with detailed reasoning</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-primary-800 p-6 rounded-lg">
                <h4 className="font-semibold mb-4">Example AI Analysis</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-primary-700 p-3 rounded">
                    <strong>Project:</strong> E-commerce mobile app development
                  </div>
                  <div className="bg-primary-700 p-3 rounded">
                    <strong>AI Recommendation:</strong> TechPro Solutions (95% match)
                    <br />
                    <span className="text-primary-200">Reasons: React Native expertise, e-commerce portfolio, timezone compatibility</span>
                  </div>
                  <div className="bg-primary-700 p-3 rounded">
                    <strong>Predicted Success Rate:</strong> 92%
                    <br />
                    <span className="text-primary-200">Based on similar projects and vendor performance</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Ready to Experience AI-Powered Outsourcing?"
        description="Join thousands of businesses using AI to make smarter outsourcing decisions and achieve better results."
        buttonText="Get Started with AI"
        buttonLink="/contact"
      />
    </>
  );
};

export default AiServicesPage;