import { useState, useCallback } from 'react';

export function useModalAnimation(onClose: () => void, duration = 200) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, duration);
  }, [onClose, duration]);

  return { isClosing, handleClose };
}
