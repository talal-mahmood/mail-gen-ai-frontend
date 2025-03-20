'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SplashGenerator from './components/splash-generator';
import EmailCreator from './components/email-creator';
import BannerBuilder from './components/banner-builder';
import { Sparkles, Mail, Image } from 'lucide-react';

export default function MagicBox() {
  const [activeTab, setActiveTab] = useState('splash');

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-6'>
      <div className='max-w-6xl mx-auto'>
        <img src='/magic-logo.png' className='h-[420px] m-auto -mt-24 -mb-32' />
        {/* <h1 className='text-4xl font-bold text-center mb-6 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500'>
          MagicBox
        </h1> */}

        <Tabs
          defaultValue='splash'
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'
        >
          <div className='glassmorphism p-4 rounded-xl mb-8'>
            <TabsList className='grid grid-cols-3 w-full bg-transparent'>
              <TabsTrigger
                value='splash'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white'
              >
                <Sparkles className='mr-2 h-4 w-4' />
                Splash {/* <span className='hidden ml-1 sm:inline'> */}/ Webpage
                Generator
                {/* </span> */}
              </TabsTrigger>
              <TabsTrigger
                value='email'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white'
              >
                <Mail className='mr-2 h-4 w-4' />
                Email Ad Creator
              </TabsTrigger>
              <TabsTrigger
                value='banner'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white'
              >
                <Image className='mr-2 h-4 w-4' />
                HercuBlurb / Banner Ad Builder
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Modified content area */}
          <div className='relative'>
            <div style={{ display: activeTab === 'splash' ? 'block' : 'none' }}>
              <SplashGenerator />
            </div>
            <div style={{ display: activeTab === 'email' ? 'block' : 'none' }}>
              <EmailCreator />
            </div>
            <div style={{ display: activeTab === 'banner' ? 'block' : 'none' }}>
              <BannerBuilder />
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
