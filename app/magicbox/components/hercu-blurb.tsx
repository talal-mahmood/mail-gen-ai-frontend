'use client';
import { useState, useRef, useEffect } from 'react'; // Added useRef and useEffect
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { callBlurbGenerateAPI, callAutocompleteAPI } from '@/lib/api'; // Added callAutocompleteAPI
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';

export default function HercuBlurbTab() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [activeInput, setActiveInput] = useState<'text' | 'url'>('text');
  const [updatePrompt, setUpdatePrompt] = useState('');

  // Autocomplete state
  const [ghostText, setGhostText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check 1: At least one word + space entered
  const hasMinimumInput = (text: string) => {
    return text.trim().includes(' ') && text.trim().length > 1;
  };

  const fetchAutocomplete = async (query: string) => {
    // Check 2: Don't show suggestions for empty input
    if (!query || !hasMinimumInput(query)) {
      setGhostText('');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { completion } = await callAutocompleteAPI(query, 2); // service_type 2 for blurbs
      if (!controller.signal.aborted && completion) {
        setGhostText(completion);
      }
    } catch (err) {
      console.log(err);
      if (!controller.signal.aborted) {
        setGhostText('');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAutocomplete(prompt);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      setGhostText(''); // Clear immediately on new input
    };
  }, [prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);

    // Immediate feedback when input becomes invalid
    if (!newValue || !hasMinimumInput(newValue)) {
      setGhostText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (ghostText && e.key === 'Tab') {
      e.preventDefault();
      // Accept ghost text on Tab
      setPrompt(prompt + ghostText);
      setGhostText('');
    }
  };

  const generateBlurb = async (operation: 'start_over' | 'update') => {
    const isUpdate = operation === 'update';
    const currentPrompt = isUpdate ? updatePrompt : prompt;
    let processedUrl = url.trim();

    if (!isUpdate) {
      if (activeInput === 'text' && !currentPrompt.trim()) {
        alert('Please enter a description of what you want to create.');
        return;
      }
      if (!processedUrl) {
        alert('Please enter a valid URL.');
        return;
      }
    }

    setIsLoading(true);
    setShowPreview(false);

    // Add HTTPS if no protocol exists
    if (
      !processedUrl.startsWith('http://') &&
      !processedUrl.startsWith('https://')
    ) {
      processedUrl = `https://${processedUrl}`;
    }

    const finalPrompt = isUpdate
      ? currentPrompt
      : activeInput === 'url'
      ? `Create a blurb based on the content from this URL: ${url}`
      : prompt;

    const requestData = {
      prompt: finalPrompt,
      website_url: processedUrl,
      operation: isUpdate ? 'update' : 'start_over',
      previous_blurb: isUpdate ? currentHtml : '',
    };

    try {
      const data = await callBlurbGenerateAPI(requestData);
      setCurrentHtml(data.html);
      setShowPreview(true);
      if (!isUpdate) setPrompt('');
      setUpdatePrompt('');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error connecting to API. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update URL input handler to remove previous validation
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Clear any previous error state
    setUrlError('');
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
    // Parse the HTML string into a document
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');

    // Remove all <style> elements and any external stylesheet links
    doc
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((el) => el.remove());

    // Optionally, remove inline style attributes if needed:
    doc
      .querySelectorAll('[style]')
      .forEach((el) => el.removeAttribute('style'));

    // Extract plain text from the body (or the whole document as fallback)
    const plainText = doc.body
      ? doc.body.innerText
      : doc.documentElement.innerText;

    // Copy the plain text to clipboard
    navigator.clipboard
      .writeText(plainText)
      .then(() => alert('Plain text copied to clipboard!'))
      .catch((err) => console.error('Failed to copy:', err));
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
      {!showPreview && !isLoading ? (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='w-full relative mb-6'>
            <div className='flex gap-4'>
              <button
                onClick={() => setActiveInput('text')}
                className={`relative z-10 px-4 py-2 transition-all duration-300 ${
                  activeInput === 'text'
                    ? 'text-blue-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Describe your offer, we’ll blurb it up!
              </button>
              <button
                onClick={() => setActiveInput('url')}
                className={`relative z-10 px-4 py-2 transition-all duration-300 ${
                  activeInput === 'url'
                    ? 'text-blue-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Give us a link — we’ll do the rest
              </button>
            </div>

            {/* Animated underline */}
            <div
              className='absolute bottom-0 left-0 h-[2px] bg-blue-400 transition-all duration-300'
              style={{
                width: activeInput === 'text' ? '300px' : '284px',
                transform: `translateX(${
                  activeInput === 'text' ? '0' : 'calc(300px)'
                })`,
              }}
            ></div>
          </div>

          {activeInput === 'text' && (
            <div className='mb-6'>
              <TextareaWithGhost
                id='prompt'
                value={prompt}
                ghostText={hasMinimumInput(prompt) ? ghostText : ''}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                placeholder='Type your pitch or promo — we’ll blurbify it...'
                rows={3}
              />
            </div>
          )}

          <div className='mb-6'>
            <Label className='block mb-2 font-semibold text-blue-300'>
              {activeInput === 'text'
                ? 'The URL that your button or link will direct to:'
                : ''}
            </Label>
            <Input
              type='url'
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              // onChange={(e) => {
              //   const newUrl = e.target.value;
              //   setUrl(newUrl);
              //   setUrlError(
              //     newUrl && !/^https?:\/\//i.test(newUrl)
              //       ? 'URL must start with "http://" or "https://"'
              //       : ''
              //   );
              // }}
              className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='example.com or https://example.com'
              required
            />
            {urlError && (
              <p className='mt-1 text-xs text-red-500'>{urlError}</p>
            )}
          </div>

          <Button
            onClick={() => generateBlurb('start_over')}
            disabled={isLoading}
            className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Create My Blurb
          </Button>
        </div>
      ) : (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='mb-6'>
            <Label className='block mb-2 font-semibold text-blue-300'>
              Update Blurb Content
            </Label>
            <Textarea
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
              placeholder='Enter updated instructions for the blurb...'
              rows={3}
            />
          </div>

          <div className='flex gap-4'>
            <Button
              onClick={() => setShowConfirmation(true)}
              className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              <Wand2 className='mr-2 h-4 w-4' /> Generate New Blurb
            </Button>
            <Button
              onClick={() => generateBlurb('update')}
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Blurb
            </Button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center my-12'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-xl text-blue-300 loading-dots'>
            {showPreview ? 'Updating' : 'Generating'} your blurb
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
          <div
            className={`w-full bg-white rounded-lg overflow-scroll h-[500px] `}
          >
            <iframe
              srcDoc={currentHtml}
              className={`w-full h-full m-auto p-1`}
              title='Preview'
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
