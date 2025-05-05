'use client';
import { useState } from 'react';
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
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  ChevronDown,
  // ChevronUp,
  ImageIcon,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Image,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Notification, useNotification } from '@/components/ui/notification';

type PexelsImageSelectorProps = {
  apiKey: string;
  maxSelection: number;
  selectionType: 'single' | 'multiple';
  selectedImages: any[];
  onSelect: (images: any[]) => void;
};

const IMAGES_PER_PAGE = 12;

export function PexelsImageSelector({
  apiKey,
  maxSelection,
  selectionType,
  selectedImages,
  onSelect,
}: PexelsImageSelectorProps) {
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [showPexelsSection, setShowPexelsSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (page: number) => {
    try {
      if (!searchQuery.trim()) {
        setError('Please enter a search term');
        return;
      }

      setIsSearching(true);
      setError(null);

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          searchQuery
        )}&per_page=${IMAGES_PER_PAGE}&page=${page}`,
        { headers: { Authorization: apiKey } }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Invalid Pexels API Key'
            : 'Failed to fetch images'
        );
      }

      const data = await response.json();
      setSearchResults(data.photos || []);
      setTotalPages(Math.ceil(data.total_results / IMAGES_PER_PAGE) || 1);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search images');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = (image: any) => {
    const isSelected = selectedImages.some((img) => img.id === image.id);

    if (selectionType === 'single') {
      // Replace existing selection for single mode
      onSelect(isSelected ? [] : [image]);
    } else {
      if (!isSelected && selectedImages.length >= maxSelection) {
        showNotification('warning', `Maximum ${maxSelection} images allowed`);
        return;
      }

      const newSelection = isSelected
        ? selectedImages.filter((img) => img.id !== image.id)
        : [...selectedImages, image];

      // Trim to max selection and update
      onSelect(newSelection.slice(0, maxSelection));
    }
  };

  const handleRemoveImage = (imageId: number) => {
    onSelect(selectedImages.filter((img) => img.id !== imageId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const clearSelection = () => onSelect([]);

  return (
    <div className='space-y-4'>
      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
      />
      <Collapsible
        open={showPexelsSection}
        onOpenChange={setShowPexelsSection}
        className='border rounded-lg border-gray-700'
      >
        <CollapsibleTrigger
          className={`w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors ${
            showPexelsSection ? 'rounded-t-[7px]' : 'rounded-[7px]'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-full bg-blue-500/20'>
                <Image className='w-5 h-5 text-blue-400' />
              </div>

              {/* Use a generic image label with an icon */}
              <div className='flex items-center gap-1'>
                <span className='font-medium text-blue-300'>
                  {selectedImages.length > 0
                    ? selectionType === 'single'
                      ? 'Change image'
                      : `Manage selection (${selectedImages.length}/${maxSelection})`
                    : `Add image${selectionType === 'multiple' ? 's' : ''}`}
                </span>
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-blue-300 transition-transform ${
                showPexelsSection ? 'rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className='p-4 space-y-4 bg-gray-800 rounded-b-[7px]'>
          <div className='space-y-4'>
            <div className='space-y-2 bg-gray-900/50 p-4 rounded-lg'>
              <Label className='text-blue-300'>Search Images</Label>
              <div className='flex gap-2'>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder='Search for images...'
                  className='flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white'
                />
                <Button
                  onClick={() => handleSearch(1)}
                  disabled={isSearching}
                  className='whitespace-nowrap border-none text-white hover:text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300'
                >
                  {isSearching ? (
                    <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <>
                      <Search className='h-4 w-4 mr-2' />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className='p-3 text-sm text-red-400 bg-red-900/20 rounded-lg'>
                {error}
              </div>
            )}

            {searchResults.length > 0 && (
              <>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-3 rounded-lg bg-gray-900/50'>
                  {searchResults.map((image) => {
                    const isSelected = selectedImages.some(
                      (img) => img.id === image.id
                    );
                    const isAtMax =
                      selectionType === 'multiple' &&
                      selectedImages.length >= maxSelection &&
                      !isSelected;

                    return (
                      <motion.div
                        key={image.id}
                        className={`relative aspect-video cursor-pointer rounded-lg overflow-hidden 
          ${
            isSelected
              ? 'ring-2 ring-blue-500'
              : 'hover:ring-1 hover:ring-blue-400/50'
          }
          ${isAtMax ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: isAtMax ? 1 : 1.02 }}
                        onClick={() => !isAtMax && handleImageSelect(image)}
                      >
                        <img
                          src={image.src.original}
                          alt={image.alt}
                          className='object-cover w-full h-full'
                        />
                        {isSelected && (
                          <div className='absolute inset-0 flex items-center justify-center bg-blue-500/20'>
                            <Check className='w-6 h-6 text-white' />
                          </div>
                        )}
                        {isAtMax && (
                          <div className='absolute inset-0 bg-gray-900/70 flex items-center justify-center'>
                            <X className='w-8 h-8 text-red-400' />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handleSearch(currentPage - 1)}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        >
                          <ChevronLeft className='!w-6 !h-6' />
                        </PaginationLink>
                      </PaginationItem>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page =
                            currentPage <= 3
                              ? i + 1
                              : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                className={`cursor-pointer bg-gray-900 hover:text-black ${
                                  currentPage === page && 'bg-white text-black'
                                }`}
                                onClick={() => handleSearch(page)}
                                isActive={page === currentPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handleSearch(currentPage + 1)}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        >
                          <ChevronRight className='!w-6 !h-6' />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {selectedImages.length > 0 && (
        <div className='p-4 space-y-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-blue-300'>
              <ImageIcon className='w-5 h-5' />
              <span className='font-medium'>
                Selected Image
                {selectionType === 'multiple' && `s (${selectedImages.length})`}
              </span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearSelection}
              className='text-red-400 hover:bg-red-500'
            >
              Clear All
            </Button>
          </div>

          <div className='flex gap-3 overflow-x-auto'>
            {selectedImages.map((image) => (
              <div
                key={image.id}
                className='relative flex-shrink-0 aspect-video w-44 rounded-md overflow-hidden border border-blue-500/30 group'
              >
                <img
                  src={image.src.original}
                  alt={image.alt}
                  className='object-cover w-full h-full'
                />
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className='absolute top-1 right-1 bg-red-500/90 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <X className='h-3 w-3 text-white' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
