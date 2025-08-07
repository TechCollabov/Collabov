import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
  delay?: number;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description, icon, delay = 0 }) => {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex flex-col md:flex-row items-start gap-5">
        <div className="bg-primary-100 h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md">
          <span className="text-primary-600 font-bold text-xl">{number}</span>
        </div>
        <div>
          <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-secondary-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StepCard;