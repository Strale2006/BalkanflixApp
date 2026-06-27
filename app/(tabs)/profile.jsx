import {
    View, Text, Image, TouchableOpacity, Dimensions,
    FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { useGlobalContext } from './../../context/GlobalProvider';
import { Link, router, useFocusEffect } from 'expo-router';
import {
    Ionicons, MaterialIcons, MaterialCommunityIcons,
    FontAwesome5, Feather,
} from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Konstante ────────────────────────────────────────────────────────────────
const STATUSES = ['Gledam', 'Planiram', 'Završeno', 'Pauzirao', 'Odustao'];
const COLS = 2;
const ROWS_PER_PAGE = 5;
const PAGE_SIZE = COLS * ROWS_PER_PAGE; // 10 kartica / stranica

const STATUS_META = {
    Gledam:   { icon: 'play',         color: '#34d399' },
    Planiram: { icon: 'bookmark',     color: '#60a5fa' },
    Završeno: { icon: 'check-circle', color: '#a3e635' },
    Pauzirao: { icon: 'pause-circle', color: '#fbbf24' },
    Odustao:  { icon: 'times-circle', color: '#f87171' },
};

const CARD_W = (width - 32 - 10) / 2;

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, count }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
        <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>{title}</Text>
        {count != null && (
            <View style={{
                backgroundColor: 'rgba(239,68,68,0.11)', borderWidth: 0.5,
                borderColor: 'rgba(239,68,68,0.22)', borderRadius: 20,
                paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4,
            }}>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>{count}</Text>
            </View>
        )}
    </View>
);

// ─── Stat Box ─────────────────────────────────────────────────────────────────
const StatBox = ({ value, label, icon, iconColor }) => (
    <View style={{
        flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 14, alignItems: 'center', gap: 4,
    }}>
        <FontAwesome5 name={icon} size={15} color={iconColor || '#475569'} />
        <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#f1f5f9', marginTop: 2 }}>{value}</Text>
        <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#64748b', textAlign: 'center' }}>{label}</Text>
    </View>
);

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ user }) => {
    const badges = [];
    if (user?.isVerified)   badges.push({ label: 'Verifikovan', color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: 'checkmark-circle', lib: 'I' });
    if (user?.isAdmin)      badges.push({ label: 'Admin',       color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  icon: 'crown',            lib: 'MC' });
    if (user?.isTranslator) badges.push({ label: 'Prevodilac',  color: '#fb7185', bg: 'rgba(251,113,133,0.1)', icon: 'translate',         lib: 'MI' });
    if (!badges.length) return null;
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {badges.map((b, i) => (
                <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: b.bg, borderRadius: 20,
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderWidth: 0.5, borderColor: b.color + '33',
                }}>
                    {b.lib === 'I'  && <Ionicons name={b.icon} size={12} color={b.color} />}
                    {b.lib === 'MC' && <MaterialCommunityIcons name={b.icon} size={12} color={b.color} />}
                    {b.lib === 'MI' && <MaterialIcons name={b.icon} size={12} color={b.color} />}
                    <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: b.color }}>{b.label}</Text>
                </View>
            ))}
        </View>
    );
};

// ─── Filter Tab ───────────────────────────────────────────────────────────────
const FilterTab = ({ label, count, active, color, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
            backgroundColor: active ? (color ? color + '22' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.04)',
            borderWidth: 0.5,
            borderColor: active ? (color || 'rgba(239,68,68,0.5)') : 'rgba(255,255,255,0.08)',
        }}
    >
        <Text style={{
            fontSize: 12, fontFamily: 'Poppins-SemiBold',
            color: active ? (color || '#f87171') : '#64748b',
        }}>{label}</Text>
        <View style={{
            backgroundColor: active ? (color ? color + '33' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.06)',
            borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1,
        }}>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins-Bold', color: active ? (color || '#f87171') : '#475569' }}>
                {count}
            </Text>
        </View>
    </TouchableOpacity>
);

