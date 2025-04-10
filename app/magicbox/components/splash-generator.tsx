'use client';

import type React from 'react';

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
import { Wand2, RefreshCw, Copy, ExternalLink, X } from 'lucide-react';
import { callAutocompleteAPI, callSplashGenerateAPI } from '@/lib/api';
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, useNotification } from '@/components/ui/notification';

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
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Notification system
  const { notification, showNotification, hideNotification } =
    useNotification();

  // Autocomplete state
  const [ghostText, setGhostText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
      const { completion } = await callAutocompleteAPI(query, 0); // service_type 0 for splash
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
      showNotification('error', 'Please enter a description or provide a URL.');
      return;
    }
    if (!processedUrl) {
      showNotification('error', 'Please enter a valid URL.');
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

      showNotification(
        'success',
        operation === 'update'
          ? 'Splash page updated successfully!'
          : 'Splash page created successfully!'
      );

      // Scroll to preview after a short delay
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } catch (error: any) {
      console.error('Error:', error);
      showNotification(
        'error',
        error.message || 'Error connecting to API. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setButtonUrl(newUrl);
    setUrlError('');
  };

  const copyHtmlCode = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentHtml);
        handleCopySuccess();
        return;
      }

      // Fallback for browsers without Clipboard API support
      const textarea = document.createElement('textarea');
      textarea.value = currentHtml;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        // Legacy method for older browsers
        const success = document.execCommand('copy');
        if (!success) throw new Error('execCommand failed');
        handleCopySuccess();
      } finally {
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      handleCopyError(err as Error);
    }
  };

  // Keep your existing success handler
  const handleCopySuccess = () => {
    setCopySuccess('HTML');
    setTimeout(() => setCopySuccess(null), 2000);
    showNotification('success', 'HTML copied to clipboard!');
  };

  // Enhanced error handler
  const handleCopyError = (error: Error) => {
    let errorMessage = 'Failed to copy HTML code. Please try again.';

    // Provide more specific error messages
    if (error.message.includes('execCommand')) {
      errorMessage = 'Your browser requires manual copy (Ctrl+C).';
    } else if (!window.isSecureContext) {
      errorMessage = 'Copy requires HTTPS. Please use a secure connection.';
    }

    showNotification('error', errorMessage);

    // Optional: Show the text in a modal for manual copying
    // showManualCopyFallback(currentHtml);
  };

  const openPreviewInNewTab = () => {
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/splash/${id}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className='space-y-8 mb-4'>
      {/* Notification component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
      />

      {/* User Input Form */}
      <AnimatePresence mode='wait'>
        {!showPreview && !isLoading ? (
          <motion.div
            key='input-form'
            className='glassmorphism p-4 sm:p-8 rounded-xl'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className='w-max small:w-full relative mb-6'>
              <div className='flex small:flex-col flex-row gap-4 small:gap-0 items-center justify-between w-full relative'>
                {/* Tabs */}
                <button
                  onClick={() => setActiveInput('text')}
                  className={`relative z-10 px-4 py-2 transition-all duration-300 w-full sm:w-auto text-center ${
                    activeInput === 'text'
                      ? 'text-blue-400 font-semibold'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Tell us your vision – let&apos;s build it!
                </button>

                {/* OR separator */}
                <div className='text-gray-500 font-medium select-none'>
                  - OR -
                </div>

                <button
                  onClick={() => setActiveInput('url')}
                  className={`relative z-10 px-4 py-2 transition-all duration-300 w-full sm:w-auto text-center ${
                    activeInput === 'url'
                      ? 'text-blue-400 font-semibold'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Just provide a URL — we&apos;ll create from there
                </button>

                {/* Animated underline - only visible on desktop */}
                <div
                  className='absolute bottom-0 h-[2px] bg-blue-400 transition-all duration-300 small:hidden block'
                  style={{
                    left: activeInput === 'text' ? '0%' : 'calc(100% - 353px)',
                    width: activeInput === 'text' ? '275px' : '352px',
                  }}
                ></div>
              </div>
            </div>

            {activeInput === 'text' && (
              <motion.div
                className='mb-6 relative'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  height: {
                    duration: 0.3,
                  },
                  opacity: {
                    duration: 0.2,
                  },
                }}
              >
                {/* <Label
                  htmlFor='query'
                  className='block mb-2 font-semibold text-blue-300'
                >
                  Design your digital happy place – go wild!
                </Label> */}
                <TextareaWithGhost
                  id='prompt'
                  value={query}
                  ghostText={hasMinimumInput(query) ? ghostText : ''}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Describe what you want your page to look like…`}
                  rows={3}
                />
              </motion.div>
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
                  className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200'
                  placeholder='example.com or https://example.com'
                  required
                />
                {urlError && (
                  <p className='mt-1 text-xs text-red-500 [text-shadow:none]'>
                    {urlError}
                  </p>
                )}
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => generateSplashPage('start_over')}
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
              >
                <Wand2 className='mr-2 h-4 w-4' /> Create Splash Page
              </Button>
            </motion.div>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key='loading'
            className='flex flex-col items-center justify-center my-12'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
            <p className='text-xl text-blue-300 [text-shadow:none]'>
              {showPreview ? 'Updating' : 'Generating'} your splash page
              <span className='animate-pulse'>.</span>
              <span
                className='animate-pulse'
                style={{ animationDelay: '0.2s' }}
              >
                .
              </span>
              <span
                className='animate-pulse'
                style={{ animationDelay: '0.4s' }}
              >
                .
              </span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key='edit-form'
            className='glassmorphism p-4 sm:p-8 rounded-xl'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
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

            <div className='flex flex-col sm:flex-row gap-4'>
              <motion.div
                className='flex-1'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => setShowConfirmation(true)}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
                >
                  <Wand2 className='mr-2 h-4 w-4' /> Wipe The Slate Clean
                </Button>
              </motion.div>
              <motion.div
                className='flex-1'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => generateSplashPage('update')}
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300'
                >
                  <RefreshCw className='mr-2 h-4 w-4' /> Update Page
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Section */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            ref={previewRef}
            className='glassmorphism p-4 sm:p-6 rounded-xl'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
              <h2 className='text-2xl font-semibold text-blue-300'>
                Live Preview
              </h2>
              <div className='flex flex-wrap gap-2'>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={copyHtmlCode}
                    className='bg-blue-600 hover:bg-blue-700 transition-all duration-200 relative'
                  >
                    <Copy className='mr-2 h-4 w-4' /> Copy HTML
                    {copySuccess === 'HTML' && (
                      <motion.span
                        className='absolute inset-0 flex items-center justify-center bg-blue-700 text-white'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Copied!
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={openPreviewInNewTab}
                    className='bg-purple-600 hover:bg-purple-700 transition-all duration-200'
                  >
                    <ExternalLink className='mr-2 h-4 w-4' /> Open in New Tab
                  </Button>
                </motion.div>
              </div>
            </div>
            <div className='w-full h-[300px] sm:h-[500px] bg-white rounded-lg'>
              <iframe
                srcDoc={currentHtml}
                className='w-full h-full'
                title='Preview'
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              className='bg-gray-800 p-6 rounded-lg max-w-md w-full'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-center mb-2'>
                <h3 className='text-lg font-semibold text-white'>
                  Clear the Slate?
                </h3>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setShowConfirmation(false)}
                  className='h-8 w-8 rounded-full hover:bg-gray-700'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-gray-300 text-base mb-6 [text-shadow:none]'>
                Poof! All your current work will vanish so you can start
                something brand new. Ready to begin again?
              </p>
              <div className='flex justify-end gap-3'>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant='outline'
                    onClick={() => setShowConfirmation(false)}
                    className='text-red-500 bg-transparent border-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200'
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => {
                      setId('');
                      setQuery('');
                      setStyleType('casual');
                      setButtonUrl('');
                      setCurrentHtml('');
                      setShowPreview(false);
                      setShowConfirmation(false);
                      showNotification(
                        'info',
                        'Started fresh with a clean slate!'
                      );
                    }}
                    className='bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
                  >
                    Confirm
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
