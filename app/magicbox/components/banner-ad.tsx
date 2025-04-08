'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Wand2,
  RefreshCw,
  Copy,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';
import { callBannerGenerateAPI, callAutocompleteAPI } from '@/lib/api';
import { Slider } from '@/components/ui/slider';
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, useNotification } from '@/components/ui/notification';

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
      const { completion } = await callAutocompleteAPI(query, 2); // service_type 2 for banners
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

  const generateBanner = async (operation: 'start_over' | 'update') => {
    let processedPrompt = prompt.trim();
    let processedUrl = url.trim();

    if (!processedUrl) {
      showNotification('error', 'Please enter a valid URL.');
      return;
    }

    setIsLoading(true);
    setShowPreview(false);
    setUrlError('');

    // Add HTTPS if no protocol exists
    if (
      !processedUrl.startsWith('http://') &&
      !processedUrl.startsWith('https://')
    ) {
      processedUrl = `https://${processedUrl}`;
    }

    if (!processedPrompt) {
      processedPrompt = `Generate a banner for this url: ${processedUrl}`;
    }

    try {
      const requestData = {
        user_prompt: operation === 'update' ? updatePrompt : prompt,
        width: bannerWidth,
        height: bannerHeight,
        operation: operation,
        website_url: processedUrl,
        previous_banner: operation === 'update' ? bannerHtml : '',
      };

      const response = await callBannerGenerateAPI(requestData);
      setBannerHtml(response.html);
      setShowPreview(true);
      showNotification(
        'success',
        operation === 'update'
          ? 'Banner updated successfully!'
          : 'Banner generated successfully!'
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
        error.message || 'Error generating banner. Please try again.'
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

  const copyHtmlCode = () => {
    navigator.clipboard
      .writeText(bannerHtml)
      .then(() => {
        setCopySuccess('HTML');
        setTimeout(() => setCopySuccess(null), 2000);
        showNotification('success', 'HTML copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        showNotification(
          'error',
          'Failed to copy HTML code. Please try again.'
        );
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
    showNotification(
      'info',
      'Download functionality would be implemented here'
    );
  };

  return (
    <div className='space-y-8'>
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
            <div className='mb-6 relative'>
              <Label
                htmlFor='prompt'
                className='block mb-2 font-semibold text-blue-300'
              >
                Describe your banner (Optional)
              </Label>

              <TextareaWithGhost
                id='prompt'
                value={prompt}
                ghostText={hasMinimumInput(prompt) ? ghostText : ''}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your pitch or promo — we'll blurbify it..."
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
                onChange={(e) => handleUrlChange(e.target.value)}
                className='w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200'
                placeholder='example.com or https://example.com'
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
                  min={50}
                  max={2000}
                  step={10}
                  onValueChange={(value) => setBannerHeight(value[0])}
                  className='py-4'
                />
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => generateBanner('start_over')}
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
              >
                <Wand2 className='mr-2 h-4 w-4' /> Generate New Banner
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
            <p className='text-xl text-blue-300'>
              Generating your banner
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
                Update Banner Content
              </Label>
              <Textarea
                value={updatePrompt}
                onChange={(e) => setUpdatePrompt(e.target.value)}
                className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200'
                placeholder='Enter updated instructions for the banner...'
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
                  <Wand2 className='mr-2 h-4 w-4' /> Generate New Banner
                </Button>
              </motion.div>
              <motion.div
                className='flex-1'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => generateBanner('update')}
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300'
                >
                  <RefreshCw className='mr-2 h-4 w-4' /> Update Banner
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
                    onClick={downloadBanner}
                    className='bg-green-600 hover:bg-green-700 transition-all duration-200'
                  >
                    <Download className='mr-2 h-4 w-4' /> Download
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
            <div
              className={`w-full bg-white rounded-lg overflow-auto h-[300px] sm:h-[500px]`}
            >
              <iframe
                srcDoc={bannerHtml}
                className={`w-full h-full m-auto p-2`}
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
              <p className='text-gray-300 mb-6'>
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
                      setBannerHtml('');
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
