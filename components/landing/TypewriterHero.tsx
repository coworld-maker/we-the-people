'use client';

import { useState, useEffect } from 'react';

const ROTATING_WORDS = [
  'your vote',
  'your reps',
  'every bill',
  'real power',
  'democracy',
];

export default function TypewriterHero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'erasing'>('typing');

  useEffect(() => {
    const word = ROTATING_WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => {
          setDisplayed(word.slice(0, displayed.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase('pausing'), 1800);
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('erasing'), 400);
    } else {
      // erasing
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 45);
      } else {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, wordIndex]);

  return (
    <>
      <span className="text-white">Understand </span>
      <span
        style={{
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {displayed}
      </span>
      <span
        style={{
          display: 'inline-block',
          width: '3px',
          height: '0.85em',
          background: '#60a5fa',
          marginLeft: '2px',
          verticalAlign: 'middle',
          animation: 'blink 1s step-end infinite',
        }}
        aria-hidden
      />
    </>
  );
}
