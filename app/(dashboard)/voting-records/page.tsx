'use client';

// app/(dashboard)/voting-records/page.tsx

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Senator {
  bioguideId: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  party: string | null;
  state: string | null;
}

interface Bill {
  id: string;
  title: string | null;
  billType: string;
  billNumber: string;
  congress: string;
}

interface Vote {
  id: string;
  position: string;
  chamber: string;
  rollNumber: number | null;
  votedAt: string | null;
  representative: Senator;
  bill: Bill;
}

interface FilterOptions {
  bills: Bill[];
  states: string[];
}

const POSITION_STYLES: Record<string, { label: string; className: string }> = {
  yea:        { label: 'Yea',        className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  nay:        { label: 'Nay',        className: 'bg-red-100 text-red-800 border border-red-200' },
  not_voting: { label: 'Not Voting', className: 'bg-[--surface-tertiary] text-[--text-muted] border border-[--border]' },
  present:    { label: 'Present',    className: 'bg-amber-100 text-amber-800 border border-amber-200' },
};

const PARTY_STYLES: Record<string, { label: string; className: string }> = {
  D: { label: 'D', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  R: { label: 'R', className: 'bg-red-100 text-red-800 border border-red-200' },
  I: { label: 'I', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
};

function SenatorAvatar({ senator }: { senator: Senator }) {
  const initials = `${senator.firstName?.[0] ?? ''}${senator.lastName?.[0] ?? ''}`;
  const party = senator.party ?? 'I';
  const bgColor = party === 'D' ? 'bg-blue-600' : party === 'R' ? 'bg-red-600' : 'bg-purple-600';
  return (
    <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold ring-2 ring-[--surface]`}>
      {initials}
    </div>
  );
}

function VoteBadge({ position }: { position: string }) {
  const style = POSITION_STYLES[position] ?? { label: position, className: 'bg-[--surface-secondary] text-[--text-muted]' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}

function PartyBadge({ party }: { party: string | null }) {
  const style = PARTY_STYLES[party ?? 'I'] ?? PARTY_STYLES['I'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[--accent]/10 text-[--accent] border border-[--accent]/20">
      {label}
      <button onClick={onRemove} className="hover:text-[--accent]/70 ml-0.5">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
}

const SELECT_CLASS = 'w-full rounded-lg border border-[--border] bg-[--surface-secondary] text-sm text-[--text] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent';
const LABEL_CLASS  = 'block text-xs font-semibold text-[--text-muted] uppercase tracking-wide mb-1.5';

export default function VotingRecordsPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ bills: [], states: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [chamber, setChamber]   = useState('Senate');
  const [party, setParty]       = useState('');
  const [state, setState]       = useState('');
  const [position, setPosition] = useState('');
  const [billId, setBillId]     = useState('');
  const [page, setPage]         = useState(1);

  const fetchVotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        chamber,
        page: String(page),
        limit: '50',
        ...(party    && { party }),
        ...(state    && { state }),
        ...(position && { position }),
        ...(billId   && { billId }),
      });
      const res  = await fetch(`/api/voting-records?${params}`);
      const data = await res.json();
      setVotes(data.votes ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setFilterOptions(data.filterOptions ?? { bills: [], states: [] });
    } catch (err) {
      console.error('Failed to fetch voting records:', err);
    } finally {
      setLoading(false);
    }
  }, [chamber, party, state, position, billId, page]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  const handleFilterChange = (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
      setPage(1);
    };

  const billLabel = (bill: Bill) =>
    `${bill.billType} ${bill.billNumber} – ${bill.title ? bill.title.slice(0, 60) + (bill.title.length > 60 ? '…' : '') : 'Untitled'}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[--text] tracking-tight">Voting Records</h1>
        <p className="mt-1 text-[--text-secondary] text-sm">
          How your representatives voted on legislation in the 119th Congress
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[--surface] rounded-2xl shadow-sm border border-[--border] p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className={LABEL_CLASS}>Chamber</label>
            <select value={chamber} onChange={handleFilterChange(setChamber)} className={SELECT_CLASS}>
              <option value="Senate">Senate</option>
              <option value="House">House</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Party</label>
            <select value={party} onChange={handleFilterChange(setParty)} className={SELECT_CLASS}>
              <option value="">All Parties</option>
              <option value="D">Democrat</option>
              <option value="R">Republican</option>
              <option value="I">Independent</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>State</label>
            <select value={state} onChange={handleFilterChange(setState)} className={SELECT_CLASS}>
              <option value="">All States</option>
              {filterOptions.states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Vote</label>
            <select value={position} onChange={handleFilterChange(setPosition)} className={SELECT_CLASS}>
              <option value="">All Votes</option>
              <option value="yea">Yea</option>
              <option value="nay">Nay</option>
              <option value="not_voting">Not Voting</option>
              <option value="present">Present</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Bill</label>
            <select value={billId} onChange={handleFilterChange(setBillId)} className={SELECT_CLASS}>
              <option value="">All Bills</option>
              {filterOptions.bills.map(b => (
                <option key={b.id} value={b.id}>{billLabel(b)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(party || state || position || billId) && (
          <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-[--border]">
            <span className="text-xs text-[--text-muted] self-center">Filters:</span>
            {party    && <FilterChip label={party === 'D' ? 'Democrat' : party === 'R' ? 'Republican' : 'Independent'} onRemove={() => { setParty(''); setPage(1); }} />}
            {state    && <FilterChip label={state} onRemove={() => { setState(''); setPage(1); }} />}
            {position && <FilterChip label={POSITION_STYLES[position]?.label ?? position} onRemove={() => { setPosition(''); setPage(1); }} />}
            {billId   && <FilterChip label={filterOptions.bills.find(b => b.id === billId)?.billType + ' ' + filterOptions.bills.find(b => b.id === billId)?.billNumber || 'Bill'} onRemove={() => { setBillId(''); setPage(1); }} />}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[--text-muted]">
          {loading ? 'Loading…' : `${total.toLocaleString()} vote${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-[--surface] rounded-2xl shadow-sm border border-[--border] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent]" />
          </div>
        ) : votes.length === 0 ? (
          <div className="text-center py-20 text-[--text-muted]">
            <svg className="mx-auto mb-3 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No voting records found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[--surface-secondary] border-b border-[--border]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">Senator</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">State</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">Bill</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">Vote</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">Roll #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[--text-muted] uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {votes.map(vote => (
                    <tr key={vote.id} className="hover:bg-[--accent]/5 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <SenatorAvatar senator={vote.representative} />
                          <div>
                            <Link
                              href={`/representatives/${vote.representative.bioguideId}`}
                              className="font-medium text-[--text] hover:text-[--accent] transition-colors"
                            >
                              {vote.representative.fullName ?? `${vote.representative.firstName} ${vote.representative.lastName}`}
                            </Link>
                            <div className="mt-0.5">
                              <PartyBadge party={vote.representative.party} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[--text-secondary] text-xs font-medium">
                        {vote.representative.state}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <Link
                          href={`/bills/${vote.bill.id}`}
                          className="font-semibold text-[--accent] hover:underline text-xs"
                        >
                          {vote.bill.billType} {vote.bill.billNumber}
                        </Link>
                        {vote.bill.title && (
                          <p className="text-xs text-[--text-muted] mt-0.5 line-clamp-1">{vote.bill.title}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <VoteBadge position={vote.position} />
                      </td>
                      <td className="px-4 py-3.5 text-[--text-muted] text-xs">
                        {vote.rollNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[--text-muted] text-xs whitespace-nowrap">
                        {vote.votedAt
                          ? new Date(vote.votedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[--border]">
              {votes.map(vote => (
                <div key={vote.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <SenatorAvatar senator={vote.representative} />
                      <div>
                        <Link href={`/representatives/${vote.representative.bioguideId}`} className="font-medium text-[--text] text-sm">
                          {vote.representative.fullName ?? `${vote.representative.firstName} ${vote.representative.lastName}`}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PartyBadge party={vote.representative.party} />
                          <span className="text-xs text-[--text-muted]">{vote.representative.state}</span>
                        </div>
                      </div>
                    </div>
                    <VoteBadge position={vote.position} />
                  </div>
                  <div className="mt-3 pl-12">
                    <Link href={`/bills/${vote.bill.id}`} className="text-xs font-semibold text-[--accent]">
                      {vote.bill.billType} {vote.bill.billNumber}
                    </Link>
                    {vote.bill.title && (
                      <p className="text-xs text-[--text-muted] mt-0.5 line-clamp-2">{vote.bill.title}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[--border] text-[--text-secondary] hover:bg-[--surface-secondary] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[--text-muted] px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[--border] text-[--text-secondary] hover:bg-[--surface-secondary] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
