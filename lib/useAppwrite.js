import { useState, useEffect } from 'react';

const useAppwrite = (fn) => {
      const [data, setData] = useState([])
      const [isLoading, setIsLoading] = useState(false)

      const fetchData = async() => {
        setIsLoading(true);
        try{
          const res = await fn();
          setData(res);
        }catch(error){
          Alert.alert('Error', error.message)
          console.log(error)
        }finally{
          setIsLoading(false)
        }
      }
    
      useEffect(() => {
        
    
        fetchData();
      }, []);

      const refetch = () => fetchData();

      return {data, isLoading, refetch};
}

export default useAppwrite;