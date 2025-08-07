import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

import Hero from '../components/ui/Hero';
import SectionTitle from '../components/ui/SectionTitle';
import CTA from '../components/ui/CTA';

const BlogPage: React.FC = () => {
  const featuredPost = {
    title: "In-House vs Outsourced Teams – Complete Cost Breakdown for 2025",
    excerpt: "Explore the true costs of building an in-house team versus outsourcing, including hidden expenses and long-term considerations for different business sizes.",
    image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "May 15, 2025",
    readTime: "8 min read",
    category: "Cost Analysis"
  };

  const blogPosts = [
    {
      title: "Legal Tips for Outsourcing Projects in the UK and EU",
      excerpt: "Navigate the complex regulatory landscape of outsourcing in the UK and EU with these essential legal considerations and best practices.",
      image: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "May 10, 2025",
      readTime: "6 min read",
      category: "Legal"
    },
    {
      title: "Top 5 Mistakes to Avoid When Hiring Overseas Development Teams",
      excerpt: "Learn from common pitfalls and discover proven strategies for successful collaboration with international development partners.",
      image: "https://images.pexels.com/photos/3153198/pexels-photo-3153198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "May 5, 2025",
      readTime: "7 min read",
      category: "Best Practices"
    },
    {
      title: "How to Effectively Manage Communication Across Time Zones",
      excerpt: "Implement these proven strategies to overcome the challenges of global collaboration and maintain productive team dynamics across different time zones.",
      image: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "April 28, 2025",
      readTime: "5 min read",
      category: "Management"
    },
    {
      title: "Outsourcing for Startups: Maximizing Limited Resources",
      excerpt: "Discover how early-stage companies can leverage strategic outsourcing to compete with larger players while preserving capital and flexibility.",
      image: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "April 20, 2025",
      readTime: "6 min read",
      category: "Startups"
    },
    {
      title: "Case Study: How FinTech Startup Reduced Development Costs by 60%",
      excerpt: "An inside look at how a growing FinTech company restructured their development approach with strategic outsourcing partners.",
      image: "https://images.pexels.com/photos/8370334/pexels-photo-8370334.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "April 12, 2025",
      readTime: "9 min read",
      category: "Case Study"
    },
    {
      title: "Security Best Practices for Outsourced IT Projects",
      excerpt: "Essential security protocols, contractual protections, and monitoring systems to safeguard your data when working with external teams.",
      image: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      date: "April 5, 2025",
      readTime: "7 min read",
      category: "Security"
    }
  ];

  return (
    <>
      <Hero 
        title="Outsourcing Insights"
        subtitle="Expert advice, industry trends, and practical guides to help you optimize your outsourcing strategy"
        primaryCTA={{ text: "Latest Articles", link: "#articles" }}
        backgroundImage="https://images.pexels.com/photos/3182750/pexels-photo-3182750.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      />

      {/* Featured Article Section */}
      <section className="section" id="articles">
        <div className="container">
          <SectionTitle 
            title="Featured Article"
            subtitle="Our most valuable and comprehensive resource on outsourcing strategy"
            centered={true}
          />
          
          <motion.div 
            className="mt-12 bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img 
                  className="h-64 w-full object-cover md:h-full md:w-80 lg:w-96" 
                  src={featuredPost.image} 
                  alt={featuredPost.title} 
                />
              </div>
              <div className="p-8">
                <div className="flex items-center mb-2">
                  <span className="inline-block bg-primary-100 text-primary-600 text-xs font-medium px-2.5 py-0.5 rounded-md">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{featuredPost.title}</h2>
                <p className="text-lg text-secondary-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center text-sm text-secondary-500 mb-6">
                  <div className="flex items-center mr-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Link to="#" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors">
                  Read full article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <SectionTitle 
            title="Latest Articles"
            subtitle="Stay updated with our newest guides, case studies, and industry insights"
            centered={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {blogPosts.map((post, index) => (
              <motion.div 
                key={post.title}
                className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <img 
                  className="h-48 w-full object-cover" 
                  src={post.image} 
                  alt={post.title} 
                />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center mb-2">
                    <span className="inline-block bg-primary-100 text-primary-600 text-xs font-medium px-2.5 py-0.5 rounded-md">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                  <p className="text-secondary-600 mb-4 flex-1">{post.excerpt}</p>
                  <div className="flex items-center text-sm text-secondary-500 mb-4">
                    <div className="flex items-center mr-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Link to="#" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors mt-auto">
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="#" className="btn-primary">
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="container">
          <SectionTitle 
            title="Browse by Category"
            subtitle="Explore our content organized by topic to find exactly what you need"
            centered={true}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
            {['Strategy', 'Cost Analysis', 'Legal', 'Management', 'Security', 'Case Studies', 'Best Practices', 'Technology', 'Remote Work', 'Startups', 'Enterprise', 'Market Trends'].map((category, index) => (
              <motion.div 
                key={category}
                className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 text-center hover:border-primary-200 hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to="#" className="text-secondary-800 hover:text-primary-600 font-medium">
                  {category}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section bg-primary-900 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Subscribe to Our Newsletter
            </motion.h2>
            <motion.p 
              className="text-lg mb-8 text-primary-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Get the latest outsourcing insights and industry news delivered directly to your inbox.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 text-secondary-800"
              />
              <button className="btn-accent whitespace-nowrap">
                Subscribe Now
              </button>
            </motion.div>
            <motion.p 
              className="text-sm mt-4 text-primary-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              We respect your privacy. Unsubscribe at any time.
            </motion.p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA 
        title="Have a Question About Outsourcing?"
        description="Our experts are ready to help you navigate your specific outsourcing challenges."
        buttonText="Contact Us"
        buttonLink="/contact"
        secondary={true}
      />
    </>
  );
};

export default BlogPage;