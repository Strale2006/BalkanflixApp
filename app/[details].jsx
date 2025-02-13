import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRoute } from 'expo-router'; // use expo-router's hook instead
import { Feather } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import { Link } from 'expo-router';

const DetailsScreen = () => {
  const { details: title } = useRoute().params || {}; // Extract the dynamic parameter as 'title'
  const { token } = useGlobalContext();
  
  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [visibleEpisodes, setVisibleEpisodes] = useState(40);
  const [isSaved, setIsSaved] = useState(false);
  const trimmedTitle = title.replace(/\s/g, '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/content/seriesDetail/${title}`);
        setSeriesData(data.series[0]);
        fetchUserData(data.series[0]);
      } catch (error) {
        console.error("Error fetching series:", error);
      }
    };

    const fetchEpisodes = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/episode/episodeCount/${trimmedTitle}`);
        setEpisodes(data.episode);
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    };

    fetchData();
    fetchEpisodes();
  }, [title]);

  const fetchUserData = async (series) => {
    if (!token) return;
    try {
      const { data } = await axios.get('https://balkanflix-server.vercel.app/api/private', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(data.favorites.includes(series.title));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const toggleSaved = async () => {
    if (!token) {
      // Use Expo Router for navigation to the login screen
      router.push('/login');
      return;
    }

    const apiUrl = isSaved
      ? 'https://balkanflix-server.vercel.app/api/auth/removeFavorite'
      : 'https://balkanflix-server.vercel.app/api/auth/addFavorite';

    try {
      await axios.post(apiUrl, { title: seriesData?.title }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error updating favorites", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      {seriesData ? (
        <>
          <Image 
            source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData?.poster}` }} 
            className="w-full h-64 object-cover"
          />

          <View className="p-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-2xl font-bold">{seriesData?.title}</Text>
              <TouchableOpacity onPress={toggleSaved}>
                <Feather name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap mt-2">
              {seriesData?.genre?.map((genre) => (
                <Text key={genre} className="text-gray-300 bg-gray-700 px-2 py-1 rounded mr-2 mb-2">
                  {genre}
                </Text>
              ))}
            </View>

            <Text className="text-gray-400 mt-3">{seriesData?.description}</Text>

            <View className="mt-5">
              <Text className="text-white text-lg font-semibold">Gledaj:</Text>
              <View className="flex-row flex-wrap mt-3">
                {episodes.slice(0, visibleEpisodes).map((episode, index) => (
                  <Link 
                    key={index} 
                    href={`/watch/${trimmedTitle}/${episode.ep}`} 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg m-1"
                  >
                    {episode.ep}
                  </Link>
                ))}
              </View>

              {episodes.length > 40 && (
                <View className="flex-row justify-between mt-4">
                  <TouchableOpacity 
                    disabled={visibleEpisodes <= 40} 
                    onPress={() => setVisibleEpisodes(visibleEpisodes - 40)}
                    className="px-4 py-2 bg-gray-700 rounded"
                  >
                    <Text className="text-white">{'<'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    disabled={visibleEpisodes >= episodes.length} 
                    onPress={() => setVisibleEpisodes(visibleEpisodes + 40)}
                    className="px-4 py-2 bg-gray-700 rounded"
                  >
                    <Text className="text-white">{'>'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {(seriesData?.previous || seriesData?.next) && (
              <View className="mt-6">
                {seriesData?.previous && (
                  <Link href={`/${seriesData.previous[1]}`} className="text-blue-400 text-lg">
                    ← {seriesData.previous[0]} (Prethodna sezona)
                  </Link>
                )}
                {seriesData?.next && (
                  <Link href={`/${seriesData.next[1]}`} className="text-blue-400 text-lg mt-2">
                    {seriesData.next[0]} (Sledeća sezona) →
                  </Link>
                )}
              </View>
            )}
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color="#ff4757" className="mt-10" />
      )}
    </ScrollView>
  );
};

export default DetailsScreen;
