import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrud } from '../useCrud';

// Mock zustand store
vi.mock('../../store', () => ({
  useStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ token: 'test-token' }),
    { getState: () => ({ token: 'test-token' }) },
  ),
}));

describe('useCrud', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should fetch records and set them in state', async () => {
      const mockData = [{ id: 1, name: 'admin' }];
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCrud('res.groups'));

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.records).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should set error when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('create', () => {
    it('should POST and refresh records on success', async () => {
      const created = { id: 1, name: 'new-group' };
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(created),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([created]),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.create({ name: 'new-group' });
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'new-group' }),
      });
      expect(result.current.records).toEqual([created]);
    });
  });

  describe('update', () => {
    it('should PUT and refresh records on success', async () => {
      const updatedList = [{ id: 1, name: 'new-name' }];

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedList),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.update(1, { name: 'new-name' });
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'new-name' }),
      });
      expect(result.current.records).toEqual(updatedList);
    });
  });

  describe('remove', () => {
    it('should DELETE and refresh records on success', async () => {
      const remaining = [{ id: 2, name: 'other' }];

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(remaining),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.remove(1);
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result.current.records).toEqual(remaining);
    });
  });

  describe('apiPath derivation', () => {
    it('should derive /api/groups from res.groups', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', expect.anything());
    });

    it('should derive /api/users from res.users', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useCrud('res.users'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/users', expect.anything());
    });
  });
});
