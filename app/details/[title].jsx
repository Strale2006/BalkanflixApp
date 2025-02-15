import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, Link, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import Icon from 'react-native-vector-icons/FontAwesome';

const DetailsScreen = () => {
  // Extract the dynamic parameter “title” from the URL.
  const { title } = useLocalSearchParams();
  const { token } = useGlobalContext(); // Assume you have a context that holds auth info

  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  // Remove spaces (or any undesired characters) for API consistency
  const trimmedTitle = title ? title.replace(/\s/g, '') : '';


  const [currentIndex, setCurrentIndex] = useState(0);
  const pageSize = 40;
  const visibleEpisodes = episodes.slice(currentIndex, currentIndex + pageSize);

  useEffect(() => {
    if (!title) return;

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
      // If not logged in, redirect to login page
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

  if (!seriesData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#1d284b" />
      </View>
    );
  }




  return (
    <ScrollView className="flex-1 bg-black dark:bg-[#121212]">
      <Image 
        source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData.poster}` }} 
        className="w-full h-[250px] object-cover rounded-b-3xl shadow-lg"
      />
      <View className="p-6">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-3xl font-pextrabold tracking-wide">{seriesData.title}</Text>
          
        </View>
        <View className="flex-row flex-wrap my-4 items-center">
          {seriesData.genre?.map((genre) => (
            <Text 
              key={genre} 
              className="text-gray-300 bg-gray-900 dark:bg-gray-800 px-3 py-1 font-pmedium rounded-lg mr-2 mb-2 text-sm tracking-wide"
            >
              {genre}
            </Text>
          ))}
          <TouchableOpacity onPress={toggleSaved} className="p-2 rounded-full bg-gray-900 dark:bg-gray-700">
            <Icon name={isSaved ? "bookmark" : "bookmark-o"} size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-400 my-4 text-base font-pregular leading-relaxed">{seriesData.description}</Text>
        <Text className="text-white text-xl font-psemibold my-4">Epizode:</Text>
        <View className="flex-row flex-wrap gap-3 justify-start">
          {visibleEpisodes.map((episode, index) => (
            <Link 
              key={index} 
              href={`/${encodeURIComponent(seriesData.title_params)}/${episode.ep}`}
              asChild
            >
              <TouchableOpacity className="w-12 h-12 bg-white/5 bg-gray-900 items-center justify-center rounded-lg active:bg-white/10">
                <Text className="text-white font-medium">{episode.ep}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
            {episodes.length > pageSize && (
              <View className="flex-row justify-center items-center gap-4 mt-6">
                <TouchableOpacity 
                  disabled={currentIndex === 0}
                  onPress={() => setCurrentIndex(Math.max(0, currentIndex - pageSize))}
                className="p-2.5 bg-white/5 rounded-lg"
                >
                  <Feather 
                    name="chevron-left" 
                    size={20} 
                    color={currentIndex === 0 ? "#FFFFFF40" : "white"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={currentIndex + pageSize >= episodes.length}
                  onPress={() => setCurrentIndex(currentIndex + pageSize)}
                  className="p-2.5 bg-white/5 rounded-lg"
                >
                  <Feather 
                    name="chevron-right" 
                    size={20} 
                    color={currentIndex + pageSize >= episodes.length ? "#FFFFFF40" : "white"} 
                  />
                </TouchableOpacity>
              </View>
            )}
            <View className="mt-8 space-y-4">
            {(seriesData.previous || seriesData.next) && (
              <View className="mt-6">
                {seriesData.previous && (
                  <Link href={`/${seriesData.previous[1]}`} className="text-blue-500 text-lg font-psemibold">
                    ← {seriesData.previous[0]} (Prethodna sezona)
                  </Link>
                )}
                {seriesData.next && (
                  <Link href={`/${seriesData.next[1]}`} className="text-blue-500 text-lg font-psemibold mt-3">
                    {seriesData.next[0]} (Sledeća sezona) →
                  </Link>
                )}
              </View>
            )}
          </View>
      </View>
    </ScrollView>
  );
};

export default DetailsScreen;