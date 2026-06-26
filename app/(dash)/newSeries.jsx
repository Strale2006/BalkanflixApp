import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const AdminDashboard = () => {
  // State for "Napravi Serijal"
  const [seriesMal, setSeriesMal] = useState('');
  const [seriesTmdb, setSeriesTmdb] = useState('');
  const [seriesLoading, setSeriesLoading] = useState(false);

  // State for "Napravi Serijal (Bez Postera)"
  const [noPosterMal, setNoPosterMal] = useState('');
  const [noPosterLoading, setNoPosterLoading] = useState(false);

  // State for "Napravi Film"
  const [movieMal, setMovieMal] = useState('');
  const [movieTmdb, setMovieTmdb] = useState('');
  const [movieLoading, setMovieLoading] = useState(false);

  const showAlert = (title, message) => {
    Alert.alert(title, message);
  };

  // Create Series (with TMDB)
  const handleSeriesSubmit = async () => {
    if (!seriesMal.trim() || !seriesTmdb.trim()) {
      showAlert('Greška', 'Unesite MAL ID i TMDB ID.');
      return;
    }
    setSeriesLoading(true);
    try {
      await axios.post('https://balkanflix-server.up.railway.app/api/content/create', {
        seriesCode: seriesMal,
        tmdbSeriesId: seriesTmdb,
      });
      showAlert('Uspeh', 'Serijal je uspešno kreiran!');
      setSeriesMal('');
      setSeriesTmdb('');
    } catch (err) {
      showAlert('Greška', 'Kreiranje serijala nije uspelo.');
      console.error(err);
    } finally {
      setSeriesLoading(false);
    }
  };

  // Create Series without TMDB (only MAL)
  const handleNoPosterSubmit = async () => {
    if (!noPosterMal.trim()) {
      showAlert('Greška', 'Unesite MAL ID.');
      return;
    }
    setNoPosterLoading(true);
    try {
      await axios.post('https://balkanflix-server.up.railway.app/api/content/createNoTMDB', {
        seriesCode: noPosterMal,
      });
      showAlert('Uspeh', 'Serijal (bez postera) je kreiran!');
      setNoPosterMal('');
    } catch (err) {
      showAlert('Greška', 'Kreiranje nije uspelo.');
      console.error(err);
    } finally {
      setNoPosterLoading(false);
    }
  };

  // Create Movie
  const handleMovieSubmit = async () => {
    if (!movieMal.trim() || !movieTmdb.trim()) {
      showAlert('Greška', 'Unesite MAL ID i TMDB ID.');
      return;
    }
    setMovieLoading(true);
    try {
      await axios.post('https://balkanflix-server.up.railway.app/api/content/createMovies', {
        seriesCode: movieMal,
        tmdbSeriesId: movieTmdb,
      });
      showAlert('Uspeh', 'Film je uspešno kreiran!');
      setMovieMal('');
      setMovieTmdb('');
    } catch (err) {
      showAlert('Greška', 'Kreiranje filma nije uspelo.');
      console.error(err);
    } finally {
      setMovieLoading(false);
    }
  };

  return (
      <SafeAreaView className="flex-1 bg-gray-950">
        {/* Background gradients */}
        <View className="absolute inset-0">
          <View className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
          <View className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        </View>

        <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            className="flex-1 px-5 pt-8"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <MaterialCommunityIcons name="shield-account" size={48} color="#06b6d4" />
            <Text className="text-white text-3xl font-pbold mt-2">Anime Serijali</Text>
            <Text className="text-gray-400 font-pregular text-center mt-1">
              Kreirajte nove serijale i filmove
            </Text>
          </View>

          {/* 1. Napravi Serijal */}
          <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-5 border border-gray-700 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-cyan-500/20 p-2 rounded-full">
                <MaterialCommunityIcons name="television" size={24} color="#06b6d4" />
              </View>
              <View className="ml-3">
                <Text className="text-white font-psemibold text-lg">Napravi Serijal</Text>
                <Text className="text-gray-400 font-pregular text-xs">Unesite MAL i TMDB ID</Text>
              </View>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 font-pmedium text-sm mb-1">MAL ID</Text>
                <TextInput
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                    placeholder="npr. 9253"
                    placeholderTextColor="#6b7280"
                    value={seriesMal}
                    onChangeText={setSeriesMal}
                    keyboardType="numeric"
                />
              </View>
              <View>
                <Text className="text-gray-300 font-pmedium text-sm mb-1">TMDB ID</Text>
                <TextInput
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                    placeholder="npr. 1399"
                    placeholderTextColor="#6b7280"
                    value={seriesTmdb}
                    onChangeText={setSeriesTmdb}
                    keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
                onPress={handleSeriesSubmit}
                disabled={seriesLoading}
                className={`mt-5 py-3 rounded-xl flex-row items-center justify-center ${
                    seriesLoading ? 'bg-gray-600' : 'bg-cyan-600'
                }`}
            >
              {seriesLoading ? (
                  <ActivityIndicator color="white" size="small" />
              ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle" size={20} color="white" />
                    <Text className="text-white font-psemibold ml-2">Kreiraj Serijal</Text>
                  </>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. Napravi Serijal (Bez Postera) */}
          <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-5 border border-gray-700 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-500/20 p-2 rounded-full">
                <MaterialCommunityIcons name="image-off" size={24} color="#f97316" />
              </View>
              <View className="ml-3">
                <Text className="text-white font-psemibold text-lg">Napravi Serijal (Bez Postera)</Text>
                <Text className="text-gray-400 font-pregular text-xs">Unesite samo MAL ID</Text>
              </View>
            </View>

            <View>
              <Text className="text-gray-300 font-pmedium text-sm mb-1">MAL ID</Text>
              <TextInput
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                  placeholder="npr. 9253"
                  placeholderTextColor="#6b7280"
                  value={noPosterMal}
                  onChangeText={setNoPosterMal}
                  keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
                onPress={handleNoPosterSubmit}
                disabled={noPosterLoading}
                className={`mt-5 py-3 rounded-xl flex-row items-center justify-center ${
                    noPosterLoading ? 'bg-gray-600' : 'bg-orange-600'
                }`}
            >
              {noPosterLoading ? (
                  <ActivityIndicator color="white" size="small" />
              ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle" size={20} color="white" />
                    <Text className="text-white font-psemibold ml-2">Kreiraj Serijal</Text>
                  </>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Napravi Film */}
          <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-5 border border-gray-700 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-red-500/20 p-2 rounded-full">
                <MaterialCommunityIcons name="filmstrip" size={24} color="#ef4444" />
              </View>
              <View className="ml-3">
                <Text className="text-white font-psemibold text-lg">Napravi Film</Text>
                <Text className="text-gray-400 font-pregular text-xs">Unesite MAL i TMDB ID</Text>
              </View>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 font-pmedium text-sm mb-1">MAL ID</Text>
                <TextInput
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                    placeholder="npr. 9253"
                    placeholderTextColor="#6b7280"
                    value={movieMal}
                    onChangeText={setMovieMal}
                    keyboardType="numeric"
                />
              </View>
              <View>
                <Text className="text-gray-300 font-pmedium text-sm mb-1">TMDB ID</Text>
                <TextInput
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                    placeholder="npr. 1399"
                    placeholderTextColor="#6b7280"
                    value={movieTmdb}
                    onChangeText={setMovieTmdb}
                    keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
                onPress={handleMovieSubmit}
                disabled={movieLoading}
                className={`mt-5 py-3 rounded-xl flex-row items-center justify-center ${
                    movieLoading ? 'bg-gray-600' : 'bg-red-600'
                }`}
            >
              {movieLoading ? (
                  <ActivityIndicator color="white" size="small" />
              ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle" size={20} color="white" />
                    <Text className="text-white font-psemibold ml-2">Kreiraj Film</Text>
                  </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

export default AdminDashboard;