// ─── Anime Card ───────────────────────────────────────────────────────────────
const AnimeCard = ({ item, badgeLabel, badgeColor, onPress }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
                      style={{ width: CARD_W, borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}
    >
        <Image
            source={{ uri: `https://images.balkanflix.com/${item.img}` }}
            style={{ width: CARD_W, height: CARD_W * 1.45 }}
            resizeMode="cover"
        />
        {badgeLabel && (
            <View style={{
                position: 'absolute', top: 8, left: 8,
                backgroundColor: (badgeColor || '#E50914') + 'dd',
                borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
            }}>
                <Text style={{ fontSize: 10, fontFamily: 'Poppins-SemiBold', color: '#fff' }}>{badgeLabel}</Text>
            </View>
        )}
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.82)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, paddingTop: 24 }}
        >
            <Text numberOfLines={2} style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#f1f5f9', lineHeight: 15 }}>
                {item.title}
            </Text>
        </LinearGradient>
    </TouchableOpacity>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ page, total, onChange }) => {
    if (total <= 1) return null;

    // Prikazujemo max 5 page bројева sa elipsom
    const buildPages = () => {
        const pages = [];
        const delta = 1;
        let start = Math.max(2, page - delta);
        let end   = Math.min(total - 1, page + delta);
        if (page - delta > 2)           pages.push(1, '...');
        else                             for (let i = 1; i < start; i++) pages.push(i);
        for (let i = start; i <= end; i++) pages.push(i);
        if (page + delta < total - 1)   pages.push('...', total);
        else                             for (let i = end + 1; i <= total; i++) pages.push(i);
        return pages;
    };

    const pages = buildPages();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 4 }}>
            {/* Prev */}
            <TouchableOpacity
                onPress={() => onChange(page - 1)}
                disabled={page === 1}
                style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: page === 1 ? 0.3 : 1,
                }}
            >
                <Feather name="chevron-left" size={16} color="white" />
            </TouchableOpacity>

            {pages.map((p, i) =>
                p === '...'
                    ? <Text key={`e${i}`} style={{ color: '#475569', fontFamily: 'Poppins-Regular', fontSize: 12, paddingHorizontal: 2 }}>…</Text>
                    : (
                        <TouchableOpacity
                            key={p}
                            onPress={() => onChange(p)}
                            style={{
                                width: 34, height: 34, borderRadius: 17,
                                backgroundColor: p === page ? '#E50914' : 'rgba(255,255,255,0.05)',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Text style={{
                                fontSize: 12, fontFamily: 'Poppins-SemiBold',
                                color: p === page ? '#fff' : '#94a3b8',
                            }}>{p}</Text>
                        </TouchableOpacity>
                    )
            )}

            {/* Next */}
            <TouchableOpacity
                onPress={() => onChange(page + 1)}
                disabled={page === total}
                style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: page === total ? 0.3 : 1,
                }}
            >
                <Feather name="chevron-right" size={16} color="white" />
            </TouchableOpacity>
        </View>
    );
};

// ─── Card Grid (2 col, wrapped, no FlatList) ─────────────────────────────────
const CardGrid = ({ items, getBadge, onCardPress }) => {
    const rows = [];
    for (let i = 0; i < items.length; i += COLS) {
        rows.push(items.slice(i, i + COLS));
    }
    return (
        <View>
            {rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
                    {row.map((item, ci) => {
                        const badge = getBadge ? getBadge(item) : null;
                        return (
                            <AnimeCard
                                key={item._id || `${ri}-${ci}`}
                                item={item}
                                badgeLabel={badge?.label}
                                badgeColor={badge?.color}
                                onPress={() => onCardPress(item)}
                            />
                        );
                    })}
                    {/* Prazan placeholder ako red nije pun */}
                    {row.length < COLS && <View style={{ width: CARD_W }} />}
                </View>
            ))}
        </View>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, text }) => (
    <View style={{
        marginHorizontal: 16, paddingVertical: 28, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14, marginBottom: 24,
    }}>
        <FontAwesome5 name={icon} size={24} color="#334155" />
        <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#475569', marginTop: 8 }}>{text}</Text>
    </View>
);

const Divider = () => (
    <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginVertical: 24 }} />
);

