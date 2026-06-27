import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import BalkanflixPlayer from '../../components/BalkanflixPlayer';

// ─── Sekcija zaglavlje ────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
        <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>{title}</Text>
    </View>
);

// ─── Pill za epizodu ──────────────────────────────────────────────────────────
const EpisodePill = ({ episode, currentEp, titleParams }) => {
    const isCurrent = episode.ep.toString() === currentEp;
    const isFiller = episode.isFiller;

    return (
        <Link href={`/${encodeURIComponent(titleParams)}/${episode.ep}`} asChild>
            <TouchableOpacity
                activeOpacity={0.75}
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCurrent
                        ? 'rgba(239,68,68,0.85)'
                        : isFiller
                            ? 'rgba(139,92,246,0.18)'
                            : 'rgba(255,255,255,0.04)',
                    borderWidth: 0.5,
                    borderColor: isCurrent
                        ? 'rgba(239,68,68,0.5)'
                        : isFiller
                            ? 'rgba(139,92,246,0.35)'
                            : 'rgba(255,255,255,0.09)',
                }}
            >
                <Text
                    style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-SemiBold',
                        color: isCurrent ? '#fff' : isFiller ? '#a78bfa' : '#94a3b8',
                    }}
                >
                    {episode.ep}
                </Text>
            </TouchableOpacity>
        </Link>
    );
};

// ─── Dugme servera ────────────────────────────────────────────────────────────
const ServerButton = ({ server, selected, onPress }) => {
    const isActive = selected === server.id;
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                borderWidth: 0.5,
                borderColor: isActive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)',
            }}
        >
            <Text
                style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: isActive ? '#f87171' : '#64748b',
                }}
            >
                {server.name}
            </Text>
        </TouchableOpacity>
    );
};

// ─── Dugme za navigaciju ──────────────────────────────────────────────────────
const NavButton = ({ label, icon, iconSide = 'left', onPress, disabled }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.85)',
            borderWidth: disabled ? 0.5 : 0,
            borderColor: 'rgba(255,255,255,0.08)',
            opacity: disabled ? 0.45 : 1,
        }}
    >
        {iconSide === 'left' && (
            <FontAwesome5 name={icon} size={13} color={disabled ? '#475569' : '#fff'} />
        )}
        <Text
            style={{
                fontSize: 13,
                fontFamily: 'Poppins-SemiBold',
                color: disabled ? '#475569' : '#fff',
            }}
        >
            {label}
        </Text>
        {iconSide === 'right' && (
            <FontAwesome5 name={icon} size={13} color={disabled ? '#475569' : '#fff'} />
        )}
    </TouchableOpacity>
);

