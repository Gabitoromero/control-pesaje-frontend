import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useTheme } from '../../features/theme/ThemeContext';

// Adapted from shadcn/ui's sonner.tsx: the upstream version reads the active
// theme from `next-themes`, which this project does not use. Instead we
// drive it from this app's own `useTheme()` context so toasts stay in sync
// with the rest of the UI.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
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
