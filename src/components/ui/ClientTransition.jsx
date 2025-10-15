// file: src/components/ui/ClientTransition.jsx
'use client';

import { usePathname } from 'next/navigation';

export default function ClientTransition({ children }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="
        motion-safe:animate-in
        motion-safe:fade-in-50
        motion-safe:duration-200
      "
    >
      {children}
    </div>
  );
}
