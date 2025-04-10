import React, { useState } from 'react';
import {ScrollView, View, Text, Alert } from 'react-native';
import axios from 'axios';
import FormCard from '../../components/FormCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const newSeries = () => {
  // State for "Notifikacija" card (if needed later)
  const [notifMal, setNotifMal] = useState('');
  const [notifTmdb, setNotifTmdb] = useState('');

  // State for "Napravi Serijal" card
  const [seriesMal, setSeriesMal] = useState('');
  const [seriesTmdb, setSeriesTmdb] = useState('');

  // State for "Napravi Serijal (Bez Postera)" card (only MAL ID)
  const [seriesNoTmdb, setSeriesNoTmdb] = useState('');

  // State for "Napravi Film" card
  const [movieMal, setMovieMal] = useState('');
  const [movieTmdb, setMovieTmdb] = useState('');

  const showAlert = (message, type) => {
    Alert.alert(type === 'success' ? 'Success' : 'Error', message);
  };

  const handleNotificationSubmit = () => {
    // Check required fields
    if (!notifMal.trim() || !notifTmdb.trim()) {
      showAlert('Both MAL and TMDB fields are required for notifications.', 'error');
      return;
    }
    // For demo purposes, just alert the values.
    showAlert(`Notification submitted: ${notifMal} & ${notifTmdb}`, 'success');
  };

  const handleSeriesSubmit = async () => {
    // Validate input fields
    if (!seriesMal.trim() || !seriesTmdb.trim()) {
      showAlert('Both MAL and TMDB fields are required for creating a series.', 'error');
      return;
    }

    try {
      await axios.post(
        'https://balkanflix-server.up.railway.app/api/content/create',
        { seriesCode: seriesMal, tmdbSeriesId: seriesTmdb }
      );
      showAlert('Anime successfully created!', 'success');
    } catch (err) {
      showAlert('Failed to create anime!', 'error');
    }
  };

  const handleSeriesNoTmdbSubmit = async () => {
    // Validate input field
    if (!seriesNoTmdb.trim()) {
      showAlert('MAL field is required for creating a series (Bez Postera).', 'error');
      return;
    }

    try {
      await axios.post(
        'https://balkanflix-server.up.railway.app/api/content/createNoTMDB',
        { seriesCode: seriesNoTmdb }
      );
      showAlert('Anime successfully created!', 'success');
    } catch (err) {
      showAlert('Failed to create anime!', 'error');
    }
  };

  const handleMovieSubmit = async () => {
    // Validate input fields
    if (!movieMal.trim() || !movieTmdb.trim()) {
      showAlert('Both MAL and TMDB fields are required for creating a movie.', 'error');
      return;
    }

    try {
      await axios.post(
        'https://balkanflix-server.up.railway.app/api/content/createMovies',
        { seriesCode: movieMal, tmdbSeriesId: movieTmdb }
      );
      showAlert('Movie successfully created!', 'success');
    } catch (err) {
      showAlert('Failed to create movie!', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950 p-6 relative">
      {/* Animated background elements */}
      <View className="absolute inset-0">
        <View className="absolute -top-1/2 -left-1/2 w-full h-full bg-cyan-500/20 rounded-full blur-3xl" />
        <View className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/20 rounded-full blur-3xl" />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="relative">
        <Text className="text-3xl font-pbold text-center mb-8 text-cyan-400">
          Admin Dashboard
        </Text>
        <View className="space-y-6">
          <FormCard
            index={1}
            title="Napravi Serijal"
            subtitle="Enter the anime IDs to get details"
            buttonText="Kreiraj Serijal"
            onSubmit={handleSeriesSubmit}
            malValue={seriesMal}
            tmdbValue={seriesTmdb}
            onChangeMal={setSeriesMal}
            onChangeTmdb={setSeriesTmdb}
          />
          <FormCard
            index={2}
            title="Napravi Serijal (Bez Postera)"
            subtitle="Enter the anime ID to get details"
            buttonText="Kreiraj Serijal"
            onSubmit={handleSeriesNoTmdbSubmit}
            malValue={seriesNoTmdb}
            hasTmdb={false}
            // For this card, we do not require a TMDB input so we pass empty string and a no-op function
            tmdbValue={''}
            onChangeMal={setSeriesNoTmdb}
            onChangeTmdb={() => {}}
          />
          <FormCard
            index={3}
            title="Napravi Film"
            subtitle="Enter the anime IDs to get details"
            buttonText="Kreiraj Film"
            onSubmit={handleMovieSubmit}
            malValue={movieMal}
            tmdbValue={movieTmdb}
            onChangeMal={setMovieMal}
            onChangeTmdb={setMovieTmdb}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default newSeries;
