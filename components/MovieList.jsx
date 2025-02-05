import React, { useState, useEffect } from 'react';
import { View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import axios from 'axios';
import AnimeCard from './AnimeCard';
import CardSkeleton from './CardSkeleton';

const { width } = Dimensions.get('window');

const MovieList = ({ type }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/content/seriesList?sort=${type}`);
        setItems(data.series);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [type]);

  const renderItem = ({ item, index }) => (
    <View className="mx-2" style={{ width: width * 0.31, height: width * 0.6 }}>
      {loading ? <CardSkeleton /> : <AnimeCard item={item} />}
    </View>
  );

  return (
    <View className="my-4">
      <FlatList
        horizontal
        data={loading ? Array.from({ length: 10 }) : items}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        ListEmptyComponent={
          <ActivityIndicator size="large" color="#E50914" />
        }
      />
    </View>
  );
};

MovieList.propTypes = {
  type: PropTypes.string.isRequired,
};

export default MovieList;
