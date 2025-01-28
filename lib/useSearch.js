import { useState, useEffect } from 'react';
import { searchSeries } from '../lib/apiClient';

const useSearch = (query) => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const search = async (newPage = 1) => {
      if (!query || query.length < 3) return;
      
      try {
        setLoading(true);
        const response = await apiClient.get('/content/searchQuery', {
          params: {
            query,
            page: newPage,
            limit: 10
          }
        });
  
        setData(prev => newPage === 1 ? 
          response.data.data.results : 
          [...prev, ...response.data.data.results]
        );
        setTotalPages(response.data.data.totalPages);
        setPage(newPage);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    const loadMore = () => {
      if (page < totalPages && !loading) {
        search(page + 1);
      }
    };
  
    useEffect(() => {
      search(1);
    }, [query]);
  
    return { data, loading, error, loadMore };
  };

export default useSearch;