import { useState } from 'react';

const STORAGE_KEY = 'sidebar:open';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

/** Desktop sidebar visibility, remembered across visits (open by default). */
export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(readStored);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* storage unavailable: the preference just won't persist */
    }
  };

  return [open, toggle];
}
