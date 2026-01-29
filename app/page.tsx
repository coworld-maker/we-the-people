import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Vote, Users, Shield, TrendingUp } from 'lucide-react'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Vote className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">We The People</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Democracy Unlocked
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            Vote on real congressional legislation. Make your voice heard. 
            Shape the future of democracy.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Start Voting Today
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Vote className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real Legislation</h3>
            <p className="text-gray-600">
              Vote on actual bills from Congress. See what's being debated right now.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <Users className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Collective Voice</h3>
            <p className="text-gray-600">
              Join thousands making their opinions heard on every issue.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <Shield className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
            <p className="text-gray-600">
              End-to-end encryption keeps your votes and data completely private.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Track Impact</h3>
            <p className="text-gray-600">
              See how bills affect different communities and demographics.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to participate in democracy?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join the movement to make government more responsive to the people.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold"
          >
            Create Free Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-gray-600">
          <p>© 2024 We The People. Making democracy accessible to all.</p>
        </div>
      </footer>
    </div>
  )
}