// ─── Glavna komponenta ────────────────────────────────────────────────────────
const Episode = () => {
    const { token, user } = useGlobalContext();
    const { ep, title } = useLocalSearchParams();

    const [seriesData, setSeriesData] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [inputEpisode, setInputEpisode] = useState('');

    const [selectedServer, setSelectedServer] = useState('Balkanflix');
    const [availableServers, setAvailableServers] = useState([]);
    const [episodeSrc, setEpisodeSrc] = useState('');
    const [episodeBf, setEpisodeBf] = useState('');
    const [intro, setIntro] = useState(null);

    const startTime = useRef(new Date());

    // ── Snimanje odgledane epizode ────────────────────────────────────────────
    const recordEpisodeWatch = async (episodeNumber, seriesTitle) => {
        if (!token) return;
        const config = {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        };
        try {
            await axios.post(
                'https://balkanflix-server.up.railway.app/api/auth/watchedEpisode',
                { user: user.username, seriesTitle, episodeNumber },
                config
            );
        } catch (error) {
            console.error('Error recording episode watch:', error);
        }
    };

    const recordEpisodeWatchFull = async (episodeNumber, seriesTitle, start, end) => {
        if (!token) return;
        const config = {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        };
        try {
            await axios.post(
                'https://balkanflix-server.up.railway.app/api/auth/watchedEpisodeFull',
                { user: user.username, seriesTitle, episodeNumber, startTime: start, endTime: end },
                config
            );
        } catch (error) {
            console.error('Error recording full watch:', error);
        }
    };

    // ── BB view tracking ──────────────────────────────────────────────────────
    const handleBBView = async () => {
        try {
            await axios.post('https://balkanflix-server.up.railway.app/api/episode/addBBView', {
                title_params: title,
                episodeNumber: ep,
            });
        } catch (err) {
            console.error('BB view error:', err);
        }
    };

    // ── Fetch serije ──────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchSeriesData = async () => {
            try {
                const { data } = await axios.get(
                    `https://balkanflix-server.up.railway.app/api/content/series/${title}`
                );
                setSeriesData(data.series);
            } catch (error) {
                console.error('Error fetching series data:', error);
            }
        };
        fetchSeriesData();
    }, [title]);

    // ── Fetch epizoda ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchEpisodeData = async () => {
            try {
                const { data } = await axios.get(
                    `https://balkanflix-server.up.railway.app/api/episode/episodesInfo/${title}`
                );
                const series = data.data;
                if (!series) return;

                const foundEp = series.episodes.find((e) => e.ep.toString() === ep);
                if (!foundEp) return;

                setEpisodes(series.episodes || []);

                const fmSrc = foundEp.src ? `https://filemoon.to/e/${foundEp.src}` : '';
                setEpisodeSrc(fmSrc);

                const bfSrc = foundEp.bb || '';
                setEpisodeBf(bfSrc);

                setIntro(foundEp.intro || null);

                await axios.patch(
                    `https://balkanflix-server.up.railway.app/api/episode/episodeViews/${series.title_params}/${foundEp.ep}`
                );

                await recordEpisodeWatch(foundEp.ep, title);
            } catch (error) {
                console.error('Error fetching episode data:', error);
            }
        };

        fetchEpisodeData();
    }, [title, ep]);

    // ── Serveri ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const servers = [];
        if (episodeBf) servers.push({ id: 'Balkanflix', name: 'Balkanflix' });
        if (episodeSrc) servers.push({ id: 'Filemoon', name: 'Filemoon' });
        setAvailableServers(servers);

        if (servers.length > 0 && !servers.find((s) => s.id === selectedServer)) {
            setSelectedServer(servers[0].id);
        }
    }, [episodeSrc, episodeBf, selectedServer]);

    // ── Unmount tracking ──────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            const endTime = new Date();
            recordEpisodeWatchFull(ep, title, startTime.current, endTime);
        };
    }, [ep, title]);

    // ── Navigacija na epizodu ─────────────────────────────────────────────────
    const handleGoToEpisode = () => {
        const episodeNumber = parseInt(inputEpisode);
        if (episodeNumber > 0 && episodeNumber <= episodes.length) {
            router.push(`/${encodeURIComponent(seriesData?.title_params)}/${episodeNumber}`);
        } else {
            Alert.alert('Neispravan broj epizode');
        }
    };

    const currentVideoUrl =
        selectedServer === 'Balkanflix'
            ? `https://server.balkanflix.com/file/Balkanflix/${episodeBf}`
            : episodeSrc;

    const epNum = parseInt(ep);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#101420' }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 48 : 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 12,
                    }}
                >
                    <Link href={`/details/${seriesData?.title_params}`} asChild>
                        <TouchableOpacity
                            activeOpacity={0.75}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                borderWidth: 0.5,
                                borderColor: 'rgba(255,255,255,0.1)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MaterialIcons name="arrow-back-ios" size={15} color="#fca5a5" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                    </Link>

                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            numberOfLines={1}
                            style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}
                        >
                            {seriesData?.title || '—'}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                marginTop: 2,
                                alignSelf: 'flex-start',
                                backgroundColor: 'rgba(239,68,68,0.13)',
                                borderWidth: 0.5,
                                borderColor: 'rgba(239,68,68,0.28)',
                                borderRadius: 20,
                                paddingHorizontal: 9,
                                paddingVertical: 2,
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={13} color="#f87171" />
                            <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>
                                Epizoda {ep}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Video Player ── */}
                <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                    <View
                        style={{
                            aspectRatio: 16 / 9,
                            borderRadius: 16,
                            overflow: 'hidden',
                            backgroundColor: '#0d1117',
                            borderWidth: 0.5,
                            borderColor: 'rgba(255,255,255,0.08)',
                        }}
                    >
                        {currentVideoUrl ? (
                            selectedServer === 'Balkanflix' ? (
                                <BalkanflixPlayer
                                    url={currentVideoUrl}
                                    intro={intro}
                                    onValidView={handleBBView}
                                />
                            ) : (
                                <WebView
                                    allowsFullscreenVideo
                                    source={{ uri: currentVideoUrl }}
                                    style={{ flex: 1, backgroundColor: '#0d1117' }}
                                />
                            )
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#0d1117',
                                    gap: 8,
                                }}
                            >
                                <MaterialIcons name="videocam-off" size={32} color="#334155" />
                                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Medium', color: '#475569' }}>
                                    Video nije dostupan
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Selekcija servera ── */}
                {availableServers.length > 1 && (
                    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 }}>
                        {availableServers.map((server) => (
                            <ServerButton
                                key={server.id}
                                server={server}
                                selected={selectedServer}
                                onPress={() => setSelectedServer(server.id)}
                            />
                        ))}
                    </View>
                )}

                {/* ── Navigacija ── */}
                <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                    <SectionHeader title="Navigacija" />

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <NavButton
                            label="Prethodna"
                            icon="step-backward"
                            iconSide="left"
                            disabled={epNum <= 1}
                            onPress={() =>
                                router.push(`/${encodeURIComponent(seriesData?.title_params)}/${epNum - 1}`)
                            }
                        />
                        <NavButton
                            label="Sledeća"
                            icon="step-forward"
                            iconSide="right"
                            disabled={epNum >= episodes.length}
                            onPress={() =>
                                router.push(`/${encodeURIComponent(seriesData?.title_params)}/${epNum + 1}`)
                            }
                        />
                    </View>

                    <TextInput
                        style={{
                            width: '100%',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 0.5,
                            borderColor: 'rgba(255,255,255,0.09)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 11,
                            color: '#f1f5f9',
                            fontSize: 14,
                            fontFamily: 'Poppins-Regular',
                            marginBottom: 12,
                        }}
                        placeholder="Idi na epizodu..."
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        value={inputEpisode}
                        onChangeText={setInputEpisode}
                        onSubmitEditing={handleGoToEpisode}
                    />

                    {/* Horizontalni scroll epizoda */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                    >
                        {episodes.map((episode) => (
                            <EpisodePill
                                key={episode.ep}
                                episode={episode}
                                currentEp={ep}
                                titleParams={seriesData?.title_params}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* ── Separator ── */}
                <View
                    style={{
                        height: 0.5,
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        marginHorizontal: 16,
                        marginBottom: 20,
                    }}
                />

                {/* ── Info o seriji ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    <SectionHeader title="O seriji" />

                    <View
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderWidth: 0.5,
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 14,
                        }}
                    >
                        <View style={{ flexDirection: 'row', gap: 14, marginBottom: 12 }}>
                            <Image
                                source={{ uri: `https://images.balkanflix.com/${seriesData?.img}` }}
                                style={{
                                    width: 80,
                                    height: 116,
                                    borderRadius: 10,
                                    borderWidth: 0.5,
                                    borderColor: 'rgba(255,255,255,0.08)',
                                }}
                            />

                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                    numberOfLines={2}
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'Poppins-Bold',
                                        color: '#f1f5f9',
                                        marginBottom: 8,
                                        lineHeight: 20,
                                    }}
                                >
                                    {seriesData?.title}
                                </Text>

                                {/* Žanrovi */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                                    {seriesData?.genre?.map((genre, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: 'rgba(239,68,68,0.11)',
                                                borderWidth: 0.5,
                                                borderColor: 'rgba(239,68,68,0.22)',
                                                borderRadius: 20,
                                                paddingHorizontal: 9,
                                                paddingVertical: 3,
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>
                                                {genre}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Meta podaci */}
                                {[
                                    { icon: 'tv', label: `${seriesData?.ep} ep • ${seriesData?.status}` },
                                    { icon: 'star', label: `${seriesData?.MAL_ocena}/10` },
                                    { icon: 'remove-red-eye', label: `${seriesData?.totalViews} pregleda` },
                                    { icon: 'business', label: seriesData?.studio },
                                ].map(
                                    (item, i) =>
                                        item.label && (
                                            <View
                                                key={i}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    marginBottom: 3,
                                                }}
                                            >
                                                <MaterialIcons name={item.icon} size={13} color="#475569" />
                                                <Text
                                                    numberOfLines={1}
                                                    style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#64748b' }}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                        )
                                )}
                            </View>
                        </View>

                        {/* Opis */}
                        {seriesData?.description ? (
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: 'Poppins-Regular',
                                    color: '#64748b',
                                    lineHeight: 20,
                                }}
                            >
                                {seriesData.description}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Episode;