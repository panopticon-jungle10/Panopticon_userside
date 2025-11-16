import { useState } from 'react';

interface CodeBlockProps {
  title: string;
  content: string;
}

export function CodeBlock({ title, content }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="code-block">
      <header>
        <strong>{title}</strong>
        <button type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </header>
      <pre>
        <code>{content || '// No content generated'}</code>
      </pre>
    </section>
  );
}
