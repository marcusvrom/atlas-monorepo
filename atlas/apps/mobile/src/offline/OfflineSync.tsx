import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../data/api-provider';
import { watchSync } from './coordinator';
export function OfflineSync() {
  const api = useApi(),
    cache = useQueryClient();
  useEffect(() => watchSync(api, cache), [api, cache]);
  return null;
}
