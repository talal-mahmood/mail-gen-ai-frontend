'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { callAutocompleteAPI } from '@/lib/api';

interface AutocompleteProps {
  onChange?: (value: string) => void; // callback to pass current text upward
  className?: string;
  placeholder?: string;
  rows?: number;
  mode: number;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  onChange,
  className = '',
  placeholder,
  rows = 3,
  mode,
  ...rest
}) => {
  const mainRef = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [ghostText, setGhostText] = useState('');
  const [minHeight, setMinHeight] = useState('auto');
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check minimum input (at least one space and >1 character)
  const hasMinimumInput = (value: string) => {
    return value.trim().includes(' ') && value.trim().length > 1;
  };

  // Fetch autocomplete suggestion
  const fetchAutocomplete = async (currentText: string) => {
    if (!currentText || !hasMinimumInput(currentText)) {
      setGhostText('');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { completion } = await callAutocompleteAPI(currentText, mode); // service_type 0 for splash
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

  // Debounce changes and call autocomplete API
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAutocomplete(text);
    }, 500);

    return () => {
      clearTimeout(timer);
      setGhostText('');
    };
  }, [text]);

  // Calculate the minimum height based on the number of rows
  const calculateMinHeight = () => {
    if (!mainRef.current) return;
    const lineHeight =
      Number.parseInt(getComputedStyle(mainRef.current).lineHeight) || 20;
    const calculatedMinHeight = lineHeight * rows + 32; // additional padding
    setMinHeight(`${calculatedMinHeight}px`);
  };

  // Adjust height for both textareas
  const adjustHeight = () => {
    if (!ghostRef.current || !mainRef.current) return;
    ghostRef.current.style.height = 'auto';
    mainRef.current.style.height = 'auto';
    const ghostHeight = ghostRef.current.scrollHeight;
    const mainHeight = mainRef.current.scrollHeight;
    const newHeight = Math.max(ghostHeight, mainHeight);
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
  }, [text, ghostText, rows]);

  // Sync scroll positions between the two textareas
  useEffect(() => {
    const syncScroll = () => {
      if (mainRef.current && ghostRef.current) {
        ghostRef.current.scrollTop = mainRef.current.scrollTop;
        ghostRef.current.scrollLeft = mainRef.current.scrollLeft;
      }
    };

    if (mainRef.current) {
      mainRef.current.addEventListener('scroll', syncScroll);
      return () => {
        if (mainRef.current) {
          mainRef.current.removeEventListener('scroll', syncScroll);
        }
      };
    }
  }, []);

  const handleInternalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Reset heights before adjustment to allow for proper shrinkage
    if (mainRef.current) mainRef.current.style.height = 'auto';
    if (ghostRef.current) ghostRef.current.style.height = 'auto';

    setText(newValue);
    adjustHeight();
    // Propagate change upward (if the parent cares)
    onChange?.(newValue);
  };

  const handleInternalKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Handle Tab key to accept suggestion
    if (ghostText && e.key === 'Tab') {
      e.preventDefault();
      const newText = text + ghostText;
      setText(newText);
      setGhostText('');
      adjustHeight();
      // Propagate change upward
      onChange?.(newText);
    }
  };

  return (
    <motion.div
      className='relative w-full'
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Ghost textarea behind main textarea */}
      <BaseTextarea
        ref={ghostRef}
        value={`${text}${ghostText}`}
        readOnly
        tabIndex={-1}
        className='absolute top-0 left-0 w-full p-4 pr-[12px] bg-gray-800 border border-gray-600 text-gray-500 pointer-events-none overflow-hidden transition-all duration-200 rounded-lg'
        rows={rows}
        style={{
          caretColor: 'transparent',
          userSelect: 'none',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          minHeight: minHeight,
          resize: 'none',
        }}
      />

      {/* Main textarea for user input */}
      <BaseTextarea
        ref={mainRef}
        value={text}
        onChange={handleInternalChange}
        onKeyDown={handleInternalKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`relative w-full p-4 pr-[12px] bg-transparent opacity-50 border rounded-lg text-white focus:border-blue-500 overflow-hidden transition-all duration-200 ${className} ${
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
        className='mt-2 ml-2 text-left text-xs text-white'
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
