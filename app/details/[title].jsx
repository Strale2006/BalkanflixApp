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
  const trimmedTitle = seriesData?.title_params || title?.replace(/\s/g, '') || '';



  const [currentIndex, setCurrentIndex] = useState(0);
  const pageSize = 40;
  const visibleEpisodes = episodes.slice(currentIndex, currentIndex + pageSize);

  const encodedTitle = encodeURIComponent(title || '');


  useEffect(() => {
    if (!title) return;

    const fetchData = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/content/seriesDetail/${encodedTitle}`);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
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
          <View className="flex-row justify-center items-center gap-5 mt-8">
            <TouchableOpacity 
              disabled={currentIndex === 0}
              onPress={() => setCurrentIndex(Math.max(0, currentIndex - pageSize))}
              className={`p-3 rounded-full bg-zinc-800 active:bg-zinc-700 ${currentIndex === 0 ? "opacity-50" : ""}`}
              style={{ elevation: 2 }}
            >
              <Feather 
                name="chevron-left" 
                size={24} 
                color={currentIndex === 0 ? "#a1a1aa" : "white"} 
              />
            </TouchableOpacity>

            <Text className="text-zinc-300 font-medium text-sm">
              Page {Math.ceil(currentIndex/pageSize) + 1} of {Math.ceil(episodes.length/pageSize)}
            </Text>

            <TouchableOpacity 
              disabled={currentIndex + pageSize >= episodes.length}
              onPress={() => setCurrentIndex(currentIndex + pageSize)}
              className={`p-3 rounded-full bg-zinc-800 active:bg-zinc-700 ${currentIndex + pageSize >= episodes.length ? "opacity-50" : ""}`}
              style={{ elevation: 2 }}
            >
              <Feather 
                name="chevron-right" 
                size={24} 
                color={currentIndex + pageSize >= episodes.length ? "#a1a1aa" : "white"} 
              />
            </TouchableOpacity>
          </View>
        )}

        {(seriesData.previous || seriesData.next) && (
          <View className="mt-8 bg-zinc-800 rounded-xl p-4">
            <View className="flex-row justify-between items-center">
              {seriesData.previous && (
                <TouchableOpacity 
                  className="flex-row items-center bg-zinc-700 px-4 py-2 rounded-lg active:bg-zinc-600"
                  onPress={() => router.push(`/details/${seriesData.previous[1]}`)}
                >
                  <Feather name="chevron-left" size={18} color="#60a5fa" />
                  <Text className="text-blue-400 ml-2 font-medium">
                    {seriesData.previous[0]}
                  </Text>
                </TouchableOpacity>
              )}

              {seriesData.next && (
                <TouchableOpacity 
                  className="flex-row items-center bg-zinc-700 px-4 py-2 rounded-lg active:bg-zinc-600"
                  onPress={() => router.push(`/details/${seriesData.next[1]}`)}
                >
                  <Text className="text-blue-400 mr-2 font-medium">
                    {seriesData.next[0]}
                  </Text>
                  <Feather name="chevron-right" size={18} color="#60a5fa" />
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-zinc-400 text-center mt-3 text-sm">
              {seriesData.previous ? 'Previous Season' : ''} 
              {seriesData.previous && seriesData.next ? ' • ' : ''}
              {seriesData.next ? 'Next Season' : ''}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailsScreen;