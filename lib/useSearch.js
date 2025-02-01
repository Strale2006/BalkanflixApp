import { useState, useEffect, useCallback, useRef } from 'react';
import { searchSeries } from '../lib/apiControllers';

const useSearch = (query) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const handleNewSearch = useCallback(async (newPage = 1) => {
    const searchTerm = query.trim();
    
    // Clear results for invalid queries
    if (!searchTerm || searchTerm.length < 3) {
      setData([]);
      setPage(1);
      setTotalPages(1);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await searchSeries(searchTerm, newPage, 10, controller.signal);
      
      setData(prev => newPage === 1 
        ? response.results 
        : [...prev, ...response.results]
      );
      setTotalPages(response.totalPages);
      setPage(newPage);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch search results');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [query]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      handleNewSearch(page + 1);
    }
  }, [page, totalPages, loading, handleNewSearch]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleNewSearch(1);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, handleNewSearch]);

  return { 
    data, 
    loading, 
    error, 
    loadMore,
    hasMore: page < totalPages 
  };
};

export default useSearch;