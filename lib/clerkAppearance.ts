/**
 * Brand styling for Clerk's sign-up / sign-in components, so the auth screens
 * don't look like a different product than the rest of the site. Shared by
 * both pages under app/(auth). Colours mirror app/globals.css tokens (navy
 * --accent #0A2463) — Clerk's `variables` need literal values, it can't read
 * CSS custom properties.
 */

export const clerkAppearance = {
  variables: {
    colorPrimary: '#0A2463',
    colorText: '#111827',
    colorTextSecondary: '#4B5563',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    card: 'w-full shadow-sm border border-[--border] rounded-2xl',
    // The page's own <h1> carries the heading; Clerk's duplicate title would
    // say "Create your account" a second time.
    header: 'hidden',
    formButtonPrimary:
      'bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-semibold normal-case min-h-[44px]',
    formFieldInput: 'min-h-[44px]',
    footerActionLink: 'text-[--accent] font-semibold hover:underline',
  },
} as const
