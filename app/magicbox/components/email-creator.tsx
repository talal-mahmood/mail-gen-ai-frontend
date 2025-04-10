'use client';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wand2,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  ImageIcon,
} from 'lucide-react';
import { callEmailGenerateAPI, callAutocompleteAPI } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TextareaWithGhost } from '@/components/TextAreaWithGhost';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, useNotification } from '@/components/ui/notification';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

export default function EmailCreator() {
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [activeInput, setActiveInput] = useState<'text' | 'url'>('text');
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [styleType, setStyleType] = useState('casual');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Pexels API integration
  const [pexelsApiKey, setPexelsApiKey] = useState('');
  const [showPexelsSection, setShowPexelsSection] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const imagesPerPage = 12;

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
      const { completion } = await callAutocompleteAPI(query, 1, styleType); // service_type 1 for emails
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
    if (pexelsKey) {
      setPexelsApiKey(pexelsKey);
      console.log('pexelsKey is: ', pexelsKey);
    } else {
      console.log('pexelsKey not found');
    }
  }, []); // Added styleType as dependency

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAutocomplete(prompt);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      setGhostText(''); // Clear immediately on new input
    };
  }, [prompt, styleType]); // Added styleType as dependency

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

  const searchPexelsImages = async (page = 1) => {
    if (!pexelsApiKey || !imageSearchQuery.trim()) {
      showNotification(
        'error',
        'Please enter both an API key and a search term'
      );
      return;
    }

    setIsSearching(true);
    setCurrentPage(page);

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          imageSearchQuery
        )}&per_page=${imagesPerPage}&page=${page}`,
        {
          headers: {
            Authorization: pexelsApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch images. Please check your API key.');
      }

      const data = await response.json();
      setSearchResults(data.photos || []);
      setTotalPages(Math.ceil(data.total_results / imagesPerPage) || 1);

      if (data.photos.length === 0) {
        showNotification('info', 'No images found for your search term');
      }
    } catch (error: any) {
      console.error('Pexels API error:', error);
      showNotification('error', error.message || 'Error searching for images');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleImageSelection = (image: any) => {
    if (selectedImages.some((img) => img.id === image.id)) {
      // Remove image if already selected
      setSelectedImages(selectedImages.filter((img) => img.id !== image.id));
    } else {
      // Add image if not already selected (max 3)
      if (selectedImages.length < 3) {
        setSelectedImages([...selectedImages, image]);
      } else {
        showNotification('warning', 'You can only select up to 3 images');
      }
    }
  };

  const isImageSelected = (imageId: number) => {
    return selectedImages.some((img) => img.id === imageId);
  };

  const generateEmail = async (operation: 'start_over' | 'update') => {
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
      // Process and validate URL
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
      ? `Create an email based on the content from this URL: ${url}`
      : prompt;

    // Prepare selected images data for the API
    const selectedImagesData = selectedImages.map((img) => ({
      // id: img.id,
      url: img.src.medium,
      alt: img.alt,
      // photographer: img.photographer,
      // photographer_url: img.photographer_url,
    }));

    const requestData = {
      prompt: finalPrompt,
      website_url: processedUrl,
      operation: isUpdate ? 'refine' : 'generate',
      previous_email: isUpdate ? currentHtml : '',
      email_style: styleType,
      image_urls: selectedImagesData,
    };

    try {
      const data = await callEmailGenerateAPI(requestData);
      setCurrentHtml(data.email);
      setShowPreview(true);
      if (!isUpdate) setPrompt('');
      setUpdatePrompt('');

      // Scroll to preview after a short delay
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);

      showNotification(
        'success',
        isUpdate
          ? 'Email updated successfully!'
          : 'Email generated successfully!'
      );
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
      // Modern Clipboard API (primary method)
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentHtml);
        handleCopySuccess();
        return;
      }

      // Fallback method for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = currentHtml;
      textarea.style.position = 'fixed'; // Prevent scrolling
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        // Legacy execCommand method
        const success = document.execCommand('copy');
        if (!success) throw new Error('execCommand failed');
        handleCopySuccess();
      } finally {
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      handleCopyFailure();
    }
  };

  // Success handler (same as your original)
  const handleCopySuccess = () => {
    setCopySuccess('HTML');
    setTimeout(() => setCopySuccess(null), 2000);
    showNotification('success', 'HTML copied to clipboard!');
  };

  // Enhanced error handler
  const handleCopyFailure = () => {
    showNotification(
      'error',
      `Failed to copy. ${
        isSecureContext()
          ? 'Try manually copying.'
          : 'Ensure you&apos;re on HTTPS.'
      }`
    );

    // Optional: Provide manual copy option
    // You could show a modal with the HTML content here
  };

  // Helper to check secure context
  const isSecureContext = () => {
    return window.isSecureContext || location.protocol === 'https:';
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
                  Tell us your pitch – let&apos;s make email gold!
                </button>

                {/* OR separator (optional) */}
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
                  Just give us the link — we&apos;ll take it from there
                </button>

                {/* Animated underline - only visible on desktop */}
                <div
                  className='absolute bottom-0 h-[2px] bg-blue-400 transition-all duration-300 small:hidden block'
                  style={{
                    left: activeInput === 'text' ? '0%' : 'calc(100% - 360px)',
                    width: activeInput === 'text' ? '336px' : '356px',
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
                <TextareaWithGhost
                  id='prompt'
                  value={prompt}
                  ghostText={hasMinimumInput(prompt) ? ghostText : ''}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your promo or paste your ad. We'll sprinkle AI magic on it..."
                  rows={3}
                />

                {/* Pexels Image Selection */}
                {styleType === 'casual' && (
                  <AnimatePresence>
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
                      <div className='mt-4 space-y-3'>
                        {/* Collapsible Search Section */}
                        <Collapsible
                          open={showPexelsSection}
                          onOpenChange={setShowPexelsSection}
                          className='w-full border border-gray-700 rounded-lg overflow-hidden'
                        >
                          <CollapsibleTrigger className='flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors'>
                            <div className='flex items-center gap-2'>
                              <div className='bg-blue-500/20 p-2 rounded-full'>
                                <Search className='h-5 w-5 text-blue-400' />
                              </div>
                              <span className='font-medium text-blue-300'>
                                {selectedImages.length > 0
                                  ? 'Modify Image Selection'
                                  : 'Add Images from Pexels'}
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              {selectedImages.length > 0 && (
                                <span className='text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full'>
                                  {selectedImages.length} selected
                                </span>
                              )}
                              {showPexelsSection ? (
                                <ChevronUp className='h-4 w-4 text-blue-300' />
                              ) : (
                                <ChevronDown className='h-4 w-4 text-blue-300' />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className='p-4 bg-gray-800 space-y-6'>
                            {/* API Key Section */}
                            {/* <div className='bg-gray-900/50 p-4 rounded-lg'>
                        <Label className='block mb-2 font-semibold text-blue-300'>
                          Pexels API Key
                        </Label>
                        <div className='flex gap-2'>
                          <Input
                            type='password'
                            value={pexelsApiKey}
                            onChange={(e) => setPexelsApiKey(e.target.value)}
                            className='flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white'
                            placeholder='Enter your Pexels API key'
                          />
                          <Button
                            onClick={() =>
                              window.open(
                                'https://www.pexels.com/api/',
                                '_blank'
                              )
                            }
                            variant='outline'
                            className='whitespace-nowrap border-none text-white hover:text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300'
                          >
                            <ExternalLink />
                            Get API Key
                          </Button>
                        </div>
                      </div> */}

                            {/* Search Section */}
                            <div className='bg-gray-900/50 p-4 rounded-lg'>
                              <Label className='block mb-2 font-semibold text-blue-300'>
                                Search Images
                              </Label>
                              <div className='flex gap-2'>
                                <Input
                                  type='text'
                                  value={imageSearchQuery}
                                  onChange={(e) =>
                                    setImageSearchQuery(e.target.value)
                                  }
                                  className='flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white'
                                  placeholder='Search for images...'
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' && searchPexelsImages(1)
                                  }
                                />
                                <Button
                                  onClick={() => searchPexelsImages(1)}
                                  disabled={isSearching}
                                  className='whitespace-nowrap border-none text-white hover:text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
                                >
                                  {isSearching ? (
                                    <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                  ) : (
                                    <>
                                      <Search className='h-4 w-4 mr-2' /> Search
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                              <div>
                                <div className='flex items-center justify-between mb-3'>
                                  <Label className='font-semibold text-blue-300'>
                                    Search Results
                                  </Label>
                                  <span className='text-xs text-gray-400'>
                                    {selectedImages.length === 3 ? (
                                      <span className='text-yellow-400'>
                                        Maximum images selected (3)
                                      </span>
                                    ) : (
                                      <span>
                                        Click to select (up to 3 images)
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-3 rounded-lg bg-gray-900/50'>
                                  {searchResults.map((image) => {
                                    const isSelected = isImageSelected(
                                      image.id
                                    );
                                    return (
                                      <div
                                        key={image.id}
                                        onClick={() =>
                                          toggleImageSelection(image)
                                        }
                                        className={`relative cursor-pointer rounded-md overflow-hidden aspect-video transition-all duration-200 transform ${
                                          isSelected
                                            ? 'ring-2 ring-blue-500 scale-95 opacity-80'
                                            : 'hover:ring-1 hover:ring-blue-400/50 hover:scale-[0.98]'
                                        } ${
                                          selectedImages.length >= 3 &&
                                          !isSelected
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                        }`}
                                      >
                                        <img
                                          src={
                                            image.src.medium ||
                                            '/placeholder.svg'
                                          }
                                          alt={image.alt}
                                          className='w-full h-full object-cover'
                                        />
                                        <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-2'>
                                          <p className='text-xs text-white truncate'>
                                            {image.alt || 'Image'}
                                          </p>
                                          <p className='text-xs text-gray-300'>
                                            By {image.photographer}
                                          </p>
                                        </div>
                                        {isSelected && (
                                          <div className='absolute inset-0 flex items-center justify-center bg-blue-500/20'>
                                            <div className='bg-blue-500 rounded-full p-1'>
                                              <Check className='h-4 w-4 text-white' />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                  <div className='mt-4 flex justify-center'>
                                    <Pagination>
                                      <PaginationContent>
                                        <PaginationItem>
                                          <PaginationPrevious
                                            onClick={() =>
                                              searchPexelsImages(
                                                Math.max(1, currentPage - 1)
                                              )
                                            }
                                            className={
                                              currentPage === 1
                                                ? 'pointer-events-none opacity-50'
                                                : '' + ' cursor-pointer'
                                            }
                                          />
                                        </PaginationItem>

                                        {Array.from(
                                          { length: Math.min(5, totalPages) },
                                          (_, i) => {
                                            // Show pages around current page
                                            let pageNum;
                                            if (totalPages <= 5) {
                                              pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                              pageNum = i + 1;
                                            } else if (
                                              currentPage >=
                                              totalPages - 2
                                            ) {
                                              pageNum = totalPages - 4 + i;
                                            } else {
                                              pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                              <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                  onClick={() =>
                                                    searchPexelsImages(pageNum)
                                                  }
                                                  isActive={
                                                    currentPage === pageNum
                                                  }
                                                  className={`cursor-pointer bg-gray-900 hover:text-black ${
                                                    currentPage === pageNum &&
                                                    'bg-white text-black'
                                                  }`}
                                                >
                                                  {pageNum}
                                                </PaginationLink>
                                              </PaginationItem>
                                            );
                                          }
                                        )}

                                        <PaginationItem>
                                          <PaginationNext
                                            onClick={() =>
                                              searchPexelsImages(
                                                Math.min(
                                                  totalPages,
                                                  currentPage + 1
                                                )
                                              )
                                            }
                                            className={
                                              currentPage === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : '' + ' cursor-pointer'
                                            }
                                          />
                                        </PaginationItem>
                                      </PaginationContent>
                                    </Pagination>
                                  </div>
                                )}

                                <div className='mt-3 flex items-center justify-center'>
                                  <p className='text-xs text-gray-400'>
                                    Images provided by{' '}
                                    <a
                                      href='https://www.pexels.com'
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-400 hover:underline'
                                    >
                                      Pexels
                                    </a>
                                  </p>
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                        {/* Selected Images - Always Visible */}
                        {selectedImages.length > 0 && (
                          <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30 animate-in fade-in duration-300'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                <div className='bg-blue-500/20 p-1.5 rounded-full'>
                                  <ImageIcon className='h-4 w-4 text-blue-400' />
                                </div>
                                <Label className='font-semibold text-blue-300'>
                                  Selected Images ({selectedImages.length}/3)
                                </Label>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setSelectedImages([])}
                                className='text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20'
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className='flex gap-3 overflow-x-auto pb-2 snap-x'>
                              {selectedImages.map((image) => (
                                <div
                                  key={image.id}
                                  className='relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden group snap-start border border-blue-500/50'
                                >
                                  <img
                                    src={image.src.medium || '/placeholder.svg'}
                                    alt={image.alt}
                                    className='w-full h-full object-cover'
                                  />
                                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2'>
                                    <p className='text-xs text-white truncate'>
                                      {image.alt || 'Image'}
                                    </p>
                                    <p className='text-xs text-gray-300'>
                                      By {image.photographer}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleImageSelection(image)}
                                    className='absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                  >
                                    <X className='h-3 w-3 text-white' />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            )}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-end'>
              <div className='mb-6'>
                <Label className='block mb-2 font-semibold text-blue-300'>
                  Pick Your Email Vibe
                </Label>
                <Select value={styleType} onValueChange={setStyleType}>
                  <SelectTrigger className='w-full p-3 bg-gray-800 border border-gray-600 text-white'>
                    <SelectValue placeholder='Select style' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='casual'>
                      Bold & Flashy Marketing Magic - more likely to land in
                      Gmail&apos;s Promotions inbox
                    </SelectItem>
                    <SelectItem value='professional'>
                      Cozy & Personal human tone - better chance of landing in
                      Gmail&apos;s Primary inbox
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='mb-6'>
                <Label className='block mb-2 font-semibold text-blue-300'>
                  {activeInput === 'text'
                    ? 'Link destination — where are we sending folks?'
                    : 'URL'}
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
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => generateEmail('start_over')}
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
              >
                <Wand2 className='mr-2 h-4 w-4' /> Launch the Email Magic!
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
              {showPreview ? 'Updating' : 'Generating'} your email
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
                Fine Tune It
              </Label>
              <Textarea
                value={updatePrompt}
                onChange={(e) => setUpdatePrompt(e.target.value)}
                className='w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200'
                placeholder='Tweak it, twist it, transform it…'
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
                  onClick={() => generateEmail('update')}
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300'
                >
                  <RefreshCw className='mr-2 h-4 w-4' /> Apply Some Magic
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
            <div className='w-full h-[50vh] sm:h-[80vh] p-4 overflow-auto bg-white text-gray-100 rounded-lg text-wrap'>
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
                      setCurrentHtml('');
                      setSelectedImages([]);
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
