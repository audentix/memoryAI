export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-lighter text-text-muted',
    primary: 'bg-primary/20 text-primary-light',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
