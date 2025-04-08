'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
  position?: 'top' | 'bottom';
}

export function Notification({
  type,
  message,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseTime = 5000,
  position = 'top',
}: NotificationProps) {
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className='h-5 w-5' />;
      case 'success':
        return <CheckCircle className='h-5 w-5' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5' />;
      case 'info':
        return <Info className='h-5 w-5' />;
      default:
        return <Info className='h-5 w-5' />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-900/90 border-red-600 text-white';
      case 'success':
        return 'bg-green-900/90 border-green-600 text-white';
      case 'warning':
        return 'bg-amber-900/90 border-amber-600 text-white';
      case 'info':
        return 'bg-blue-900/90 border-blue-600 text-white';
      default:
        return 'bg-blue-900/90 border-blue-600 text-white';
    }
  };

  // const positionStyles =
  //   position === 'top'
  //     ? 'top-4 left-1/2 transform -translate-x-1/2'
  //     : 'bottom-4 left-1/2 transform -translate-x-1/2';
  const positionStyles =
    position === 'top' ? 'top-4 right-4' : 'bottom-4 right-4';

  const animationVariants = {
    initial: {
      opacity: 0,
      y: position === 'top' ? -50 : 50,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      y: position === 'top' ? -20 : 20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Progress bar animation
  const progressVariants = {
    initial: { width: '100%' },
    animate: {
      width: '0%',
      transition: {
        duration: autoCloseTime / 1000,
        ease: 'linear',
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial='initial'
          animate='animate'
          exit='exit'
          variants={animationVariants}
          className={`fixed ${positionStyles} z-50 w-full max-w-md px-4 sm:px-0 pointer-events-none`}
        >
          <div
            className={cn(
              'ml-8 flex flex-col rounded-lg border shadow-lg backdrop-blur-sm pointer-events-auto',
              'overflow-hidden',
              getStyles()
            )}
          >
            <div className='flex items-center justify-between p-4'>
              <div className='flex items-center gap-3'>
                {getIcon()}
                <p className='text-sm font-medium'>{message}</p>
              </div>
              <button
                onClick={onClose}
                className='rounded-full p-1 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30'
                aria-label='Close notification'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            {autoClose && (
              <motion.div
                className='h-1 bg-white/30'
                initial='initial'
                animate='animate'
                variants={progressVariants}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useNotification() {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isOpen: boolean;
    position?: 'top' | 'bottom';
  }>({
    type: 'info',
    message: '',
    isOpen: false,
    position: 'top',
  });

  const showNotification = (
    type: NotificationType,
    message: string,
    position: 'top' | 'bottom' = 'top'
  ) => {
    setNotification({
      type,
      message,
      isOpen: true,
      position,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
