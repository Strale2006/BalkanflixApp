import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, Link, router } from 'expo-router';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Section Header (isti stil kao Episode.js) ──────────────────────────────
const SectionHeader = ({ title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
      <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>{title}</Text>
    </View>
);

// ─── Stat pločica ────────────────────────────────────────────────────────────
const StatBadge = ({ icon, label }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.09)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    }}>
      <MaterialIcons name={icon} size={13} color="#64748b" />
      <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#94a3b8' }}>{label}</Text>
    </View>
);

// ─── Žanr tag ────────────────────────────────────────────────────────────────
const GenreTag = ({ genre }) => (
    <View style={{
      backgroundColor: 'rgba(239,68,68,0.11)',
      borderWidth: 0.5,
      borderColor: 'rgba(239,68,68,0.22)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    }}>
      <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>{genre}</Text>
    </View>
);

// ─── Epizoda pill ─────────────────────────────────────────────────────────────
const EpisodePill = ({ episode, titleParams }) => (
    <Link href={`/${encodeURIComponent(titleParams)}/${episode?.ep ?? 1}`} asChild>
      <TouchableOpacity
          activeOpacity={0.75}
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: episode.isFiller
                ? 'rgba(139,92,246,0.18)'
                : 'rgba(255,255,255,0.04)',
            borderWidth: 0.5,
            borderColor: episode.isFiller
                ? 'rgba(139,92,246,0.35)'
                : 'rgba(255,255,255,0.09)',
          }}
      >
        <Text style={{
          fontSize: 12,
          fontFamily: 'Poppins-SemiBold',
          color: episode.isFiller ? '#a78bfa' : '#94a3b8',
        }}>
          {episode?.ep}
        </Text>
      </TouchableOpacity>
    </Link>
);

// ─── Status opcija ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: 'Gledam',   icon: 'play-circle',        color: '#34d399' },
  { key: 'Planiram', icon: 'list',                color: '#60a5fa' },
  { key: 'Završeno', icon: 'check-circle',        color: '#a3e635' },
  { key: 'Pauzirao', icon: 'pause-circle',        color: '#fbbf24' },
  { key: 'Odustao',  icon: 'times-circle',        color: '#f87171' },
];

// ─── Sezona kartica ───────────────────────────────────────────────────────────
const SeasonCard = ({ label, badge, imagePath, titleParam }) => (
    <TouchableOpacity
        onPress={() => router.push(`/details/${titleParam}`)}
        activeOpacity={0.85}
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.09)',
        }}
    >
      <Image
          source={{ uri: `https://images.balkanflix.com/${imagePath}` }}
          style={{ width: '100%', height: 110 }}
          resizeMode="cover"
      />
      <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 12, paddingTop: 32,
          }}
      >
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: 'rgba(239,68,68,0.85)',
          borderRadius: 20,
          paddingHorizontal: 9,
          paddingVertical: 3,
          marginBottom: 5,
        }}>
          <Text style={{ fontSize: 10, fontFamily: 'Poppins-Bold', color: '#fff' }}>{badge}</Text>
        </View>
        <Text numberOfLines={2} style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#f1f5f9' }}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
);

