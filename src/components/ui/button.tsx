import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-photo-accent focus-visible:ring-offset-2 focus-visible:ring-offset-photo-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-photo-accent text-photo-bg hover:opacity-90',
        outline: 'border border-photo-border bg-photo-bg text-photo-fg hover:bg-white/5',
        ghost: 'text-photo-muted hover:text-photo-fg',
        lightbox: 'border border-white/20 bg-white/[0.06] text-white/80 hover:border-white/35 hover:bg-white/[0.1] hover:text-white',
        lightboxPrimary:
          'border border-mcm-rust/70 bg-mcm-rust text-mcm-cream shadow-[0_8px_32px_rgba(0,0,0,0.55)] hover:bg-mcm-rust/90',
        inquirySubmit:
          'border border-[#6b5a1e]/80 bg-[#8a7420] text-mcm-cream hover:bg-[#7a661c] focus-visible:ring-[#8a7420]/60',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} type={type} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
