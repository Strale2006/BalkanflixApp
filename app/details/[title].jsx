import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, Link, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';

const DetailsScreen = () => {
  // Extract the dynamic parameter “title” from the URL.
  const { title } = useLocalSearchParams();
  const { token } = useGlobalContext(); // Assume you have a context that holds auth info

  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [visibleEpisodes, setVisibleEpisodes] = useState(40);
  const [isSaved, setIsSaved] = useState(false);

  // Remove spaces (or any undesired characters) for API consistency
  const trimmedTitle = title ? title.replace(/\s/g, '') : '';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#ff4757" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Image 
        source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData.poster}` }} 
        style={{ width: '100%', height: 250, resizeMode: 'cover' }}
      />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{seriesData.title}</Text>
          <TouchableOpacity onPress={toggleSaved}>
            <Feather name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
          {seriesData.genre?.map((genre) => (
            <Text 
              key={genre} 
              style={{ 
                color: '#ccc', 
                backgroundColor: '#333', 
                padding: 4, 
                borderRadius: 4, 
                marginRight: 6, 
                marginBottom: 6 
              }}
            >
              {genre}
            </Text>
          ))}
        </View>
        <Text style={{ color: '#ccc', marginVertical: 8 }}>{seriesData.description}</Text>
        <Text style={{ color: 'white', fontSize: 18, marginVertical: 8 }}>Episodes:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {episodes.slice(0, visibleEpisodes).map((episode, index) => (
            <Link 
              key={index} 
              href={`/watch/${trimmedTitle}/${episode.ep}`}
              style={{
                backgroundColor: '#E50914',
                padding: 8,
                borderRadius: 4,
                margin: 4,
                color: 'white',
                textDecorationLine: 'none'
              }}
            >
              {episode.ep}
            </Link>
          ))}
        </View>
        {episodes.length > 40 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <TouchableOpacity 
              disabled={visibleEpisodes <= 40} 
              onPress={() => setVisibleEpisodes(visibleEpisodes - 40)}
              style={{ padding: 8, backgroundColor: '#333', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              disabled={visibleEpisodes >= episodes.length} 
              onPress={() => setVisibleEpisodes(visibleEpisodes + 40)}
              style={{ padding: 8, backgroundColor: '#333', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {(seriesData.previous || seriesData.next) && (
          <View style={{ marginTop: 16 }}>
            {seriesData.previous && (
              <Link href={`/${seriesData.previous[1]}`} style={{ color: 'blue', fontSize: 18 }}>
                ← {seriesData.previous[0]} (Prethodna sezona)
              </Link>
            )}
            {seriesData.next && (
              <Link href={`/${seriesData.next[1]}`} style={{ color: 'blue', fontSize: 18, marginTop: 8 }}>
                {seriesData.next[0]} (Sledeća sezona) →
              </Link>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailsScreen;