// ─── Glavna komponenta ────────────────────────────────────────────────────────
const DetailsScreen = () => {
  const { title } = useLocalSearchParams();
  const { token, user } = useGlobalContext();

  const [seriesData, setSeriesData]   = useState(null);
  const [episodes, setEpisodes]       = useState([]);
  const [isSaved, setIsSaved]         = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [watchStatus, setWatchStatus] = useState('');
  const [seriesId, setSeriesId]       = useState(null);

  const pageSize = 40;
  const visibleEpisodes = episodes.slice(currentIndex, currentIndex + pageSize);
  const encodedTitle = encodeURIComponent(title || '');

  // ── Fetch series ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!title) return;
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
            `https://balkanflix-server.up.railway.app/api/content/seriesDetail/${encodedTitle}`
        );
        if (data?.series?.[0]) {
          setSeriesData(data.series[0]);
          setSeriesId(data.series[0]._id);
          fetchUserData(data.series[0]);
        }
      } catch (error) {
        console.error('Error fetching series:', error);
      }
    };
    fetchData();
  }, [title]);

  // ── Fetch episodes ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesData) return;
    const fetchEpisodes = async () => {
      try {
        const { data } = await axios.get(
            `https://balkanflix-server.up.railway.app/api/episode/episodeCount/${seriesData.title_params}`
        );
        setEpisodes(data?.episode || []);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };
    fetchEpisodes();
  }, [seriesData]);

  // ── Fetch user favorites ──────────────────────────────────────────────────
  const fetchUserData = async (series) => {
    if (!token) return;
    try {
      const { data } = await axios.get('https://balkanflix-server.up.railway.app/api/private', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(data.favorites.includes(series.title));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // ── Toggle bookmark ───────────────────────────────────────────────────────
  const toggleSaved = async () => {
    if (!token) { router.push('/login'); return; }
    const apiUrl = isSaved
        ? 'https://balkanflix-server.up.railway.app/api/auth/removeFavorite'
        : 'https://balkanflix-server.up.railway.app/api/auth/addFavorite';
    try {
      await axios.post(apiUrl, { title: seriesData?.title }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error updating favorites', error);
    }
  };

  // ── Fetch watch status ────────────────────────────────────────────────────
  const fetchWatchStatus = async () => {
    if (!token) { router.push('/login'); return; }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const { data } = await axios.get(
          'https://balkanflix-server.up.railway.app/api/auth/getWatchStatus', config
      );
      for (let serijal of data.watchStatus) {
        if (seriesData?.title_params === serijal.seriesId?.title_params) {
          setWatchStatus(serijal.status);
          break;
        }
      }
    } catch (error) {
      console.error('Error fetching watch status:', error);
    }
  };

  // ── Set watch status ──────────────────────────────────────────────────────
  const handleSelectStatus = async (status) => {
    setStatusModalOpen(false);
    if (!token) { router.push('/login'); return; }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.post(
          'https://balkanflix-server.up.railway.app/api/auth/setWatchStatus',
          { seriesId, status },
          config
      );
      setWatchStatus(status);
    } catch (error) {
      console.error('Error setting watch status:', error);
    }
  };

  const openStatusModal = () => {
    fetchWatchStatus();
    setStatusModalOpen(true);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!seriesData) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101420' }}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
    );
  }

  const activeStatus = STATUS_OPTIONS.find(s => s.key === watchStatus);

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#101420' }}>
        <StatusBar barStyle="light-content" />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

          {/* ── Hero poster sa gradientom ── */}
          <View style={{ position: 'relative' }}>
            <Image
                source={{ uri: `https://images.balkanflix.com/${seriesData.poster}` }}
                style={{ width: '100%', height: 280 }}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(16,20,32,0.7)', '#101420']}
                locations={[0.2, 0.7, 1]}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 }}
            />

            {/* Nazad dugme */}
            <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.75}
                style={{
                  position: 'absolute', top: 14, left: 16,
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}
            >
              <MaterialIcons name="arrow-back-ios" size={15} color="#fca5a5" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>

          {/* ── Poster + naslov ── */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: -60, gap: 14, alignItems: 'flex-end', marginBottom: 16 }}>
            <Image
                source={{ uri: `https://images.balkanflix.com/${seriesData.img}` }}
                style={{
                  width: 100, height: 145,
                  borderRadius: 12,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                resizeMode="cover"
            />
            <View style={{ flex: 1, paddingBottom: 4, gap: 6 }}>
              <Text
                  numberOfLines={3}
                  style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#f1f5f9', lineHeight: 24 }}
              >
                {seriesData.title}
              </Text>

              {/* Žanrovi */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {seriesData.genre?.map((genre, i) => (
                    <GenreTag key={i} genre={genre} />
                ))}
              </View>

              {/* Stat badges */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                <StatBadge icon="star" label={`${seriesData.MAL_ocena || 'N/A'}/10`} />
                <StatBadge icon="remove-red-eye" label={`${seriesData.totalViews || 0}`} />
                {seriesData.status && <StatBadge icon="tv" label={seriesData.status} />}
              </View>
            </View>
          </View>

          {/* ── Action dugmad ── */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 }}>
            {/* Bookmark */}
            <TouchableOpacity
                onPress={toggleSaved}
                activeOpacity={0.8}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                  paddingVertical: 11, borderRadius: 12,
                  backgroundColor: isSaved ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                  borderWidth: 0.5,
                  borderColor: isSaved ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.09)',
                }}
            >
              <Icon name={isSaved ? 'bookmark' : 'bookmark-o'} size={14} color={isSaved ? '#f87171' : '#64748b'} />
              <Text style={{
                fontSize: 13, fontFamily: 'Poppins-SemiBold',
                color: isSaved ? '#f87171' : '#64748b',
              }}>
                {isSaved ? 'Sačuvano' : 'Sačuvaj'}
              </Text>
            </TouchableOpacity>

            {/* Status */}
            <TouchableOpacity
                onPress={openStatusModal}
                activeOpacity={0.8}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                  paddingVertical: 11, borderRadius: 12,
                  backgroundColor: watchStatus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  borderWidth: 0.5,
                  borderColor: watchStatus ? (activeStatus?.color + '44') : 'rgba(255,255,255,0.09)',
                }}
            >
              <FontAwesome5
                  name={activeStatus?.icon || 'list'}
                  size={13}
                  color={activeStatus?.color || '#64748b'}
              />
              <Text style={{
                fontSize: 13, fontFamily: 'Poppins-SemiBold',
                color: activeStatus?.color || '#64748b',
              }}>
                {watchStatus || 'Dodaj status'}
              </Text>
            </TouchableOpacity>

            {/* Play dugme */}
            {episodes.length > 0 && (
                <TouchableOpacity
                    onPress={() => router.push(`/${encodeURIComponent(seriesData.title_params)}/1`)}
                    activeOpacity={0.85}
                    style={{
                      width: 46, height: 46, borderRadius: 12,
                      backgroundColor: '#E50914',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                >
                  <MaterialIcons name="play-arrow" size={22} color="#fff" />
                </TouchableOpacity>
            )}
          </View>

          {/* ── Separator ── */}
          <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginBottom: 22 }} />

          {/* ── Opis ── */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <SectionHeader title="O seriji" />
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#64748b', lineHeight: 21 }}>
              {seriesData.description}
            </Text>
          </View>

          {/* ── Separator ── */}
          <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginBottom: 22 }} />

          {/* ── Epizode ── */}
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
                <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>Epizode</Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(239,68,68,0.11)',
                borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.22)',
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>
                  {episodes.length} ep
                </Text>
              </View>
            </View>

            {/* Epizoda grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {visibleEpisodes.map((episode, index) => (
                  <EpisodePill
                      key={index}
                      episode={episode}
                      titleParams={seriesData?.title_params}
                  />
              ))}
            </View>

            {/* Paginacija */}
            {episodes.length > pageSize && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18 }}>
                  <TouchableOpacity
                      disabled={currentIndex === 0}
                      onPress={() => setCurrentIndex(Math.max(0, currentIndex - pageSize))}
                      style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: currentIndex === 0 ? 0.3 : 1,
                      }}
                  >
                    <Feather name="chevron-left" size={18} color="white" />
                  </TouchableOpacity>

                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
                  }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#94a3b8' }}>
                      {currentIndex + 1}–{Math.min(currentIndex + pageSize, episodes.length)} / {episodes.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                      disabled={currentIndex + pageSize >= episodes.length}
                      onPress={() => setCurrentIndex(currentIndex + pageSize)}
                      style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: currentIndex + pageSize >= episodes.length ? 0.3 : 1,
                      }}
                  >
                    <Feather name="chevron-right" size={18} color="white" />
                  </TouchableOpacity>
                </View>
            )}
          </View>

          {/* ── Sezone ── */}
          {(seriesData.previous || seriesData.next) && (
              <>
                <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginVertical: 22 }} />
                <View style={{ paddingHorizontal: 16, marginBottom: 28 }}>
                  <SectionHeader title="Druge sezone" />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {seriesData.previous && (
                        <SeasonCard
                            label={seriesData.previous[0]}
                            badge="← Prethodna"
                            imagePath={seriesData.previous[2] || seriesData.img}
                            titleParam={seriesData.previous[1]}
                        />
                    )}
                    {seriesData.next && (
                        <SeasonCard
                            label={seriesData.next[0]}
                            badge="Sledeća →"
                            imagePath={seriesData.next[2] || seriesData.img}
                            titleParam={seriesData.next[1]}
                        />
                    )}
                  </View>
                </View>
              </>
          )}

        </ScrollView>

        {/* ── Status Modal ──────────────────────────────────────────────────── */}
        <Modal
            visible={statusModalOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setStatusModalOpen(false)}
        >
          <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
              onPress={() => setStatusModalOpen(false)}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={{
                backgroundColor: '#161b2e',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                borderTopWidth: 0.5, borderColor: 'rgba(255,255,255,0.09)',
                paddingTop: 8, paddingBottom: 36, paddingHorizontal: 20,
              }}>
                {/* Drag handle */}
                <View style={{
                  width: 36, height: 4, borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignSelf: 'center', marginBottom: 20,
                }} />

                <SectionHeader title="Status gledanja" />

                <Text style={{
                  fontSize: 12, fontFamily: 'Poppins-Regular', color: '#475569',
                  marginBottom: 16, lineHeight: 18,
                }}>
                  Izaberi status za: <Text style={{ color: '#94a3b8', fontFamily: 'Poppins-SemiBold' }}>{seriesData.title}</Text>
                </Text>

                {STATUS_OPTIONS.map((option) => {
                  const isSelected = watchStatus === option.key;
                  return (
                      <TouchableOpacity
                          key={option.key}
                          onPress={() => handleSelectStatus(option.key)}
                          activeOpacity={0.8}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 14,
                            paddingVertical: 14, paddingHorizontal: 16,
                            borderRadius: 14, marginBottom: 8,
                            backgroundColor: isSelected
                                ? (option.color + '18')
                                : 'rgba(255,255,255,0.03)',
                            borderWidth: 0.5,
                            borderColor: isSelected
                                ? (option.color + '44')
                                : 'rgba(255,255,255,0.07)',
                          }}
                      >
                        <View style={{
                          width: 36, height: 36, borderRadius: 18,
                          backgroundColor: isSelected ? (option.color + '22') : 'rgba(255,255,255,0.05)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FontAwesome5
                              name={option.icon}
                              size={15}
                              color={isSelected ? option.color : '#475569'}
                          />
                        </View>
                        <Text style={{
                          flex: 1, fontSize: 14,
                          fontFamily: isSelected ? 'Poppins-SemiBold' : 'Poppins-Regular',
                          color: isSelected ? option.color : '#94a3b8',
                        }}>
                          {option.key}
                        </Text>
                        {isSelected && (
                            <MaterialIcons name="check-circle" size={18} color={option.color} />
                        )}
                      </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                    onPress={() => setStatusModalOpen(false)}
                    activeOpacity={0.75}
                    style={{
                      marginTop: 8,
                      paddingVertical: 13,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderWidth: 0.5,
                      borderColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                    }}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#475569' }}>
                    Zatvori
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
  );
};

export default DetailsScreen;