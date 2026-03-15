'use client';

import { useFurigana } from './Header';

interface FuriganaTextProps {
  original: string;
  withRuby: string;
  className?: string;
}

export default function FuriganaText({ original, withRuby, className = '' }: FuriganaTextProps) {
  const { showFurigana } = useFurigana();

  if (showFurigana && withRuby) {
    return (
      <span
        className={`furigana-visible ${className}`}
        dangerouslySetInnerHTML={{ __html: withRuby }}
      />
    );
  }

  return <span className={className}>{original}</span>;
}
