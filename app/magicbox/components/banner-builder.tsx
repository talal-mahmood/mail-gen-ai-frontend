'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HercuBlurbTab from './hercu-blurb';
import BannerAdTab from './banner-ad';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState('hercu');

  return (
    <Tabs
      defaultValue='hercu'
      value={activeTab}
      onValueChange={setActiveTab}
      className=''
    >
      <motion.div
        className='glassmorphism w-max p-2 !-mt-6 mb-2 h-auto rounded-xl'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TabsList className='flex w-max bg-transparent'>
          <TabsTrigger
            value='hercu'
            className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 sm:px-10 py-2 transition-all duration-300'
          >
            Hercu/PowerBlurb
          </TabsTrigger>
          <TabsTrigger
            value='banner'
            className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white px-4 sm:px-10 py-2 transition-all duration-300'
          >
            Banner Ad
          </TabsTrigger>
        </TabsList>
      </motion.div>

      <div className='relative min-h-[400px]'>
        <motion.div
          initial={false}
          animate={{
            opacity: activeTab === 'hercu' ? 1 : 0,
            x: activeTab === 'hercu' ? 0 : 20,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'absolute',
            width: '100%',
            display: activeTab === 'hercu' ? 'block' : 'none',
          }}
        >
          <HercuBlurbTab />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            opacity: activeTab === 'banner' ? 1 : 0,
            x: activeTab === 'banner' ? 0 : 20,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'absolute',
            width: '100%',
            display: activeTab === 'banner' ? 'block' : 'none',
          }}
        >
          <BannerAdTab />
        </motion.div>
      </div>
    </Tabs>
  );
}
