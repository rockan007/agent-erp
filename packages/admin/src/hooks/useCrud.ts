import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';

function deriveApiPath(model: string): string {
  const name = model.replace(/^res\./, '');
  return `/api/${name}`;
}

interface CrudState {
  records: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
}

export function useCrud(model: string) {
  const apiPath = deriveApiPath(model);
  const token = useStore((s) => s.token);
  const mountedRef = useRef(true);

  const [state, setState] = useState<CrudState>({
    records: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(apiPath, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      if (!mountedRef.current) return;
      setState({ records: data as Record<string, unknown>[], loading: false, error: null });
    } catch (err) {
      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [apiPath, authHeaders]);

  const create = useCallback(async (data: Record<string, unknown>) => {
    setState((s) => ({ ...s, error: null, loading: true }));
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      await fetchAll();
    } catch (err) {
      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      throw err;
    }
  }, [apiPath, authHeaders, fetchAll]);

  const update = useCallback(async (id: number, data: Record<string, unknown>) => {
    setState((s) => ({ ...s, error: null, loading: true }));
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      await fetchAll();
    } catch (err) {
      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      throw err;
    }
  }, [apiPath, authHeaders, fetchAll]);

  const remove = useCallback(async (id: number) => {
    setState((s) => ({ ...s, error: null, loading: true }));
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchAll();
    } catch (err) {
      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      throw err;
    }
  }, [apiPath, authHeaders, fetchAll]);

  const fetchOne = useCallback(async (id: number): Promise<Record<string, unknown> | null> => {
    const res = await fetch(`${apiPath}/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  }, [apiPath, authHeaders]);

  useEffect(() => {
    if (token) {
      fetchAll();
    }
  }, [token, fetchAll]);

  return {
    records: state.records,
    loading: state.loading,
    error: state.error,
    fetchAll,
    create,
    update,
    remove,
    fetchOne,
  };
}
