import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary/50',
      ghost: 'bg-transparent hover:bg-surface-light text-text',
      danger: 'bg-danger/10 hover:bg-danger/20 text-danger focus:ring-danger/50',
      success: 'bg-success/10 hover:bg-success/20 text-success focus:ring-success/50',
      outline: 'bg-transparent border border-border hover:bg-surface-light text-text',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
