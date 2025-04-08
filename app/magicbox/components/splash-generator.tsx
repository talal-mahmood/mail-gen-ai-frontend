'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { callAutocompleteAPI, callSplashGenerateAPI } from '@/lib/api';
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';

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
  const [activeInput, setActiveInput] = useState<'text' | 'url'>('text');

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
      const { completion } = await callAutocompleteAPI(query, 0); // service_type 2 for blurbs
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
      fetchAutocomplete(query);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      setGhostText(''); // Clear immediately on new input
    };
  }, [query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    // Immediate feedback when input becomes invalid
    if (!newValue || !hasMinimumInput(newValue)) {
      setGhostText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (ghostText && e.key === 'Tab') {
      e.preventDefault();
      // Accept ghost text on Tab
      setQuery(query + ghostText);
      setGhostText('');
    }
  };

  const generateSplashPage = async (operation: 'start_over' | 'update') => {
    let processedUrl = buttonUrl.trim();

    if (activeInput === 'text' && !query.trim()) {
      alert('Please enter a description or provide a URL.');
      return;
    }
    if (!processedUrl) {
      alert('Please enter a valid URL.');
      return;
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

    const finalPrompt =
      activeInput === 'url'
        ? `Create a splash page based on the content from this URL: ${processedUrl}`
        : query;

    const requestData: any = {
      query: finalPrompt,
      style_type: styleType,
      operation,
      button_url: processedUrl,
    };

    if (operation === 'update') {
      requestData.previous_html = currentHtml;
      requestData.id = id;
    }

    try {
      const data = await callSplashGenerateAPI(requestData);
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

  const handleUrlChange = (newUrl: string) => {
    setButtonUrl(newUrl);
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

  const openPreviewInNewTab = () => {
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/splash/${id}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className='space-y-8'>
      {/* User Input Form */}
      {!showPreview && !isLoading ? (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='w-full relative mb-6'>
            <div className='flex gap-4 items-center justify-between w-full relative'>
              {/* Tabs */}
              <button
                onClick={() => setActiveInput('text')}
                className={`relative z-10 px-4 py-2 transition-all duration-300 ${
                  activeInput === 'text'
                    ? 'text-blue-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Tell us your vision – let's build it!
              </button>

              {/* OR separator */}
              <div className='text-gray-500 font-medium select-none'>
                - OR -
              </div>

              <button
                onClick={() => setActiveInput('url')}
                className={`relative z-10 px-4 py-2 transition-all duration-300 ${
                  activeInput === 'url'
                    ? 'text-blue-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Just provide a URL — we'll create from there
              </button>

              {/* Animated underline */}
              <div
                className='absolute bottom-0 h-[2px] bg-blue-400 transition-all duration-300'
                style={{
                  left: activeInput === 'text' ? '0%' : 'calc(100% - 353px)', // 2rem accounts for the gap + OR width
                  width: activeInput === 'text' ? '275px' : '352px',
                }}
              ></div>
            </div>
          </div>

          {activeInput === 'text' && (
            <div className='mb-6 relative'>
              <Label
                htmlFor='query'
                className='block mb-2 font-semibold text-blue-300'
              >
                Design your digital happy place – go wild!
              </Label>
              <TextareaWithGhost
                id='prompt'
                value={query}
                ghostText={hasMinimumInput(query) ? ghostText : ''}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder={`Describe what you want your page to look like…`}
                rows={3}
              />
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div>
              <Label
                htmlFor='style_type'
                className='block mb-2 font-semibold text-blue-300'
              >
                Design Style:
              </Label>
              <Select value={styleType} onValueChange={setStyleType}>
                <SelectTrigger className='w-full p-3 bg-gray-800 border border-gray-600 text-white'>
                  <SelectValue placeholder='Select style' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='casual'>Bold and Flashy</SelectItem>
                  <SelectItem value='professional'>
                    Clean & Corporate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor='button_url'
                className='block mb-2 font-semibold text-blue-300'
              >
                Destination URL:
              </Label>
              <Input
                id='button_url'
                type='url'
                value={buttonUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
                placeholder='example.com or https://example.com'
                required
              />
              {urlError && (
                <p className='mt-1 text-xs text-red-500'>{urlError}</p>
              )}
            </div>
          </div>

          <Button
            onClick={() => generateSplashPage('start_over')}
            disabled={isLoading}
            className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          >
            <Wand2 className='mr-2 h-4 w-4' /> Create Splash Page
          </Button>
        </div>
      ) : (
        <div className='glassmorphism p-8 rounded-xl'>
          <div className='mb-6'>
            <Label className='block mb-2 font-semibold text-blue-300'>
              Refine Your Page
            </Label>
            <TextareaWithGhost
              id='prompt'
              value={query}
              ghostText={hasMinimumInput(query) ? ghostText : ''}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder={`Describe what you want your page to look like…`}
              rows={3}
            />
          </div>

          <div className='flex gap-4'>
            <Button
              onClick={() => setShowConfirmation(true)}
              className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              <Wand2 className='mr-2 h-4 w-4' /> Wipe The Slate Clean
            </Button>
            <Button
              onClick={() => generateSplashPage('update')}
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            >
              <RefreshCw className='mr-2 h-4 w-4' /> Update Page
            </Button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center my-12'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-xl text-blue-300 loading-dots'>
            {showPreview ? 'Updating' : 'Generating'} your splash page
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
          <div className='w-full h-[500px] bg-white rounded-lg'>
            <iframe
              srcDoc={currentHtml}
              className='w-full h-full'
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
              Clear the Slate?
            </h3>
            <p className='text-gray-300 mb-6'>
              Poof! All your current work will vanish so you can start something
              brand new. Ready to begin again?
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
                  setId('');
                  setQuery('');
                  setStyleType('casual');
                  setButtonUrl('');
                  setCurrentHtml('');
                  setShowPreview(false);
                  setShowConfirmation(false);
                }}
                className='bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all'
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
