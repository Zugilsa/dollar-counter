'use client';

import { useMemo } from 'react';
import { Decision, ReclaimStatus } from '@/lib/types';
import { getReclaimStatus } from '@/lib/costs';

export function useReclaimStatus(decision: Decision): ReclaimStatus {
  return useMemo(() => getReclaimStatus(decision), [decision]);
}
