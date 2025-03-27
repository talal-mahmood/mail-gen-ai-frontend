'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Wand2, RefreshCw, Copy, ExternalLink, Download } from 'lucide-react';
import { callBannerGenerateAPI } from '@/lib/api';
import { Slider } from '@/components/ui/slider';

export default function BannerAdTab() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bannerHtml, setBannerHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bannerWidth, setBannerWidth] = useState(300);
  const [bannerHeight, setBannerHeight] = useState(500);
  const [updatePrompt, setUpdatePrompt] = useState('');

  const validateUrl = (inputUrl: string) => {
    return /^https?:\/\//i.test(inputUrl);
  };

  const generateBanner = async (operation: 'start_over' | 'update') => {
    if (!prompt.trim()) {
      alert('Please enter a description of what you want to create.');
      return;
    }

    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return;
    }

    if (!validateUrl(url)) {
      setUrlError('URL must start with "http://" or "https://"');
      return;
    }

    setIsLoading(true);
    setShowPreview(false);
    setUrlError('');

    try {
      const requestData = {
        user_prompt: prompt,
        width: bannerWidth,
        height: bannerHeight,
        operation: operation,
        website_url: url,
        previous_banner: operation === 'update' ? bannerHtml : '',
      };

      const response = await callBannerGenerateAPI(requestData);
      setBannerHtml(response.html);
      setShowPreview(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating banner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyHtmlCode = () => {
    navigator.clipboard
      .writeText(bannerHtml)
      .then(() => alert('HTML copied to clipboard!'))
      .catch((err) => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy HTML code. Please try again.');
      });
  };

  const openPreviewInNewTab = () => {
    const newTab = window.open('');
    if (newTab) {
      newTab.document.write(bannerHtml);
      newTab.document.close();
    }
  };

  const downloadBanner = () => {
    alert('Download functionality would be implemented here');
  };

  return (
    <div className='space-y-8'>
      {!showPreview && !isLoading ? (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='mb-6'>
            <Label
              htmlFor='prompt'
              className='block mb-2 font-semibold text-blue-300'
            >
              Describe your banner
            </Label>
            <Textarea
              id='prompt'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='Describe what you want your banner to look like...'
              rows={3}
            />
          </div>
          <div className='mb-6'>
            <Label className='block mb-2 font-semibold text-blue-300'>
              Website URL to link to:
            </Label>
            <Input
              type='url'
              value={url}
              onChange={(e) => {
                const newUrl = e.target.value;
                setUrl(newUrl);
                setUrlError(
                  newUrl && !validateUrl(newUrl)
                    ? 'URL must start with "http://" or "https://"'
                    : ''
                );
              }}
              className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='https://example.com'
              required
            />
            {urlError && (
              <p className='mt-1 text-xs text-red-500'>{urlError}</p>
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div className='mb-6'>
              <Label className='block mb-2 font-semibold text-blue-300'>
                Banner Width: {bannerWidth}px
              </Label>
              <Slider
                value={[bannerWidth]}
                min={300}
                max={3000}
                step={10}
                onValueChange={(value) => setBannerWidth(value[0])}
                className='py-4'
              />
            </div>

            <div className='mb-6'>
              <Label className='block mb-2 font-semibold text-blue-300'>
                Banner Height: {bannerHeight}px
              </Label>
              <Slider
                value={[bannerHeight]}
                min={100}
                max={2000}
                step={10}
                onValueChange={(value) => setBannerHeight(value[0])}
                className='py-4'
              />
            </div>
          </div>

          <Button
            onClick={() => generateBanner('start_over')}
            disabled={isLoading}
            className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Generate New Banner
          </Button>
        </div>
      ) : (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='mb-6'>
            <Label className='block mb-2 font-semibold text-blue-300'>
              Update Banner Content
            </Label>
            <Textarea
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='Enter updated instructions for the banner...'
              rows={3}
            />
          </div>

          <div className='flex gap-4'>
            <Button
              onClick={() => setShowConfirmation(true)}
              className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              <Wand2 className='mr-2 h-4 w-4' /> Generate New Banner
            </Button>
            <Button
              onClick={() => generateBanner('update')}
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Banner
            </Button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center my-12'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-xl text-blue-300 loading-dots'>
            Generating your banner
          </p>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && (
        <div className='glassmorphism p-6 rounded-xl'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-2xl font-semibold text-blue-300'>
              Live Preview
            </h2>
            <div className='flex gap-2'>
              <Button
                onClick={downloadBanner}
                className='bg-green-600 hover:bg-green-700'
              >
                <Download className='mr-2 h-4 w-4' /> Download
              </Button>
              <Button
                onClick={copyHtmlCode}
                className='bg-blue-600 hover:bg-blue-700'
              >
                <Copy className='mr-2 h-4 w-4' /> Copy HTML
              </Button>
              <Button
                onClick={openPreviewInNewTab}
                className='bg-purple-600 hover:bg-purple-700'
              >
                <ExternalLink className='mr-2 h-4 w-4' /> Open in New Tab
              </Button>
            </div>
          </div>
          <div
            className={`w-full bg-white rounded-lg overflow-scroll h-[500px] `}
          >
            <iframe
              srcDoc={bannerHtml}
              className={`w-full h-[2020px] m-auto p-2`}
              title='Preview'
            />
          </div>
        </div>
      )}
      {showConfirmation && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 p-6 rounded-lg max-w-md w-full'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Confirm Reset
            </h3>
            <p className='text-gray-300 mb-6'>
              This will clear all inputs and start fresh. Are you sure?
            </p>
            <div className='flex justify-end gap-3'>
              <Button
                variant='outline'
                onClick={() => setShowConfirmation(false)}
                className='text-red-500 bg-transparent border-red-500 hover:bg-red-500 hover:text-white'
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPrompt('');
                  setUrl('');
                  setUpdatePrompt('');
                  setBannerHtml('');
                  setShowPreview(false);
                  setShowConfirmation(false);
                }}
                className='bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 
           transition-all'
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
