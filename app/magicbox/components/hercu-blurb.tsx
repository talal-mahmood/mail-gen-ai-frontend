'use client';
import { useState, useRef, useEffect } from 'react';
import type React from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, RefreshCw, Copy, ExternalLink, X } from 'lucide-react';
import { callBlurbGenerateAPI, callAutocompleteAPI } from '@/lib/api';
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, useNotification } from '@/components/ui/notification';

export default function HercuBlurbTab({ config }: { config: any }) {
  useEffect(() => {
    console.log('The config is: ', config);
  }, [config]);
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [activeInput, setActiveInput] = useState<'text' | 'url'>('text');
  const [updatePrompt, setUpdatePrompt] = useState('');
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
        showNotification(
          'error',
          'Please enter a description of what you want to create.'
        );
        return;
      }
      if (!processedUrl) {
        showNotification('error', 'Please enter a valid URL.');
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
      website_url: isUpdate ? '' : processedUrl,
      operation: isUpdate ? 'update' : 'start_over',
      previous_blurb: isUpdate ? currentHtml : '',
    };

    try {
      const data = await callBlurbGenerateAPI(requestData);
      setCurrentHtml(data.html);
      setShowPreview(true);
      if (!isUpdate) setPrompt('');
      setUpdatePrompt('');

      showNotification(
        'success',
        isUpdate ? 'Blurb updated successfully!' : 'Blurb created successfully!'
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

  // Update URL input handler to remove previous validation
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Clear any previous error state
    setUrlError('');
  };

  const copyHtmlCode = async () => {
    try {
      // Fallback 1: Modern Clipboard API (works in HTTPS contexts)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(currentHtml);
          handleCopySuccess();
          return;
        } catch (clipboardError) {
          console.log('Clipboard API failed, trying fallback', clipboardError);
          // Continue to fallback methods
        }
      }

      // Fallback 2: document.execCommand (legacy method)
      const textarea = createTempTextarea(currentHtml);
      try {
        const success = document.execCommand('copy');
        if (success) {
          handleCopySuccess();
        } else {
          throw new Error('execCommand copy failed');
        }
      } finally {
        removeTempTextarea(textarea);
      }
    } catch (err) {
      console.error('All copy methods failed:', err);
      handleCopyFailure();
    }
  };

  // Helper functions
  const createTempTextarea = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    return textarea;
  };

  const removeTempTextarea = (textarea: HTMLTextAreaElement) => {
    if (textarea && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  };

  const handleCopySuccess = () => {
    setCopySuccess('HTML');
    setTimeout(() => setCopySuccess(null), 2000);
    showNotification('success', 'Copied to clipboard!');
  };

  const handleCopyFailure = () => {
    showNotification(
      'error',
      'Copy failed. Please: 1) Use Chrome/Firefox 2) Ensure HTTPS 3) Try manual copy'
    );

    // Optional: Show the HTML in a modal for manual copying
    // showManualCopyModal(currentHtml);
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
      .then(() => {
        setCopySuccess('Text');
        setTimeout(() => setCopySuccess(null), 2000);
        showNotification('success', 'Plain text copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        showNotification('error', 'Failed to copy text. Please try again.');
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
    <div className='space-y-8 mb-4'>
      {/* Notification component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
      />

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
                  {config.heading || `Describe your offer, we'll blurb it up!`}
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
                  {config.subheading || `Give us a link — we'll do the rest`}
                </button>
              </div>

              {/* Animated underline - only visible on desktop */}
              <div
                className='absolute bottom-0 h-[2px] bg-blue-400 transition-all duration-300 small:hidden block'
                style={{
                  left: activeInput === 'text' ? '0%' : 'calc(100% - 264px)',
                  width: activeInput === 'text' ? '300px' : '264px',
                }}
              ></div>
            </div>

            {activeInput === 'text' && (
              <motion.div
                className='mb-6'
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
                <TextareaWithGhost
                  id='prompt'
                  value={prompt}
                  ghostText={hasMinimumInput(prompt) ? ghostText : ''}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    config.placeholder ||
                    `Type your pitch or promo — we'll blurbify it...`
                  }
                  rows={3}
                />
              </motion.div>
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

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => generateBlurb('start_over')}
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
              >
                <Wand2 className='mr-2 h-4 w-4' /> Create My Blurb
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
              {showPreview ? 'Updating' : 'Generating'} your blurb
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
                Update Blurb Content
              </Label>
              <Textarea
                value={updatePrompt}
                onChange={(e) => setUpdatePrompt(e.target.value)}
                className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200'
                placeholder='Enter updated instructions for the blurb...'
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
                  <Wand2 className='mr-2 h-4 w-4' /> Generate New Blurb
                </Button>
              </motion.div>
              <motion.div
                className='flex-1'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => generateBlurb('update')}
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300'
                >
                  <RefreshCw className='mr-2 h-4 w-4' /> Update Blurb
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
                    onClick={copyPlainText}
                    className='bg-green-600 hover:bg-green-700 transition-all duration-200 relative'
                  >
                    <Copy className='mr-2 h-4 w-4' /> Copy Plain Text
                    {copySuccess === 'Text' && (
                      <motion.span
                        className='absolute inset-0 flex items-center justify-center bg-green-700 text-white'
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
            <div className='m-auto w-[257.328px] h-[720px] flex items-center justify-center overflow-hidden'>
              <div
                id='blurb-content-wrapper'
                className='flex items-center justify-center'
                style={{
                  width: '257.328px',
                  height: '450.961px',
                  minWidth: '257.328px',
                  minHeight: '450.961px',
                  // transform: `scale(${Math.min(
                  //   1,
                  //   (300 / bannerHeight) * 0.95, // 5% safety margin
                  //   ((window.innerWidth * 0.8) / bannerWidth) * 0.95
                  // )})`,
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: currentHtml }} />
              </div>
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
                      setPrompt('');
                      setUrl('');
                      setUpdatePrompt('');
                      setCurrentHtml('');
                      setShowPreview(false);
                      setShowConfirmation(false);
                      showNotification(
                        'info',
                        'Started fresh with a clean slate!'
                      );
                    }}
                    className='bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 
                    transition-all duration-300'
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
