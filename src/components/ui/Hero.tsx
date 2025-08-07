import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeroProps {
  title: string;
  subtitle: string;
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA?: {
    text: string;
    link: string;
  };
  tertiaryCTA?: {
    text: string;
    link: string;
  };
  backgroundImage?: string;
}

const Hero: React.FC<HeroProps> = ({ 
  title, 
  subtitle, 
  primaryCTA, 
  secondaryCTA, 
  tertiaryCTA,
  backgroundImage = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
}) => {
  return (
    <div className="relative min-h-[600px] flex items-center pt-20">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-primary-950/70" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-16 md:py-24">
        <div className="max-w-3xl">
          <motion.h1 
            className="text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {title}
          </motion.h1>
          <motion.p 
            className="text-primary-100 text-xl mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to={primaryCTA.link} className="btn-primary">
              {primaryCTA.text}
            </Link>
            {secondaryCTA && (
              <Link to={secondaryCTA.link} className="btn-secondary">
                {secondaryCTA.text}
              </Link>
            )}
            {tertiaryCTA && (
              <Link to={tertiaryCTA.link} className="btn-accent">
                {tertiaryCTA.text}
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;