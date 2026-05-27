/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.clerk.dev', 'img.clerk.com']
  },

  // Redirect www → bare domain so Clerk's origin check passes.
  // Clerk's production instance is configured for democracyunlocked.com;
  // www.democracyunlocked.com is treated as an unrecognised subdomain and
  // returns 403 on every API call.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.democracyunlocked.com' }],
        destination: 'https://democracyunlocked.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
