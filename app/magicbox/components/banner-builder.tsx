'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wand2, RefreshCw, Copy, ExternalLink, Download } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

export default function BannerBuilder() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [bannerType, setBannerType] = useState('social');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(628);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerHtml, setBannerHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const generateBanner = async () =>
    // operation: 'start_over' | 'update'

    {
      if (!prompt.trim()) {
        alert('Please enter a description of what you want to create.');
        return;
      }

      setIsLoading(true);
      setShowPreview(false);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock HTML response for a banner
        const mockHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated Banner</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
            }
            .banner {
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              color: white;
              font-family: 'Arial', sans-serif;
              text-align: center;
              padding: 20px;
              box-sizing: border-box;
            }
            h1 {
              font-size: ${height > 300 ? '48px' : '32px'};
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            p {
              font-size: ${height > 300 ? '24px' : '18px'};
              max-width: 80%;
              margin: 0;
            }
            .overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IGlkPSJwYXR0ZXJuLWJhY2tncm91bmQiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ij48L3JlY3Q+PHBhdGggZD0iTSAwIDIwIEwgNDAgMjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjcGF0dGVybikiIGhlaWdodD0iMTAwJSIgd2lkdGg9IjEwMCUiPjwvcmVjdD48L3N2Zz4=');
              opacity: 0.5;
              z-index: 1;
              pointer-events: none;
            }
            .content {
              position: relative;
              z-index: 2;
            }
          </style>
        </head>
        <body>
          <div class="banner">
            <div class="overlay"></div>
            <div class="content">
              <h1>Generated ${
                bannerType.charAt(0).toUpperCase() + bannerType.slice(1)
              } Banner</h1>
              <p>${prompt}</p>
            </div>
          </div>
        </body>
        </html>
      `;

        setBannerHtml(mockHtml);
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
      .then(() => {
        alert('HTML copied to clipboard!');
      })
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

  // This is a mock function since we can't actually generate images in this environment
  const downloadBanner = () => {
    alert(
      'In a real implementation, this would download the banner as an image file.'
    );
  };

  return (
    <div className='space-y-8'>
      {/* User Input Form */}
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
          <Label
            htmlFor='url'
            className='block mb-2 font-semibold text-blue-300'
          >
            URL to Scrape:
          </Label>
          <Input
            id='url'
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
            placeholder='https://example.com'
            required
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div>
            <Label
              htmlFor='banner_type'
              className='block mb-2 font-semibold text-blue-300'
            >
              Banner Type:
            </Label>
            <Select value={bannerType} onValueChange={setBannerType}>
              <SelectTrigger className='w-full p-3 bg-gray-800 border border-gray-600 text-white'>
                <SelectValue placeholder='Select banner type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='social'>Social Media</SelectItem>
                <SelectItem value='web'>Web Banner</SelectItem>
                <SelectItem value='ad'>Advertisement</SelectItem>
                <SelectItem value='header'>Website Header</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor='width'
              className='block mb-2 font-semibold text-blue-300'
            >
              Width: {width}px
            </Label>
            <Slider
              id='width'
              value={[width]}
              min={300}
              max={2000}
              step={10}
              onValueChange={(value) => setWidth(value[0])}
              className='py-4'
            />
          </div>

          <div>
            <Label
              htmlFor='height'
              className='block mb-2 font-semibold text-blue-300'
            >
              Height: {height}px
            </Label>
            <Slider
              id='height'
              value={[height]}
              min={150}
              max={1200}
              step={10}
              onValueChange={(value) => setHeight(value[0])}
              className='py-4'
            />
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <Button
            onClick={
              () => generateBanner()
              // 'start_over'
            }
            disabled={isLoading}
            className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Generate New Banner
          </Button>

          {bannerHtml && (
            <Button
              onClick={() =>
                generateBanner()
                // 'update'
              }
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Current Banner
            </Button>
          )}
        </div>
      </div>

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
            className='w-full bg-white rounded-lg overflow-hidden'
            style={{ height: `${Math.min(500, height)}px` }}
          >
            <iframe
              srcDoc={bannerHtml}
              className='w-full h-full'
              title='Preview'
              style={{
                transform: height > 500 ? `scale(${500 / height})` : 'none',
                transformOrigin: 'top left',
              }}
            />
          </div>
          <div className='mt-2 text-sm text-gray-400 text-center'>
            Banner dimensions: {width}px × {height}px
          </div>
        </div>
      )}
    </div>
  );
}
