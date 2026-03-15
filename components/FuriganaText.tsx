'use client';

import { useFurigana } from './Header';

/** Strip <ruby>/<rt> tags but keep <span> (red highlight) tags */
function stripRubyTags(html: string): string {
  return html
    .replace(/<rt>[^<]*<\/rt>/g, '')
    .replace(/<\/?ruby>/g, '')
    .replace(/<\/?rb>/g, '');
}

interface FuriganaTextProps {
  original: string;
  withRuby: string;
  withRedHighlight?: string;
  className?: string;
}

export default function FuriganaText({ original, withRuby, withRedHighlight, className = '' }: FuriganaTextProps) {
  const { showFurigana } = useFurigana();

  if (showFurigana && withRuby) {
    // When furigana ON: show with_ruby (which may include red highlight for MOJI)
    // If with_red_highlight exists AND has ruby tags, prefer it for the full experience
    const html = (withRedHighlight && withRedHighlight.includes('<ruby>')) ? withRedHighlight : withRuby;
    return (
      <span
        className={`furigana-visible ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (!showFurigana && withRedHighlight) {
    // When furigana OFF but has red highlight: show red highlights without ruby
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: stripRubyTags(withRedHighlight) }}
      />
    );
  }

  return <span className={className}>{original}</span>;
}
