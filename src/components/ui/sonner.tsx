import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

// Adapted from shadcn/ui's sonner.tsx: the upstream version reads the active
// theme from `next-themes`, which this project does not use. This app has no
// dark-mode toggle yet, so we default to the light theme and drive all
// visuals through the CSS-variable tokens declared in src/index.css.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
