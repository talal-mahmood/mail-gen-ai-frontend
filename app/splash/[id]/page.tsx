'use client';
import React, { useEffect, useState } from 'react';
import { getSplashHtml } from '@/lib/api';
import { useParams } from 'next/navigation';

const SplashPreview = () => {
  const [splashHtml, setSplashHtml] = useState<string>('');
  const { id } = useParams();

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const result = await getSplashHtml(id as string);
        // Remove Markdown code fences if they exist
        let htmlContent = result.html_content;
        if (htmlContent.startsWith('```html') && htmlContent.endsWith('```')) {
          htmlContent = htmlContent
            .replace(/^```html\s*/, '')
            .replace(/```$/, '');
        }
        setSplashHtml(htmlContent);
      } catch (error) {
        console.error('Error fetching splash page:', error);
      }
    };

    if (id) {
      fetchPage();
    }
  }, [id]);

  return splashHtml ? (
    <div dangerouslySetInnerHTML={{ __html: splashHtml }} />
  ) : (
    <div className='flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-gradient-to-br from-gray-900 to-gray-950 text-white'>
      <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
      <p className='text-xl text-blue-300 loading-dots [text-shadow:none]'>
        Loading splash page...
      </p>
    </div>
  );
};

export default SplashPreview;
