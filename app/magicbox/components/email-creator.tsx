'use client';

import { useState } from 'react';
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
import { callEmailGenerateAPI } from '@/lib/api';
import { formatEmailContent } from '@/lib/utils';

export default function EmailCreator() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [emailType, setEmailType] = useState('marketing');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const generateEmail = async (operation: 'start_over' | 'update') => {
    alert(operation);
    if (!prompt.trim()) {
      alert('Please enter a description of what you want to create.');
      return;
    }

    setIsLoading(true);
    setShowPreview(false);

    const requestData = {
      prompt: prompt,
      website_url: url,
      operation: operation === 'update' ? 'refine' : 'generate',
      previous_email: operation === 'update' ? currentHtml : '',
    };
    console.log(requestData);
    try {
      const data = await callEmailGenerateAPI(requestData);

      // Convert plain text email to basic HTML format
      const htmlOutput = formatEmailContent(data);

      setCurrentHtml(htmlOutput);
      setShowPreview(true);
      setPrompt('');
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
  const copyPlainText = () => {
    const tempEl = document.createElement('div');
    tempEl.innerHTML = currentHtml;
    const plainText = tempEl.innerText;

    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        alert('Plain text copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy plain text: ', err);
        alert('Failed to copy email content. Please try again.');
      });
  };

  const openPreviewInNewTab = () => {
    const newTab = window.open('');
    if (newTab) {
      newTab.document.write(currentHtml);
      newTab.document.close();
    }
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
            What kind of email do you want to create?
          </Label>
          <Textarea
            id='prompt'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
            placeholder='Describe the purpose and content of your email...'
            rows={3}
          />
        </div>
        {/* <div className='mb-6'>
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
        </div> */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          <div>
            <Label
              htmlFor='email_type'
              className='block mb-2 font-semibold text-blue-300'
            >
              Email Type:
            </Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className='w-full p-3 bg-gray-800 border border-gray-600 text-white'>
                <SelectValue placeholder='Select email type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='marketing'>Marketing</SelectItem>
                <SelectItem value='newsletter'>Newsletter</SelectItem>
                <SelectItem value='transactional'>Transactional</SelectItem>
                <SelectItem value='welcome'>Welcome</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
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

          {/* <div>
            <Label
              htmlFor='subject'
              className='block mb-2 font-semibold text-blue-300'
            >
              Email Subject:
            </Label>
            <Input
              id='subject'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='Enter email subject line'
            />
          </div> */}
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <Button
            onClick={() => generateEmail('start_over')}
            disabled={isLoading}
            className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Generate New Email
          </Button>

          {currentHtml && (
            <Button
              onClick={() => generateEmail('update')}
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Current Email
            </Button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center my-12'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-xl text-blue-300 loading-dots'>
            Generating your email
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
                onClick={copyPlainText}
                className='bg-green-600 hover:bg-green-700'
              >
                <Copy className='mr-2 h-4 w-4' /> Copy Plain Text
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
          <div className='w-full h-[500px] bg-white rounded-lg overflow-hidden'>
            <iframe
              srcDoc={currentHtml}
              className='w-full h-full'
              title='Preview'
            />
          </div>
        </div>
      )}
    </div>
  );
}
