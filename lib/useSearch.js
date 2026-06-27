import { useState, useEffect, useCallback, useRef } from 'react';
import { searchSeries } from '../lib/apiControllers';

const useSearch = (query) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);   // čuva timer za debounce

  // Interna funkcija koja stvarno poziva API
  const performSearch = useCallback(async (searchTerm, pageNumber = 1) => {
    try {
      setLoading(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await searchSeries(searchTerm, pageNumber, 10, controller.signal);

      setData(prev => pageNumber === 1 ? response.results : [...prev, ...response.results]);
      setTotalPages(response.totalPages);
      setPage(pageNumber);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Greška pri pretrazi');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Debounce pretraga na svaku promenu query‑ja
  useEffect(() => {
    const searchTerm = query.trim();
    if (!searchTerm) {
      setData([]);
      setPage(1);
      setTotalPages(1);
      setError(null);
      return;
    }

    // Očisti prethodni timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Zakazivanje poziva sa 300ms odlaganjem
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchTerm, 1);
    }, 300);

    return () => {
      clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, performSearch]);

  // Javna funkcija za trenutnu pretragu (preskače debounce)
  const searchNow = useCallback(() => {
    const searchTerm = query.trim();
    if (!searchTerm) return;

    // Otkaži debounce i odmah izvrši pretragu
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(searchTerm, 1);
  }, [query, performSearch]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      performSearch(query.trim(), page + 1);
    }
  }, [page, totalPages, loading, query, performSearch]);

  return { data, loading, error, loadMore, searchNow, hasMore: page < totalPages };
};

export default useSearch;