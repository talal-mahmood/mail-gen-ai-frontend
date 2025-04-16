'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { toPng, toJpeg } from 'html-to-image';
import gifshot from 'gifshot';

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
  const [ghostText, setGhostText] = useState('');
  const [downloadStates, setDownloadStates] = useState({
    png: false,
    jpeg: false,
    gif: false,
    html: false,
  });

  // Notification system
  const { notification, showNotification, hideNotification } =
    useNotification();

  // Autocomplete state
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Ref for the banner element you want to capture
  const bannerRef = useRef<HTMLDivElement>(null);

  // Minimum input validation function
  const hasMinimumInput = (text: string) => {
    return text.trim().includes(' ') && text.trim().length > 1;
  };

  const fetchAutocomplete = async (query: string) => {
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
      console.error(err);
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
      setGhostText('');
    };
  }, [prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    if (!newValue || !hasMinimumInput(newValue)) {
      setGhostText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (ghostText && e.key === 'Tab') {
      e.preventDefault();
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

    if (
      !processedUrl.startsWith('http://') &&
      !processedUrl.startsWith('https://')
    ) {
      processedUrl = `https://${processedUrl}`;
    }

    if (!processedPrompt) {
      processedPrompt = `Generate a banner for this url: ${processedUrl}`;
    }

    const addCrossOrigin = (htmlString: string) => {
      return htmlString.replace(
        /(<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/[^"]+")/g,
        '$1 crossorigin="anonymous"'
      );
    };

    try {
      const requestData = {
        user_prompt: operation === 'update' ? updatePrompt : prompt,
        width: bannerWidth,
        height: bannerHeight,
        operation: operation,
        website_url: operation === 'update' ? '' : processedUrl,
        previous_banner: operation === 'update' ? bannerHtml : '',
      };

      const response = await callBannerGenerateAPI(requestData);
      const modifiedHtml = addCrossOrigin(response.html);
      setBannerHtml(modifiedHtml);
      setShowPreview(true);
      showNotification(
        'success',
        operation === 'update'
          ? 'Banner updated successfully!'
          : 'Banner generated successfully!'
      );

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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setUrlError('');
  };

  const downloadHtmlFile = () => {
    try {
      // setDownloadStates((prev) => ({ ...prev, html: true }));
      const blob = new Blob([bannerHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `banner-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'HTML file downloaded!');
    } catch (err) {
      console.error('Error downloading HTML:', err);
      showNotification('error', 'Failed to download HTML file');
      // } finally {
      //   setDownloadStates((prev) => ({ ...prev, html: false }));
    }
  };

  const copyHtmlCode = async () => {
    try {
      // Create a temporary textarea element as fallback
      const textarea = document.createElement('textarea');
      textarea.value = bannerHtml;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      // Try modern Clipboard API first
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(bannerHtml);
          showSuccess();
          return;
        } catch (clipboardError) {
          console.log('Clipboard API failed, falling back', clipboardError);
          // Continue to fallback method
        }
      }

      // Fallback for older browsers
      const successful = document.execCommand('copy');
      if (successful) {
        showSuccess();
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      showNotification(
        'error',
        'Copy failed. Please: 1) Use Chrome/Firefox 2) Ensure HTTPS 3) Try manually copying from the code view'
      );

      // Provide manual copy option as last resort
      showManualCopyOption();
    } finally {
      // Clean up
      const textarea = document.querySelector('textarea[style*="opacity: 0"]');
      if (textarea) {
        document.body.removeChild(textarea);
      }
    }
  };

  const showSuccess = () => {
    setCopySuccess('HTML');
    setTimeout(() => setCopySuccess(null), 2000);
    showNotification('success', 'Copied to clipboard!');
  };

  const showManualCopyOption = () => {
    // You could implement a modal showing the code with a selectable textarea
    // Or use your existing notification system to guide the user
  };

  const openPreviewInNewTab = () => {
    const newTab = window.open('');
    if (newTab) {
      newTab.document.write(bannerHtml);
      newTab.document.close();
    }
  };

  // Download PNG or JPEG using html2canvas (static capture)
  const downloadBannerImage = async (format: 'png' | 'jpeg' = 'png') => {
    const bannerContent = document.getElementById('banner-ad-content-wrapper');
    if (!bannerContent) return;

    try {
      // setDownloadStates((prev) => ({ ...prev, [format]: true }));
      // Force-load fonts before capture
      await document.fonts.ready;

      const dataUrl =
        format === 'png'
          ? await toPng(bannerContent, {
              quality: 1,
              backgroundColor: 'transparent',
              pixelRatio: 2,
              cacheBust: true,
              style: {
                color: '#000000 !important',
                mixBlendMode: 'normal !important',
                opacity: '1 !important',
              },
              filter: (node) => {
                // Remove any hidden elements
                if (node instanceof HTMLElement) {
                  return window.getComputedStyle(node).display !== 'none';
                }
                return true;
              },
              // onclone: (clonedElement) => {
              //   // Force visible text styles in clone
              //   clonedElement.style.color = '#000000';
              //   clonedElement.style.opacity = '1';
              //   clonedElement.style.mixBlendMode = 'normal';
              // },
            })
          : await toJpeg(bannerContent, {
              quality: 1,
              backgroundColor: 'transparent',
              pixelRatio: 2,
              cacheBust: true,
              style: {
                color: '#000000 !important',
                mixBlendMode: 'normal !important',
                opacity: '1 !important',
              },
              filter: (node) => {
                // Remove any hidden elements
                if (node instanceof HTMLElement) {
                  return window.getComputedStyle(node).display !== 'none';
                }
                return true;
              },
              // onclone: (clonedElement) => {
              //   clonedElement.style.color = '#000000';
              //   clonedElement.style.opacity = '1';
              //   clonedElement.style.mixBlendMode = 'normal';
              // },
            });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `banner.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting banner:', err);
      showNotification('error', 'Failed to export banner');
      // } finally {
      // setDownloadStates((prev) => ({ ...prev, [format]: false }));
    }
  };

  // Helper function: Capture multiple frames from the banner element
  const captureFrames = async (numFrames = 10, delay = 200) => {
    const bannerContent = document.getElementById('banner-ad-content-wrapper');
    if (!bannerContent) return [];

    const frames: string[] = [];

    // // Create a clone with forced dimensions and styles
    // const clone = bannerContent.cloneNode(true) as HTMLElement;
    // clone.style.position = 'fixed';
    // clone.style.left = '-9999px';
    // clone.style.zIndex = '99999';
    // clone.style.visibility = 'hidden';
    // document.body.appendChild(clone);

    try {
      for (let i = 0; i < numFrames; i++) {
        const dataUrl = await toPng(bannerContent, {
          quality: 1,
          backgroundColor: 'transparent',
          pixelRatio: 2,
          cacheBust: true,
          style: {
            color: '#000000 !important',
            mixBlendMode: 'normal !important',
            opacity: '1 !important',
          },
          filter: (node) => {
            // Remove any hidden elements
            if (node instanceof HTMLElement) {
              return window.getComputedStyle(node).display !== 'none';
            }
            return true;
          },
          // onclone: (clonedElement) => {
          //   // Force visible text styles in clone
          //   clonedElement.style.color = '#000000';
          //   clonedElement.style.opacity = '1';
          //   clonedElement.style.mixBlendMode = 'normal';
          // },
        });
        frames.push(dataUrl);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      // document.body.removeChild(clone);
    }

    return frames;
  };

  // Download animated GIF using gifshot and a series of captured frames
  const downloadBannerGif = async () => {
    if (!bannerRef.current) {
      console.error('No banner element to capture for GIF.');
      return;
    }
    try {
      setDownloadStates((prev) => ({ ...prev, gif: true }));
      // Capture frames (adjust numFrames and delay as needed)
      const frames = await captureFrames(10, 200);

      gifshot.createGIF(
        {
          images: frames,
          gifWidth: bannerWidth,
          gifHeight: bannerHeight,
          interval: 0.1, // Interval between frames in seconds (for playback)
        },
        function (obj: any) {
          if (!obj.error) {
            const image = obj.image;
            const link = document.createElement('a');
            link.href = image;
            link.download = 'banner.gif';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            console.error('Error generating GIF:', obj.error);
            showNotification(
              'error',
              'Failed to export GIF. Please try again.'
            );
          }
        }
      );
    } catch (err) {
      console.error('Error capturing frames for GIF:', err);
      showNotification('error', 'Failed to capture frames for GIF.');
    } finally {
      setDownloadStates((prev) => ({ ...prev, gif: false }));
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
                <p className='mt-1 text-xs text-red-500 [text-shadow:none]'>
                  {urlError}
                </p>
              )}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              <div className='mb-6'>
                <Label className='block mb-2 font-semibold text-blue-300'>
                  Banner Width: {bannerWidth}px
                </Label>
                <Slider
                  value={[bannerWidth]}
                  min={50}
                  max={600}
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
                  max={600}
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
            <p className='text-xl text-blue-300 [text-shadow:none]'>
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
                    onClick={downloadBannerImage.bind(null, 'png')}
                    disabled={downloadStates.png}
                    className='bg-green-600 hover:bg-green-700 transition-all duration-200'
                  >
                    {downloadStates.png ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    PNG
                  </Button>
                </motion.div>

                {/* JPEG Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={downloadBannerImage.bind(null, 'jpeg')}
                    disabled={downloadStates.jpeg}
                    className='bg-blue-600 hover:bg-blue-700 transition-all duration-200'
                  >
                    {downloadStates.jpeg ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    JPEG
                  </Button>
                </motion.div>

                {/* GIF Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={downloadBannerGif}
                    disabled={downloadStates.gif}
                    className='bg-purple-600 hover:bg-purple-700 transition-all duration-200'
                  >
                    {downloadStates.gif ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    GIF
                  </Button>
                </motion.div>

                {/* HTML File Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={downloadHtmlFile}
                    disabled={downloadStates.html}
                    className='bg-pink-600 hover:bg-pink-700 transition-all duration-200'
                  >
                    {downloadStates.html ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    HTML File
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={copyHtmlCode}
                    className='bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 relative'
                  >
                    <Copy className='mr-2 h-4 w-4' /> Copy HTML
                    {copySuccess === 'HTML' && (
                      <motion.span
                        className='absolute inset-0 flex items-center justify-center bg-indigo-700 text-white'
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
                    className='bg-yellow-600 hover:bg-yellow-700 transition-all duration-200'
                  >
                    <ExternalLink className='mr-2 h-4 w-4' /> Open in New Tab
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Banner container (use this element for exporting) */}
            <div
              ref={bannerRef}
              className='m-auto w-full h-full overflow-hidden flex items-center justify-center'
            >
              <div
                id='banner-ad-content-wrapper'
                className='flex items-center justify-center'
                style={{
                  width: `${bannerWidth}px`,
                  height: `${bannerHeight}px`,
                  minWidth: `${bannerWidth}px`,
                  minHeight: `${bannerHeight}px`,
                  maxWidth: `80dvw`,
                  maxHeight: `80dvh`,
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: bannerHtml }} />
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
                      setBannerHtml('');
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
