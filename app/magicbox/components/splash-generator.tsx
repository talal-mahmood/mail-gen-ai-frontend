'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wand2, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { callSplashGenerateAPI } from '@/lib/api';

export default function SplashGenerator() {
  const [id, setId] = useState('');
  const [query, setQuery] = useState('');
  const [styleType, setStyleType] = useState('casual');
  const [buttonUrl, setButtonUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    console.log('id was set to: ', id);
  }, [id]);

  const generateSplashPage = async (operation: 'start_over' | 'update') => {
    if (!query.trim()) {
      alert('Please enter a description of what you want to create.');
      return;
    }
    if (urlError !== '') {
      alert('Please enter a valid url.');
      return;
    }

    setIsLoading(true);
    setShowPreview(false);

    const requestData: any = {
      query,
      style_type: styleType,
      operation,
      button_url: buttonUrl,
    };

    if (operation === 'update') {
      requestData.previous_html = currentHtml;
      requestData.id = id;
    }

    try {
      const data = await callSplashGenerateAPI(requestData);
      console.log('data is: ', data);
      const htmlOutput = data.html.replace(/```html|```/g, '').trim();
      setCurrentHtml(htmlOutput);
      setShowPreview(true);
      setQuery('');
      setId(data.id);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error connecting to API. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyHtmlCode = () => {
    navigator.clipboard
      .writeText(currentHtml)
      .then(() => {
        alert('HTML copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy HTML code. Please try again.');
      });
  };

  const openPreviewInNewTab = () => {
    // Use window.location.origin to get the current domain
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/splash/${id}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className='space-y-8'>
      {/* User Input Form */}
      <div className='glassmorphism p-8 rounded-xl'>
        <div className='mb-6'>
          <Label
            htmlFor='query'
            className='block mb-2 font-semibold text-blue-300'
          >
            What does your ideal webpage look like?
          </Label>
          <Textarea
            id='query'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
            placeholder='Type here to generate some magic...'
            rows={3}
          />
        </div>

        {!showPreview && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div>
              <Label
                htmlFor='style_type'
                className='block mb-2 font-semibold text-blue-300'
              >
                Style Type:
              </Label>
              <Select value={styleType} onValueChange={setStyleType}>
                <SelectTrigger className='w-full p-3 bg-gray-800 border border-gray-600 text-white'>
                  <SelectValue placeholder='Select style' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='casual'>Casual (Cosmic)</SelectItem>
                  <SelectItem value='professional'>Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div>
                <Label
                  htmlFor='button_url'
                  className='block mb-2 font-semibold text-blue-300'
                >
                  Link You Are Advertising (Optional):
                </Label>
                <Input
                  id='button_url'
                  type='url'
                  value={buttonUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setButtonUrl(newUrl);
                    // Validate that the URL starts with "http://" or "https://"
                    if (newUrl && !/^https?:\/\//i.test(newUrl)) {
                      setUrlError(
                        'URL must start with "http://" or "https://".'
                      );
                    } else {
                      setUrlError('');
                    }
                  }}
                  className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
                  placeholder='https://example.com'
                />
                {urlError && (
                  <p className='mt-1 text-xs text-red-500'>{urlError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-4'>
          <Button
            onClick={() => {
              if (showPreview) {
                setShowConfirmation(true);
              } else {
                generateSplashPage('start_over');
              }
            }}
            disabled={isLoading}
            className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Generate New Page
          </Button>

          {currentHtml && (
            <Button
              onClick={() => generateSplashPage('update')}
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Current Page
            </Button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center my-12'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-xl text-blue-300 loading-dots'>
            Generating your splash page
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
          <div className='w-full h-[500px] bg-white rounded-lg overflow-hidden'>
            <iframe
              srcDoc={currentHtml}
              className='w-full h-full'
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
              This will clear all current progress and start fresh. Are you
              sure?
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
                  // Reset all states
                  setId('');
                  setQuery('');
                  setStyleType('casual');
                  setButtonUrl('');
                  setCurrentHtml('');
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
