'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SplashGenerator from './components/splash-generator';
import EmailCreator from './components/email-creator';
import BannerBuilder from './components/banner-builder';
import { Sparkles, Mail, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagicBox() {
  const [activeTab, setActiveTab] = useState('splash');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 sm:p-6'>
      <div className='max-w-6xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src='/magic-logo.png'
            className='h-[280px] sm:h-[420px] m-auto -my-16 sm:-my-28'
            alt='Magic Logo'
          />
        </motion.div>

        <Tabs
          defaultValue='splash'
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'
        >
          <motion.div
            className='glassmorphism p-1 sm:p-2 rounded-xl mb-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <TabsList className='grid grid-cols-3 w-full h-max bg-transparent'>
              <TabsTrigger
                value='splash'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2'
                showUnderline={false}
              >
                <Sparkles className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden xs:inline'>Splash</span> Page
              </TabsTrigger>
              <TabsTrigger
                value='email'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2'
                showUnderline={false}
              >
                <Mail className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                Email <span className='hidden xs:inline'>Creator</span>
              </TabsTrigger>
              <TabsTrigger
                value='banner'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2'
                showUnderline={false}
              >
                <ImageIcon className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden xs:inline'>Blurb/</span>Banner
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Modified content area with enhanced animations */}
          <div className='relative min-h-[400px]'>
            <AnimatePresence mode='wait'>
              {activeTab === 'splash' && (
                <motion.div
                  key='splash'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 300,
                  }}
                  className='absolute w-full'
                >
                  <SplashGenerator />
                </motion.div>
              )}

              {activeTab === 'email' && (
                <motion.div
                  key='email'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 300,
                  }}
                  className='absolute w-full'
                >
                  <EmailCreator />
                </motion.div>
              )}

              {activeTab === 'banner' && (
                <motion.div
                  key='banner'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 300,
                  }}
                  className='absolute w-full'
                >
                  <BannerBuilder />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
