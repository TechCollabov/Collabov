import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondary?: boolean;
}

const CTA: React.FC<CTAProps> = ({ 
  title, 
  description, 
  buttonText, 
  buttonLink,
  secondary = false
}) => {
  return (
    <section className={`py-16 ${secondary ? 'bg-secondary-50' : 'bg-primary-900'}`}>
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className={`text-3xl md:text-4xl font-bold mb-4 ${secondary ? 'text-secondary-900' : 'text-white'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h2>
          <motion.p 
            className={`text-lg mb-8 ${secondary ? 'text-secondary-600' : 'text-primary-200'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link 
              to={buttonLink} 
              className={`${secondary ? 'btn-primary' : 'btn-accent'} inline-flex items-center`}
            >
              {buttonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;