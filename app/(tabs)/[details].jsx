import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Ensure your AuthContext is set up
import { Link } from 'expo-router';

const DetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { title } = route.params || {};
  const { authToken } = useAuth(); // Fetch auth token from context
  
  const [seriesData, setSeriesData] = useState<any>(null);
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

  const fetchUserData = async (series: any) => {
    if (!authToken) return;
    try {
      const { data } = await axios.get('https://balkanflix-server.vercel.app/api/private', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setIsSaved(data.favorites.includes(series.title));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const toggleSaved = async () => {
    if (!authToken) {
      navigation.navigate("Login");
      return;
    }

    const apiUrl = isSaved
      ? 'https://balkanflix-server.vercel.app/api/auth/removeFavorite'
      : 'https://balkanflix-server.vercel.app/api/auth/addFavorite';

    try {
      await axios.post(apiUrl, { title: seriesData?.title }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error updating favorites", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      {/* Banner */}
      {seriesData ? (
        <>
          <Image 
            source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData?.poster}` }} 
            className="w-full h-64 object-cover"
          />

          <View className="p-4">
            {/* Title & Bookmark */}
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-2xl font-bold">{seriesData?.title}</Text>
              <TouchableOpacity onPress={toggleSaved}>
                <Feather name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Genres */}
            <View className="flex-row flex-wrap mt-2">
              {seriesData?.genre?.map((genre: string) => (
                <Text key={genre} className="text-gray-300 bg-gray-700 px-2 py-1 rounded mr-2 mb-2">{genre}</Text>
              ))}
            </View>

            {/* Description */}
            <Text className="text-gray-400 mt-3">{seriesData?.description}</Text>

            {/* Episodes */}
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

              {/* Pagination */}
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

            {/* Previous / Next Season */}
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
