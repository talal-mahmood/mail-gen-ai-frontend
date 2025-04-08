'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    showUnderline?: boolean;
  }
>(({ className, showUnderline = false, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium',
      'ring-offset-background transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  >
    {props.children}
    {showUnderline && (
      <motion.div
        className='absolute bottom-0 left-0 right-0 h-[2px] bg-blue-400'
        layoutId='tab-indicator'
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />
    )}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Animated version of TabsContent
const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    animationDirection?: 'horizontal' | 'vertical';
  }
>(({ className, animationDirection = 'horizontal', ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
      asChild
    >
      <motion.div
        initial={{
          opacity: 0,
          x: animationDirection === 'horizontal' ? -20 : 0,
          y: animationDirection === 'vertical' ? -20 : 0,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300,
          },
        }}
        exit={{
          opacity: 0,
          x: animationDirection === 'horizontal' ? 20 : 0,
          y: animationDirection === 'vertical' ? 20 : 0,
          transition: {
            duration: 0.2,
          },
        }}
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {props.children}
      </motion.div>
    </TabsPrimitive.Content>
  );
});
AnimatedTabsContent.displayName = 'AnimatedTabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabsContent };
