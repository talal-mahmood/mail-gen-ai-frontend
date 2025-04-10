'use client';

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

interface TextareaWithGhostProps {
  value: string;
  ghostText: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  [key: string]: any;
}

export const TextareaWithGhost: React.FC<TextareaWithGhostProps> = ({
  value,
  ghostText,
  onChange,
  onKeyDown,
  className = '',
  placeholder,
  rows = 3,
  ...rest
}) => {
  const mainRef = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState('auto');
  const [isFocused, setIsFocused] = useState(false);

  // Function to calculate the minimum height based on rows
  const calculateMinHeight = () => {
    if (!mainRef.current) return;

    // Calculate line height (approximate if not available)
    const lineHeight =
      Number.parseInt(getComputedStyle(mainRef.current).lineHeight) || 20;
    const calculatedMinHeight = lineHeight * rows + 32; // 32px for padding

    setMinHeight(`${calculatedMinHeight}px`);
  };

  // Function to adjust the height of both textareas
  const adjustHeight = () => {
    if (!ghostRef.current || !mainRef.current) return;

    // Reset height to auto to get proper scrollHeight
    ghostRef.current.style.height = 'auto';
    mainRef.current.style.height = 'auto';

    // Get the heights of both textareas
    const ghostHeight = ghostRef.current.scrollHeight;
    const mainHeight = mainRef.current.scrollHeight;

    // Use the larger of the two heights, but not less than minHeight
    const newHeight = Math.max(ghostHeight, mainHeight);

    // Apply the new height to both textareas
    ghostRef.current.style.height = `${newHeight}px`;
    mainRef.current.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    calculateMinHeight();
    adjustHeight();

    const handleResize = () => {
      calculateMinHeight();
      adjustHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [value, ghostText, rows]);

  // Sync scroll position between the two textareas
  useEffect(() => {
    const syncScroll = () => {
      if (mainRef.current && ghostRef.current) {
        ghostRef.current.scrollTop = mainRef.current.scrollTop;
        ghostRef.current.scrollLeft = mainRef.current.scrollLeft;
      }
    };

    if (mainRef.current) {
      mainRef.current.addEventListener('scroll', syncScroll);
      return () => mainRef.current?.removeEventListener('scroll', syncScroll);
    }
  }, []);

  return (
    <motion.div
      className='relative w-full'
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Ghost textarea (readonly, behind the main textarea) */}
      <BaseTextarea
        ref={ghostRef}
        value={`${value}${ghostText}`}
        readOnly
        tabIndex={-1}
        className={`absolute top-0 left-0 w-full p-4 pr-[12px] bg-gray-800 border border-gray-600 text-gray-500 pointer-events-none overflow-hidden transition-all duration-200`}
        rows={rows}
        style={{
          caretColor: 'transparent',
          userSelect: 'none',
          visibility: 'visible',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          minHeight: minHeight,
          resize: 'none',
        }}
      />

      {/* Main textarea (user input) */}
      <BaseTextarea
        ref={mainRef}
        value={value}
        onChange={(e) => {
          // Reset height to auto before adjusting to allow shrinkage
          if (mainRef.current) mainRef.current.style.height = 'auto';
          if (ghostRef.current) ghostRef.current.style.height = 'auto';
          adjustHeight();
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          // Reset height to auto before adjusting to allow shrinkage
          if (mainRef.current) mainRef.current.style.height = 'auto';
          if (ghostRef.current) ghostRef.current.style.height = 'auto';
          adjustHeight();
          onKeyDown?.(e);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`relative w-full p-4 pr-[15px] bg-transparent border-none rounded-lg text-white focus:border-blue-500 overflow-hidden transition-all duration-200 ${className} ${
          isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        rows={rows}
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          minHeight: minHeight,
          resize: 'none',
        }}
        {...rest}
      />
      <motion.p
        className='mt-2 ml-2 text-left text-xs text-gray-400'
        initial={{ opacity: 0 }}
        animate={{ opacity: ghostText ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
      >
        Press <kbd className='px-1 py-0.5 bg-gray-700 rounded text-xs'>Tab</kbd>{' '}
        to accept suggestion
      </motion.p>
    </motion.div>
  );
};
