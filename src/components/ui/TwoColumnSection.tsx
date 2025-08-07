import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TwoColumnSectionProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  children?: ReactNode;
  reversed?: boolean;
}

const TwoColumnSection: React.FC<TwoColumnSectionProps> = ({ 
  title, 
  description, 
  image, 
  imageAlt,
  children,
  reversed = false
}) => {
  return (
    <section className="section">
      <div className="container">
        <div className={`grid md:grid-cols-2 gap-10 items-center ${reversed ? 'md:grid-flow-dense' : ''}`}>
          <motion.div 
            className={reversed ? 'md:col-start-2' : ''}
            initial={{ opacity: 0, x: reversed ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <p className="text-secondary-600 mb-6">{description}</p>
            {children}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: reversed ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src={image} 
              alt={imageAlt} 
              className="rounded-lg shadow-xl h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TwoColumnSection;