/// file: src/components/ui/button.jsx
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    // base
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'ring-offset-background',
  ].join(' '),
  {
    variants: {
      variant: {
        // shadcn clásicos
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        // sólidos semánticos
        success: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]/90',
        danger: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90',

        // nuevos (tenues)
        successSoft: [
          'border bg-transparent',
          'border-[hsl(var(--success))]/20 text-[hsl(var(--success))]',
          'hover:bg-[hsl(var(--success))]/10',
          'focus-visible:ring-[hsl(var(--success))]',
        ].join(' '),
        dangerSoft: [
          'border bg-transparent',
          'border-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))]',
          'hover:bg-[hsl(var(--destructive))]/10',
          'focus-visible:ring-[hsl(var(--destructive))]',
        ].join(' '),
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };

