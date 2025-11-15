// src/hooks/__tests__/useBlockchainData.test.ts
import { renderHook, act } from '@testing-library/react';
import { useBlockchainData } from '@/hooks/useBlockchainData';

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ address: 'x', n_tx: 0, txs: [] }),
}) as any;

test('loads address data once', async () => {
  const { result } = renderHook(() => useBlockchainData());
  await act(async () => {
    await result.current.loadInitialAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('loads more transactions', async () => {
  const { result } = renderHook(() => useBlockchainData());
  await act(async () => {
    await result.current.loadInitialAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    await result.current.loadMoreTransactions();
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
