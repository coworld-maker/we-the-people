'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import {
  ArrowRight, ChevronRight, FileText, Users, Vote,
  TrendingUp, Shield, Zap, BarChart3, BookOpen,
  Check, Globe, Scale
} from 'lucide-react';

// ── Typewriter ────────────────────────────────────────────────────────────────

const ROTATING_WORDS = [
  'your vote',
  'your reps',
  'every bill',
  'real power',
  'democracy',
];

function Typewriter() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'erasing'>('typing');

  useEffect(() => {
    const word = ROTATING_WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setPhase('pausing'), 2000);
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('erasing'), 0);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
      } else {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, wordIndex]);

  return (
    <span className="text-gradient-accent">
      {displayed}
      <span className="animate-blink" style={{ marginLeft: 2, opacity: 0.8 }}>|</span>
    </span>
  );
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1500;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, suffix, color,
}: {
  icon: any; label: string; value: number; suffix?: string; color: string;
}) {
  return (
    <div className="card flex items-center gap-4 flex-1 min-w-0">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 16px ${color}` }}
      >
        <Icon size={18} color="#fff" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="stat-value text-2xl">
          <AnimatedNumber target={value} suffix={suffix} />
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon, title, description, accent = false, tall = false,
}: {
  icon: any; title: string; description: string; accent?: boolean; tall?: boolean;
}) {
  return (
    <div
      className={`card flex flex-col gap-4 ${tall ? 'row-span-2' : ''} ${accent ? 'card-glow' : ''}`}
      style={{ padding: '28px' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: accent ? 'rgba(99,91,255,0.20)' : 'var(--surface-secondary)',
          border: '1px solid var(--border-medium)',
        }}
      >
        <Icon size={18} color={accent ? '#A5B4FC' : 'var(--text-secondary)'} strokeWidth={2} />
      </div>
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            letterSpacing: 'var(--tracking-snug)',
            marginBottom: '6px',
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TypewriterHero() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', overflowX: 'hidden' }}>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav
        className="glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: '24px',
          zIndex: 50,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} color="var(--accent)" strokeWidth={2.5} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 'var(--text-base)',
              letterSpacing: '-0.02em',
            }}
          >
            Democracy Unlocked
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { href: '/bills', label: 'Bills' },
            { href: '/scorecards', label: 'Scorecards' },
            { href: '/documents', label: 'Documents' },
            { href: '/about', label: 'About' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link" style={{ padding: '6px 10px' }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SignedOut>
            <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Get started <ArrowRight size={13} />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Dashboard <ArrowRight size={13} />
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '60px',
          paddingInline: '24px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div
          className="bg-grid"
          style={{
            position: 'absolute',
            inset: 0,
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
            opacity: 0.5,
          }}
        />

        {/* Glow orbs */}
        <div
          className="glow-orb glow-orb-accent"
          style={{ width: 600, height: 400, top: '10%', left: '50%', transform: 'translateX(-50%)' }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
            top: '60%',
            right: '10%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', maxWidth: '860px', zIndex: 1 }}>

          {/* Eyebrow */}
          <div
            className="animate-fade-in-down"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '28px',
              padding: '5px 14px',
              background: 'var(--accent-lighter)',
              border: '1px solid rgba(99,91,255,0.20)',
              borderRadius: '9999px',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#A5B4FC',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
              }}
            />
            119th Congress — Live Data
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              marginBottom: '24px',
              color: 'var(--text)',
            }}
          >
            Track <Typewriter />
            <br />
            <span className="text-gradient">with full transparency.</span>
          </h1>

          {/* Subhead */}
          <p
            className="animate-fade-in-up delay-100"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 40px',
              lineHeight: 1.65,
            }}
          >
            Real votes. Real representatives. Real impact.
            See exactly how Congress votes on every bill — and how it aligns with yours.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up delay-200"
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <SignedOut>
              <Link href="/sign-up" className="btn btn-primary btn-xl">
                Start tracking for free
                <ArrowRight size={18} />
              </Link>
              <Link href="/bills" className="btn btn-secondary btn-xl">
                Browse bills
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-primary btn-xl">
                Go to dashboard
                <ArrowRight size={18} />
              </Link>
              <Link href="/bills" className="btn btn-secondary btn-xl">
                Browse bills
              </Link>
            </SignedIn>
          </div>

          {/* Trust line */}
          <div
            className="animate-fade-in delay-300"
            style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {['Free to use', 'No ads ever', 'Real congressional data', 'Open source'].map((item) => (
              <span
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                <Check size={11} color="var(--success)" strokeWidth={3} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '32px',
              background: 'linear-gradient(to bottom, transparent, var(--border-medium))',
            }}
          />
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section
        style={{
          padding: '0 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <StatCard icon={FileText}  label="Bills tracked"      value={1463}  color="rgba(99,91,255,0.25)" />
          <StatCard icon={Users}     label="Representatives"     value={535}   color="rgba(34,197,94,0.20)" />
          <StatCard icon={Vote}      label="Roll call votes"     value={485}   color="rgba(59,130,246,0.20)" suffix="+" />
          <StatCard icon={BarChart3} label="Policy areas"        value={21}    color="rgba(245,158,11,0.20)" />
        </div>
      </section>

      {/* ── Features Bento ────────────────────────────────── */}
      <section
        style={{
          padding: '0 24px 96px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '12px',
            }}
          >
            Everything you need
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            Your civic dashboard.
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to stay informed, track legislation, and understand
            where your representatives actually stand.
          </p>
        </div>

        {/* Bento grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto',
            gap: '12px',
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <FeatureCard
              icon={Vote}
              title="Vote on real bills"
              description="Cast your position on actual legislation before Congress. See how your votes compare with your representatives and the broader community — instantly."
              accent
            />
          </div>

          <FeatureCard
            icon={Users}
            title="Representative scorecards"
            description="Detailed voting records for every House and Senate member. See alignment scores against your own votes."
          />

          <FeatureCard
            icon={TrendingUp}
            title="Alignment scoring"
            description="We compare your votes against every roll call to calculate how closely your reps represent you — with a clear percentage."
          />

          <div style={{ gridColumn: 'span 2' }}>
            <FeatureCard
              icon={Zap}
              title="AI-powered bill analysis"
              description="Every bill gets a plain-English summary, pros and cons, and impact assessment — generated by Claude AI from the full bill text. No more legalese."
            />
          </div>

          <FeatureCard
            icon={BarChart3}
            title="Voting pattern insights"
            description="Visual breakdowns of your civic activity by policy area, party alignment, and over time."
          />

          <FeatureCard
            icon={Globe}
            title="Live congressional data"
            description="Synced daily from Congress.gov and Senate Clerk records. Always current, always accurate."
          />

          <FeatureCard
            icon={BookOpen}
            title="Founding documents"
            description="The Constitution, Bill of Rights, and Declaration of Independence — with AI-powered plain-English explanations."
          />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section
        style={{
          padding: '0 24px 96px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '12px',
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Three steps to informed citizenship.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            background: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          {[
            {
              step: '01',
              title: 'Find your bills',
              body: 'Browse 1,400+ bills by policy area, status, or keyword. Filter by healthcare, taxes, defense — whatever matters to you.',
              icon: FileText,
            },
            {
              step: '02',
              title: 'Cast your vote',
              body: 'Tell us where you stand. For, against, or abstain — your position is recorded and compared with actual congressional votes.',
              icon: Vote,
            },
            {
              step: '03',
              title: 'See your alignment',
              body: 'Get a clear alignment score showing how closely your representatives actually vote with you. No spin, no framing — just data.',
              icon: BarChart3,
            },
          ].map(({ step, title, body, icon: Icon }) => (
            <div
              key={step}
              style={{
                background: 'var(--surface)',
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                >
                  {step}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: 'var(--border)',
                  }}
                />
                <Icon size={16} color="var(--text-muted)" />
              </div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 120px' }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            padding: '72px 48px',
            background: 'var(--surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-2xl)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '400px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(99,91,255,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'var(--accent-lighter)',
                border: '1px solid rgba(99,91,255,0.20)',
                borderRadius: '9999px',
                fontSize: 'var(--text-xs)',
                color: '#A5B4FC',
                fontWeight: 500,
                letterSpacing: '0.06em',
                marginBottom: '24px',
              }}
            >
              <Shield size={11} />
              Free forever. No ads. No data selling.
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                marginBottom: '16px',
              }}
            >
              Democracy works better
              <br />
              <span className="text-gradient-civic">when you're informed.</span>
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-lg)',
                marginBottom: '36px',
                lineHeight: 1.6,
                maxWidth: '480px',
                margin: '0 auto 36px',
              }}
            >
              Join thousands of citizens tracking real legislation and
              holding their representatives accountable.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <SignedOut>
                <Link href="/sign-up" className="btn btn-primary btn-xl">
                  Create free account
                  <ArrowRight size={18} />
                </Link>
                <Link href="/bills" className="btn btn-secondary btn-xl">
                  Explore bills first
                  <ChevronRight size={16} />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn btn-primary btn-xl">
                  Go to your dashboard
                  <ArrowRight size={18} />
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={15} color="var(--accent)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Democracy Unlocked
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { href: '/bills', label: 'Bills' },
              { href: '/scorecards', label: 'Scorecards' },
              { href: '/documents', label: 'Documents' },
              { href: '/about', label: 'About' },
              { href: '/transparency', label: 'Transparency' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
                className="nav-link"
              >
                {label}
              </Link>
            ))}
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Data sourced from Congress.gov & Senate Clerk
          </p>
        </div>
      </footer>
    </div>
  );
}

export default TypewriterHero;
