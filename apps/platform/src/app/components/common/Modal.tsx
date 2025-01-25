import { ReactNode, useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Modal({ open, onOpenChange, children }: ModalProps) {
  if (!open) return null;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  };

  // Add event listener for escape key
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        {children}
      </div>
    </>
  );
}
