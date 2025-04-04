'use client';

import { useEffect, useState, useRef } from 'react';
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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      const response = await fetch(
        'http://service.byteb.io:8080/v1/autocomplete/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            service_type: 1,
            style_type: styleType,
          }),
          signal: controller.signal,
        }
      );

      const { completion } = await response.json();
      if (!controller.signal.aborted && completion) {
        setGhostText(completion);
      }
    } catch (err) {
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

  useEffect(() => {
    console.log('id was set to: ', id);
  }, [id]);

  const generateSplashPage = async (operation: 'start_over' | 'update') => {
    let processedUrl = buttonUrl.trim();

    if (!query.trim()) {
      alert('Please enter a description of what you want to create.');
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

    const requestData: any = {
      query,
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

  // Update URL input handler to remove previous validation
  const handleUrlChange = (newUrl: string) => {
    setButtonUrl(newUrl);
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
            placeholder='Describe what you want your banner to look like...'
            rows={3}
          />
          <p className='mt-1 text-xs text-gray-400'>
            Press <kbd>Tab</kbd> to accept suggestion
          </p>
        </div>

        {!showPreview && (
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
              <div>
                <Label
                  htmlFor='button_url'
                  className='block mb-2 font-semibold text-blue-300'
                >
                  Got a link? Drop it here (optional):
                </Label>
                <Input
                  id='button_url'
                  type='url'
                  value={buttonUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  // onChange={(e) => {
                  //   const newUrl = e.target.value;
                  //   setButtonUrl(newUrl);
                  //   // Validate that the URL starts with "http://" or "https://"
                  //   if (newUrl && !/^https?:\/\//i.test(newUrl)) {
                  //     setUrlError(
                  //       'URL must start with "http://" or "https://".'
                  //     );
                  //   } else {
                  //     setUrlError('');
                  //   }
                  // }}
                  className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500'
                  placeholder='example.com or https://example.com'
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
            <Wand2 className='mr-2 h-4 w-4' /> Fire Up the Page Machine
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
