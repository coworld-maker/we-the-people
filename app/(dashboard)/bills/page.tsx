import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BillsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Congressional Bills</h1>
        <p className="mt-2 text-gray-600">Vote on current legislation</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Bills Not Yet Loaded</h3>
        <p className="text-yellow-800 mb-4">
          You need to sync bills from Congress.gov before you can vote.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-yellow-900">
            <strong>Step 1:</strong> Make sure your database is initialized
          </p>
          <p className="text-sm text-yellow-900">
            <strong>Step 2:</strong> Visit{' '}
            <Link 
              href="/api/sync" 
              className="underline font-semibold hover:text-yellow-700"
              target="_blank"
            >
              /api/sync
            </Link>
            {' '}to load bills
          </p>
          <p className="text-sm text-yellow-900">
            <strong>Step 3:</strong> Refresh this page
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Available Bills</h2>
              <p className="text-sm text-gray-500 mt-1">0 bills loaded</p>
            </div>
            <Link
              href="/api/sync"
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Sync Bills Now
            </Link>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bills available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click "Sync Bills Now" to load bills from Congress.gov
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">Browse Bills</h4>
            <p className="text-sm text-gray-600">
              View real congressional legislation from the current session
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">Cast Your Vote</h4>
            <p className="text-sm text-gray-600">
              Vote Yes, No, or Abstain on each bill with optional reasoning
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">See Results</h4>
            <p className="text-sm text-gray-600">
              View aggregate voting results and track your voting history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
