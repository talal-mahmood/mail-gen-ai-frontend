'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SplashGenerator from './components/splash-generator';
import EmailCreator from './components/email-creator';
import BannerBuilder from './components/banner-builder';
import { Sparkles, Mail, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllConfigs } from '@/lib/api';
import { initHistory } from '@/lib/history';

type Config = {
  placeholder: string;
  heading: string;
  subheading: string;
};

type Configs = {
  splash_page: Config;
  email: Config;
  banner: Config;
  blurb: Config;
};

export default function MagicBox() {
  const [activeTab, setActiveTab] = useState('splash');
  const [mounted, setMounted] = useState(false);
  const [configs, setConfigs] = useState<Configs>({
    splash_page: {
      placeholder: '',
      heading: '',
      subheading: '',
    },
    email: {
      placeholder: '',
      heading: '',
      subheading: '',
    },
    banner: {
      placeholder: '',
      heading: '',
      subheading: '',
    },
    blurb: {
      placeholder: '',
      heading: '',
      subheading: '',
    },
  });

  // Prevent hydration mismatch
  useEffect(() => {
    initHistory();
    const fetchData = async () => {
      const allConfigs = await getAllConfigs();
      setConfigs(allConfigs);
    };
    fetchData();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className='h-[100dvh] fixed overflow-y-auto inset-0 bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 bg-black sm:p-6'>
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
              >
                <Sparkles className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden xs:inline mr-1'>Splash</span> Page
              </TabsTrigger>
              <TabsTrigger
                value='email'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2'
              >
                <Mail className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                Email <span className='hidden xs:inline ml-1'>Creator</span>
              </TabsTrigger>
              <TabsTrigger
                value='banner'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2'
              >
                <ImageIcon className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden xs:inline mr-1'>Blurb /</span>Banner
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <div className='relative h-max pb-4'>
            <motion.div
              initial={false}
              animate={{ opacity: activeTab === 'splash' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute w-full ${
                activeTab === 'splash' ? 'block' : 'hidden'
              }`}
            >
              <SplashGenerator config={configs.splash_page} />
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: activeTab === 'email' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute w-full ${
                activeTab === 'email' ? 'block' : 'hidden'
              }`}
            >
              <EmailCreator config={configs.email} />
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: activeTab === 'banner' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute w-full ${
                activeTab === 'banner' ? 'block' : 'hidden'
              }`}
            >
              <BannerBuilder
                config={{ banner: configs.banner, blurb: configs.blurb }}
              />
            </motion.div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
