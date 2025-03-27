'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import HercuBlurbTab from './hercu-blurb';
import BannerAdTab from './banner-ad';

export default function CreatorDashboard() {
  return (
    <Tabs defaultValue='hercu' className=''>
      <TabsList className='glassmorphism p-2 !-mt-4 h-auto rounded-xl'>
        <TabsTrigger
          value='hercu'
          className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white px-10'
        >
          HercuBlurb
        </TabsTrigger>
        <TabsTrigger
          value='banner'
          className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white px-10'
        >
          Banner Ad
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value='hercu'
        forceMount
        className='data-[state=inactive]:hidden'
      >
        <HercuBlurbTab />
      </TabsContent>

      <TabsContent
        value='banner'
        forceMount
        className='data-[state=inactive]:hidden'
      >
        <BannerAdTab />
      </TabsContent>
    </Tabs>
  );
}