// ─── Glavna komponenta ────────────────────────────────────────────────────────
const Profile = () => {
    const { user, logout, setUser } = useGlobalContext();

    const [animeCards, setAnimeCards]   = useState([]);
    const [watchStatus, setWatchStatus] = useState([]);
    const [activeFilter, setActiveFilter] = useState('Sve');
    const [statusPage, setStatusPage]   = useState(1);
    const [savedPage, setSavedPage]     = useState(1);
    const [loading, setLoading]         = useState(true);

    // ── Fetch on focus ────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem('authToken');
                    if (!token) return;
                    const cfg = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
                    const [userRes, cardsRes, statusRes] = await Promise.all([
                        axios.get('https://balkanflix-server.up.railway.app/api/private', cfg),
                        axios.get('https://balkanflix-server.up.railway.app/api/auth/getProfileCards', cfg),
                        axios.get('https://balkanflix-server.up.railway.app/api/auth/getWatchStatus', cfg),
                    ]);
                    setUser(userRes.data);
                    setAnimeCards(Array.isArray(cardsRes.data?.animeCards) ? cardsRes.data.animeCards : []);
                    setWatchStatus(Array.isArray(statusRes.data?.watchStatus) ? statusRes.data.watchStatus : []);
                } catch (err) {
                    console.error('Profile load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [])
    );

    const handleLogout = async () => {
        try { await logout(); router.replace('/sign-in'); }
        catch (e) { console.error('Logout error:', e); }
    };

    // ── Paginacija — status ───────────────────────────────────────────────────
    const filteredStatus = useMemo(
        () => activeFilter === 'Sve' ? watchStatus : watchStatus.filter(i => i.status === activeFilter),
        [watchStatus, activeFilter]
    );

    const statusTotalPages = Math.max(1, Math.ceil(filteredStatus.length / PAGE_SIZE));
    const pagedStatus = useMemo(
        () => filteredStatus.slice((statusPage - 1) * PAGE_SIZE, statusPage * PAGE_SIZE),
        [filteredStatus, statusPage]
    );

    const statusCounts = useMemo(
        () => STATUSES.reduce((acc, s) => { acc[s] = watchStatus.filter(i => i.status === s).length; return acc; }, {}),
        [watchStatus]
    );

    const handleFilterChange = (f) => { setActiveFilter(f); setStatusPage(1); };

    // ── Paginacija — sačuvano ─────────────────────────────────────────────────
    const savedTotalPages = Math.max(1, Math.ceil(animeCards.length / PAGE_SIZE));
    const pagedCards = useMemo(
        () => animeCards.slice((savedPage - 1) * PAGE_SIZE, savedPage * PAGE_SIZE),
        [animeCards, savedPage]
    );

    // ── Normalize status items to AnimeCard shape ─────────────────────────────
    const statusItems = pagedStatus.map((serijal) => {
        const s = typeof serijal.seriesId === 'object' ? serijal.seriesId : {};
        return {
            _id: serijal._id,
            img: s.img || 'default-card.jpg',
            title: s.title || 'Nepoznato',
            title_params: s.title_params,
            _status: serijal.status,
        };
    });

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#101420', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#101420' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* ── Hero banner ── */}
                <View style={{ position: 'relative' }}>
                    <Image
                        source={{ uri: user?.banner || 'https://images.balkanflix.com/Banner1.webp' }}
                        style={{ width: '100%', height: 160 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', '#101420']}
                        locations={[0.4, 1]}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
                    />
                </View>

                {/* ── Avatar + info ── */}
                <View style={{ alignItems: 'center', marginTop: -52, paddingHorizontal: 20, marginBottom: 20 }}>
                    <View style={{
                        width: 100, height: 100, borderRadius: 50,
                        borderWidth: 3, borderColor: '#101420',
                        overflow: 'hidden', marginBottom: 12,
                        shadowColor: '#E50914', shadowOpacity: 0.25, shadowRadius: 12,
                    }}>
                        <Image source={{ uri: user?.pfp }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>

                    <Text style={{ fontSize: 22, fontFamily: 'Poppins-Bold', color: '#f1f5f9', marginBottom: 2 }}>
                        {user?.username}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#475569', marginBottom: 10 }}>
                        {user?.email}
                    </Text>

                    <RoleBadge user={user} />

                    {/* Action buttons */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
                        <Link href="/profileModal" asChild>
                            <TouchableOpacity activeOpacity={0.8} style={{
                                flex: 1, flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'center', gap: 7, paddingVertical: 11,
                                borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
                                borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.09)',
                            }}>
                                <Feather name="edit-2" size={13} color="#94a3b8" />
                                <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#94a3b8' }}>Izmeni profil</Text>
                            </TouchableOpacity>
                        </Link>
                        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={{
                            width: 46, height: 46, borderRadius: 12,
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MaterialIcons name="logout" size={18} color="#f87171" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginBottom: 22 }} />

                {/* ── Stats ── */}
                <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <StatBox value={user?.full_ep?.length || 0} label="Epizoda"   icon="play"     iconColor="#E50914" />
                        <StatBox value={user?.streak || 0}          label="Streak 🔥" icon="fire"     iconColor="#fbbf24" />
                        <StatBox value={animeCards.length || 0}     label="Sačuvano"  icon="bookmark" iconColor="#60a5fa" />
                    </View>
                    {user?.isTranslator && (
                        <TouchableOpacity onPress={() => router.push('/dev-profil')} activeOpacity={0.85} style={{
                            marginTop: 10, paddingVertical: 12, borderRadius: 12,
                            backgroundColor: 'rgba(99,102,241,0.15)',
                            borderWidth: 0.5, borderColor: 'rgba(99,102,241,0.3)',
                            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                        }}>
                            <FontAwesome5 name="chart-bar" size={13} color="#818cf8" />
                            <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#818cf8' }}>
                                Dashboard
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Divider />

                {/* ── Status serijala ── */}
                <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <SectionHeader title="Status serijala" count={watchStatus.length} />

                    {/* Filter tabs */}
                    <FlatList
                        horizontal
                        data={['Sve', ...STATUSES]}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingBottom: 14 }}
                        renderItem={({ item }) => (
                            <FilterTab
                                label={item}
                                count={item === 'Sve' ? watchStatus.length : statusCounts[item]}
                                active={activeFilter === item}
                                color={item === 'Sve' ? undefined : STATUS_META[item]?.color}
                                onPress={() => handleFilterChange(item)}
                            />
                        )}
                    />
                </View>

                {filteredStatus.length === 0
                    ? <EmptyState icon="film" text={
                        activeFilter === 'Sve' ? 'Nema serijala sa statusom' : `Nema serijala sa statusom "${activeFilter}"`
                    } />
                    : <>
                        <CardGrid
                            items={statusItems}
                            getBadge={(item) => item._status ? { label: item._status, color: STATUS_META[item._status]?.color } : null}
                            onCardPress={(item) => router.push(`/details/${item.title_params}`)}
                        />
                        {/* Info red + paginacija */}
                        <View style={{ paddingHorizontal: 16, alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#475569' }}>
                                {(statusPage - 1) * PAGE_SIZE + 1}–{Math.min(statusPage * PAGE_SIZE, filteredStatus.length)} od {filteredStatus.length}
                            </Text>
                        </View>
                        <Pagination page={statusPage} total={statusTotalPages} onChange={(p) => { setStatusPage(p); }} />
                    </>
                }

                <Divider />

                {/* ── Sačuvani serijali ── */}
                <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <SectionHeader title="Sačuvani serijali" count={animeCards.length} />
                </View>

                {animeCards.length === 0
                    ? <EmptyState icon="bookmark" text="Nema sačuvanih serijala" />
                    : <>
                        <CardGrid
                            items={pagedCards}
                            onCardPress={(item) => router.push(`/details/${item.title_params}`)}
                        />
                        <View style={{ paddingHorizontal: 16, alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#475569' }}>
                                {(savedPage - 1) * PAGE_SIZE + 1}–{Math.min(savedPage * PAGE_SIZE, animeCards.length)} od {animeCards.length}
                            </Text>
                        </View>
                        <Pagination page={savedPage} total={savedTotalPages} onChange={(p) => { setSavedPage(p); }} />
                    </>
                }

            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;