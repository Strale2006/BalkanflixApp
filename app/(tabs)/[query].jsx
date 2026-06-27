import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Keyboard,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';

const ITEMS_PER_PAGE = 20;
const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 10;
const DEBOUNCE_MS = 350;

const SEARCH_URL = 'https://balkanflix-server.up.railway.app/api/content/seriesSearchV2';
const GRID_URL = 'https://balkanflix-server.up.railway.app/api/content/seriesGrid';

// Brand accent — red, matching the rest of the app (was purple before)
const ACCENT = '#E50914';
const ACCENT_BG = 'rgba(229,9,20,0.14)';
const ACCENT_BORDER = 'rgba(229,9,20,0.4)';
const ACCENT_TEXT = '#ff6b6f';

// Same filter catalogue used on the web (MovieGrid) — kept in sync manually
// since there's no dedicated "list available filters" endpoint yet.
const FILTER_CONFIG = {
    genre: {
        label: 'Žanr',
        options: [
            'Akcija', 'Avantura', 'Fantazija', 'Komedija', 'Drama', 'Romansa',
            'Sci-Fi', 'Misterija', 'Sport', 'Natprirodno', 'Ecchi', 'Award Winning',
            'Shounen', 'Istorija', 'Škola', 'Psihološki', 'Triler',
        ],
    },
    studio: {
        label: 'Studio',
        options: [
            'Bones', 'Pierrot', 'A-1 Pictures', 'Mappa', 'LIDENFILMS', 'Madhouse',
            'Gallop', 'Kyoto Animation', 'SILVER LINK.', 'Studio Ghibli', 'Toei Animation',
            'Sunrise', 'Wit Studio', 'Ufotable', 'Production I.G', 'Trigger', 'Gainax',
            'TMS Entertainment', 'Gonzo', 'GEMBA', 'ENGI', 'White Fox', 'J.C.Staff',
            'P.A. Works', 'E&H Production', 'CloverWorks', 'Cloud Hearts', 'Satelight',
            'Dugout', '8bit', 'Shuka', 'Lerche', 'Manglobe',
        ],
    },
    status: {
        label: 'Status',
        options: ['Uskoro', 'Emituje se', 'Završeno'],
    },
};

const EMPTY_FILTERS = { genre: '', studio: '', status: '' };

// --- Skeleton placeholder shown while the very first results are loading ---
const SkeletonCard = () => (
    <View style={{ flex: 1, paddingHorizontal: 6 }}>
        <View
            style={{
                width: '100%',
                aspectRatio: 2 / 3,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.06)',
                marginBottom: 8,
            }}
        />
        <View
            style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.06)',
                marginBottom: 6,
                width: '80%',
            }}
        />
        <View
            style={{
                height: 10,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.04)',
                width: '50%',
            }}
        />
    </View>
);

const SkeletonGrid = () => (
    <View style={{ paddingHorizontal: 10, paddingTop: 8 }}>
        {[0, 1, 2].map((row) => (
            <View key={row} style={{ flexDirection: 'row', marginBottom: 16 }}>
                <SkeletonCard />
                <SkeletonCard />
            </View>
        ))}
    </View>
);

// One pill inside the filter bottom sheet
const FilterPill = ({ label, selected, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 20,
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: selected ? ACCENT_BG : 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: selected ? ACCENT_BORDER : 'rgba(255,255,255,0.07)',
        }}
    >
        <Text
            style={{
                fontSize: 13,
                fontFamily: selected ? 'Poppins-SemiBold' : 'Poppins-Regular',
                color: selected ? ACCENT_TEXT : '#94a3b8',
            }}
        >
            {label}
        </Text>
    </TouchableOpacity>
);

const Search = () => {
    const [searchText, setSearchText] = useState('');
    const [debouncedText, setDebouncedText] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [trendingSearches, setTrendingSearches] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // ---- Filters (genre / studio / status) ----
    const [filterSheetVisible, setFilterSheetVisible] = useState(false);
    const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [browseAllItems, setBrowseAllItems] = useState([]);
    const [isBrowseLoading, setIsBrowseLoading] = useState(false);

    // ---- Sorting ----
    const [sortBy, setSortBy] = useState('');
    const [sortSheetVisible, setSortSheetVisible] = useState(false);

    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    const lastRequestedQueryRef = useRef('');
    const pageRef = useRef(1);
    const browseAbortRef = useRef(null);

    const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;
    const filtersActive = activeFilterCount > 0;

    // ---------- Setup ----------
    useEffect(() => {
        loadRecentSearches();
        loadTrendingSearches();
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            if (browseAbortRef.current) browseAbortRef.current.abort();
        };
    }, []);

    // Debounce typing
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedText(searchText.trim());
        }, DEBOUNCE_MS);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchText]);

    // Fire text search whenever the debounced query changes (only relevant
    // when the user is typing rather than browsing by genre/studio).
    useEffect(() => {
        if (filtersActive) return; // filters take over rendering in this case
        if (debouncedText) {
            runSearch(debouncedText);
        } else {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            setResults([]);
            setError(null);
            setIsInitialLoading(false);
            setHasMore(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedText, filtersActive]);

    // Whenever filters become active, fetch the full catalogue once so we can
    // filter client-side (genre/studio aren't supported as query params by
    // seriesSearchV2, same approach as the web MovieGrid screen).
    useEffect(() => {
        if (!filtersActive) return;
        loadBrowseCatalogue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersActive]);

    // ---------- Persistence ----------
    const loadRecentSearches = async () => {
        try {
            const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch (e) {
            console.error('Error loading recent searches:', e);
        }
    };

    const saveRecentSearch = async (query) => {
        try {
            const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            let searches = saved ? JSON.parse(saved) : [];
            searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
            searches.unshift(query);
            searches = searches.slice(0, MAX_RECENT_SEARCHES);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
            setRecentSearches(searches);
        } catch (e) {
            console.error('Error saving recent search:', e);
        }
    };

    const removeRecentSearch = async (query) => {
        try {
            const next = recentSearches.filter((s) => s !== query);
            setRecentSearches(next);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        } catch (e) {
            console.error('Error removing recent search:', e);
        }
    };

    const clearRecentSearches = async () => {
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecentSearches([]);
        } catch (e) {
            console.error('Error clearing recent searches:', e);
        }
    };

    const loadTrendingSearches = async () => {
        setTrendingSearches(['One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen']);
    };

    // ---------- Text search (seriesSearchV2) ----------
    const runSearch = useCallback(async (query, { isLoadMore = false } = {}) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        lastRequestedQueryRef.current = query;

        const pageToLoad = isLoadMore ? pageRef.current + 1 : 1;

        if (isLoadMore) setIsLoadingMore(true);
        else {
            setIsInitialLoading(true);
            setError(null);
        }

        try {
            const response = await axios.get(SEARCH_URL, {
                params: { q: query, page: pageToLoad, limit: ITEMS_PER_PAGE },
                signal: controller.signal,
            });

            if (lastRequestedQueryRef.current !== query) return;

            const newResults = response.data?.series ?? [];
            setResults((prev) => (isLoadMore ? [...prev, ...newResults] : newResults));
            setHasMore(newResults.length >= ITEMS_PER_PAGE);
            pageRef.current = pageToLoad;

            if (!isLoadMore) saveRecentSearch(query);
        } catch (e) {
            if (axios.isCancel?.(e) || e?.name === 'CanceledError' || e?.name === 'AbortError') return;
            console.error('Search error:', e);
            if (lastRequestedQueryRef.current === query) {
                setError('Došlo je do greške prilikom pretrage');
            }
        } finally {
            if (lastRequestedQueryRef.current === query) {
                setIsInitialLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, []);

    const loadMore = useCallback(() => {
        if (filtersActive) return; // browse mode shows everything at once, no pagination needed
        if (!isInitialLoading && !isLoadingMore && hasMore && debouncedText) {
            runSearch(debouncedText, { isLoadMore: true });
        }
    }, [filtersActive, isInitialLoading, isLoadingMore, hasMore, debouncedText, runSearch]);

    // ---------- Browse by genre/studio/status (seriesGrid, client-filtered) ----------
    const loadBrowseCatalogue = useCallback(async () => {
        if (browseAbortRef.current) browseAbortRef.current.abort();
        const controller = new AbortController();
        browseAbortRef.current = controller;

        setIsBrowseLoading(true);
        setError(null);

        try {
            let response;
            try {
                // First attempt: ask for "everything". Backend default for an
                // unrecognized sort value is unknown, so we fall back below.
                response = await axios.get(GRID_URL, {
                    params: { sort: 'sve' },
                    signal: controller.signal,
                });
                if (!Array.isArray(response.data?.series) || response.data.series.length === 0) {
                    throw new Error('empty-fallback');
                }
            } catch (innerErr) {
                if (axios.isCancel?.(innerErr) || innerErr?.name === 'CanceledError') throw innerErr;
                // Fallback: call without a sort param at all.
                response = await axios.get(GRID_URL, { signal: controller.signal });
            }

            const items = Array.isArray(response.data?.series) ? response.data.series : [];
            setBrowseAllItems(items);
        } catch (e) {
            if (axios.isCancel?.(e) || e?.name === 'CanceledError' || e?.name === 'AbortError') return;
            console.error('Browse fetch error:', e);
            setError('Došlo je do greške prilikom učitavanja kataloga');
            setBrowseAllItems([]);
        } finally {
            setIsBrowseLoading(false);
        }
    }, []);

    // Client-side filter, mirroring the web MovieGrid logic
    const browseResults = useMemo(() => {
        if (!filtersActive) return [];
        let filtered = [...browseAllItems];

        if (appliedFilters.genre) {
            filtered = filtered.filter((i) => i.genre?.includes(appliedFilters.genre));
        }
        if (appliedFilters.studio) {
            filtered = filtered.filter(
                (i) => i.studio?.trim().toLowerCase() === appliedFilters.studio.toLowerCase()
            );
        }
        if (appliedFilters.status) {
            filtered = filtered.filter(
                (i) => i.status?.toLowerCase() === appliedFilters.status.toLowerCase()
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'datum':
                filtered.sort((a, b) => new Date(b.date_sorted || 0) - new Date(a.date_sorted || 0));
                break;
            case 'pregledi':
                filtered.sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));
                break;
            case 'ocena':
                filtered.sort((a, b) => (b.MAL_ocena || 0) - (a.MAL_ocena || 0));
                break;
            default:
                break;
        }

        return filtered;
    }, [browseAllItems, appliedFilters, filtersActive, sortBy]);

    // Sort text search results as well
    const sortedResults = useMemo(() => {
        let sorted = [...results];
        switch (sortBy) {
            case 'datum':
                sorted.sort((a, b) => new Date(b.date_sorted || 0) - new Date(a.date_sorted || 0));
                break;
            case 'pregledi':
                sorted.sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));
                break;
            case 'ocena':
                sorted.sort((a, b) => (b.MAL_ocena || 0) - (a.MAL_ocena || 0));
                break;
            default:
                break;
        }
        return sorted;
    }, [results, sortBy]);

    // ---------- Handlers ----------
    const handleSearchSubmit = () => {
        const trimmed = searchText.trim();
        if (trimmed) {
            Keyboard.dismiss();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            setDebouncedText(trimmed);
        }
    };

    const handleChipPress = (query) => {
        Keyboard.dismiss();
        setAppliedFilters(EMPTY_FILTERS); // typing a query and browsing by filter are mutually exclusive
        setSearchText(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setDebouncedText(query);
    };

    const handleClearSearch = () => {
        setSearchText('');
        setDebouncedText('');
        setResults([]);
        setError(null);
        Keyboard.dismiss();
    };

    const handleRetry = () => {
        if (filtersActive) loadBrowseCatalogue();
        else if (debouncedText) runSearch(debouncedText);
    };

    const openFilterSheet = () => {
        setDraftFilters(appliedFilters);
        setFilterSheetVisible(true);
    };

    const closeFilterSheet = () => setFilterSheetVisible(false);

    const toggleDraftFilter = (key, value) => {
        setDraftFilters((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    };

    const applyFilters = () => {
        // Choosing a filter browses the whole catalogue for that genre/studio,
        // without requiring the user to type anything.
        setSearchText('');
        setDebouncedText('');
        setAppliedFilters(draftFilters);
        setFilterSheetVisible(false);
    };

    const resetFilters = () => {
        setDraftFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
        setFilterSheetVisible(false);
    };

    const openSortSheet = () => setSortSheetVisible(true);
    const closeSortSheet = () => setSortSheetVisible(false);

    const handleSortChange = (value) => {
        setSortBy(value);
        closeSortSheet();
    };

    // ---------- Derived state for rendering ----------
    const isBrowsing = filtersActive;
    const activeList = isBrowsing ? browseResults : sortedResults;
    const isBusy = isBrowsing ? isBrowseLoading : isInitialLoading;
    const showResultsBar = activeList.length > 0 || isBusy;

    // ---------- Rendering ----------
    // Wrapping each card in a flex:1 container guarantees a true 2-up grid
    // regardless of any fixed width VideoCard sets internally.
    const renderListItem = ({ item, index }) => (
        <View style={{ flex: 1 }}>
            <VideoCard item={item} key={item._id ?? item.id ?? String(index)} />
        </View>
    );

    const keyExtractor = (item, index) => item?._id ?? item?.id ?? String(index);

    const renderLandingContent = () => (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {recentSearches.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                        }}
                    >
                        <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#e9eef8' }}>
                            Nedavne pretrage
                        </Text>
                        <TouchableOpacity onPress={clearRecentSearches} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#64748b' }}>
                                Obriši sve
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {recentSearches.map((search) => (
                            <View
                                key={search}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                    borderWidth: 0.5,
                                    borderColor: 'rgba(255,255,255,0.06)',
                                    paddingLeft: 12,
                                    paddingRight: 6,
                                    paddingVertical: 6,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => handleChipPress(search)}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="history" size={14} color="#64748b" />
                                    <Text
                                        numberOfLines={1}
                                        style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#94a3b8', maxWidth: 140 }}
                                    >
                                        {search}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => removeRecentSearch(search)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingHorizontal: 6 }}
                                    activeOpacity={0.6}
                                >
                                    <MaterialIcons name="close" size={14} color="#475569" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {trendingSearches.length > 0 && (
                <View>
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#e9eef8', marginBottom: 12 }}>
                        Popularne pretrage
                    </Text>
                    <View style={{ gap: 4 }}>
                        {trendingSearches.map((search, index) => (
                            <TouchableOpacity
                                key={search}
                                onPress={() => handleChipPress(search)}
                                activeOpacity={0.6}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
                            >
                                <View
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: ACCENT_BG,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: ACCENT_TEXT }}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: '#e9eef8', flex: 1 }}>
                                    {search}
                                </Text>
                                <MaterialIcons name="trending-up" size={16} color="#22c55e" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {recentSearches.length === 0 && trendingSearches.length === 0 && (
                <EmptyState
                    title="Pronađi svoj sledeći serijal"
                    subtitle="Počni da kucaš ili izaberi filter da pregledaš katalog"
                />
            )}
        </View>
    );

    const renderListFooter = () => {
        if (isBrowsing) return null; // full catalogue is returned in one shot
        if (isLoadingMore) {
            return (
                <View style={{ paddingVertical: 24 }}>
                    <ActivityIndicator size="small" color={ACCENT} />
                </View>
            );
        }
        if (!hasMore && results.length > 0) {
            return (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#475569' }}>
                        To je sve što smo pronašli
                    </Text>
                </View>
            );
        }
        return null;
    };

    const renderEmptyState = () => {
        if (isBusy) return <SkeletonGrid />;

        if (!isBrowsing && !searchText.trim()) return renderLandingContent();

        if (error) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 }}>
                    <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                    <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#e9eef8', marginTop: 16 }}>
                        Greška
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={handleRetry}
                        style={{
                            marginTop: 16,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: ACCENT_BG,
                            borderWidth: 0.5,
                            borderColor: ACCENT_BORDER,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: ACCENT_TEXT }}>
                            Pokušaj ponovo
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (activeList.length === 0) {
            return (
                <View style={{ paddingTop: 40 }}>
                    <EmptyState
                        title="Nema rezultata"
                        subtitle={isBrowsing ? 'Pokušaj sa drugim filterom' : 'Pokušaj sa drugim ključnim rečima'}
                    />
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#080c14' }} edges={['top']}>
            {/* Search Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderRadius: 12,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 0.5,
                            borderColor: 'rgba(255,255,255,0.06)',
                            paddingLeft: 14,
                        }}
                    >
                        <MaterialIcons name="search" size={18} color="#64748b" />
                        <TextInput
                            value={searchText}
                            onChangeText={(text) => {
                                setSearchText(text);
                                if (text.trim() && filtersActive) setAppliedFilters(EMPTY_FILTERS);
                            }}
                            onSubmitEditing={handleSearchSubmit}
                            placeholder="Pretraži serijale..."
                            placeholderTextColor="#64748b"
                            style={{
                                flex: 1,
                                fontSize: 15,
                                fontFamily: 'Poppins-Regular',
                                color: '#e9eef8',
                                paddingHorizontal: 10,
                                paddingVertical: 12,
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                            accessibilityLabel="Pretraži serijale"
                            accessibilityRole="search"
                        />
                        {searchText.trim().length > 0 && (
                            <TouchableOpacity
                                onPress={handleClearSearch}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                                accessibilityLabel="Obriši pretragu"
                            >
                                <MaterialIcons name="close" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter button */}
                    <TouchableOpacity
                        onPress={openFilterSheet}
                        activeOpacity={0.8}
                        accessibilityLabel="Otvori filtere"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: filtersActive ? ACCENT_BG : 'rgba(255,255,255,0.04)',
                            borderWidth: 0.5,
                            borderColor: filtersActive ? ACCENT_BORDER : 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <Feather name="sliders" size={16} color={filtersActive ? ACCENT_TEXT : '#94a3b8'} />
                        {activeFilterCount > 0 && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -3,
                                    right: -3,
                                    minWidth: 14,
                                    height: 14,
                                    borderRadius: 7,
                                    paddingHorizontal: 2,
                                    backgroundColor: ACCENT,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 9, fontFamily: 'Poppins-SemiBold', color: '#fff' }}>
                                    {activeFilterCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Sort button */}
                    <TouchableOpacity
                        onPress={openSortSheet}
                        activeOpacity={0.8}
                        accessibilityLabel="Sortiraj"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: sortBy ? ACCENT_BG : 'rgba(255,255,255,0.04)',
                            borderWidth: 0.5,
                            borderColor: sortBy ? ACCENT_BORDER : 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <MaterialIcons name="sort" size={16} color={sortBy ? ACCENT_TEXT : '#94a3b8'} />
                    </TouchableOpacity>
                </View>

                {/* Active filter pills, shown under the search bar */}
                {filtersActive && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 0 }}>
                        {Object.entries(appliedFilters).map(([key, value]) =>
                            value ? (
                                <View
                                    key={key}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        paddingLeft: 12,
                                        paddingRight: 8,
                                        paddingVertical: 7,
                                        borderRadius: 16,
                                        backgroundColor: ACCENT_BG,
                                        borderWidth: 0.5,
                                        borderColor: ACCENT_BORDER,
                                        marginRight: 8,
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: ACCENT_TEXT }}>
                                        {value}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setAppliedFilters((prev) => ({ ...prev, [key]: '' }))}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialIcons name="close" size={13} color={ACCENT_TEXT} />
                                    </TouchableOpacity>
                                </View>
                            ) : null
                        )}
                        <TouchableOpacity
                            onPress={resetFilters}
                            style={{ justifyContent: 'center', paddingHorizontal: 4 }}
                        >
                            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#64748b' }}>
                                Obriši filtere
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Results Count */}
                {showResultsBar && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#64748b' }}>
                            {isBusy ? 'Pretraga...' : `${activeList.length} rezultata`}
                        </Text>
                    </View>
                )}
            </View>

            {/* Results List */}
            <FlatList
                data={isBusy ? [] : activeList}
                keyExtractor={keyExtractor}
                renderItem={renderListItem}
                numColumns={2}
                columnWrapperStyle={{ gap: 16, paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderListFooter}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={7}
                initialNumToRender={10}
                showsVerticalScrollIndicator={false}
            />

            {/* Filter bottom sheet */}
            <Modal
                visible={filterSheetVisible}
                animationType="slide"
                transparent
                onRequestClose={closeFilterSheet}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
                    onPress={closeFilterSheet}
                >
                    <Pressable
                        onPress={() => {}} // swallow taps so they don't bubble to the backdrop
                        style={{
                            marginTop: 'auto',
                            maxHeight: '80%',
                            backgroundColor: '#0d1320',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingTop: 8,
                        }}
                    >
                        {/* Drag handle */}
                        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                }}
                            />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 20,
                                paddingBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#e9eef8' }}>
                                Filteri
                            </Text>
                            <TouchableOpacity onPress={resetFilters} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: '#64748b' }}>
                                    Resetuj
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ paddingHorizontal: 20 }}
                            contentContainerStyle={{ paddingBottom: 12 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {Object.entries(FILTER_CONFIG).map(([key, config]) => (
                                <View key={key} style={{ marginBottom: 22 }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontFamily: 'Poppins-SemiBold',
                                            color: '#94a3b8',
                                            marginBottom: 10,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {config.label}
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {config.options.map((option) => (
                                            <FilterPill
                                                key={option}
                                                label={option}
                                                selected={draftFilters[key] === option}
                                                onPress={() => toggleDraftFilter(key, option)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View
                            style={{
                                flexDirection: 'row',
                                gap: 12,
                                paddingHorizontal: 20,
                                paddingTop: 12,
                                paddingBottom: 24,
                                borderTopWidth: 0.5,
                                borderTopColor: 'rgba(255,255,255,0.07)',
                            }}
                        >
                            <TouchableOpacity
                                onPress={closeFilterSheet}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                    borderWidth: 0.5,
                                    borderColor: 'rgba(255,255,255,0.07)',
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#94a3b8' }}>
                                    Otkaži
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={applyFilters}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: ACCENT,
                                }}
                                activeOpacity={0.85}
                            >
                                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#fff' }}>
                                    Primeni
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Sort bottom sheet */}
            <Modal
                visible={sortSheetVisible}
                animationType="slide"
                transparent
                onRequestClose={closeSortSheet}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
                    onPress={closeSortSheet}
                >
                    <Pressable
                        onPress={() => {}}
                        style={{
                            marginTop: 'auto',
                            backgroundColor: '#0d1320',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingTop: 8,
                        }}
                    >
                        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                }}
                            />
                        </View>

                        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                            <Text style={{ fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#e9eef8' }}>
                                Sortiraj
                            </Text>
                        </View>

                        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
                            <TouchableOpacity
                                onPress={() => handleSortChange('')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 14,
                                    borderBottomWidth: 0.5,
                                    borderBottomColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <Text style={{ fontSize: 15, fontFamily: 'Poppins-Regular', color: '#e9eef8' }}>
                                    Podrazumevano
                                </Text>
                                {sortBy === '' && <MaterialIcons name="check" size={18} color={ACCENT_TEXT} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSortChange('datum')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 14,
                                    borderBottomWidth: 0.5,
                                    borderBottomColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <Text style={{ fontSize: 15, fontFamily: 'Poppins-Regular', color: '#e9eef8' }}>
                                    Datumu (najnovije)
                                </Text>
                                {sortBy === 'datum' && <MaterialIcons name="check" size={18} color={ACCENT_TEXT} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSortChange('pregledi')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 14,
                                    borderBottomWidth: 0.5,
                                    borderBottomColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <Text style={{ fontSize: 15, fontFamily: 'Poppins-Regular', color: '#e9eef8' }}>
                                    Pregledima (najviše)
                                </Text>
                                {sortBy === 'pregledi' && <MaterialIcons name="check" size={18} color={ACCENT_TEXT} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleSortChange('ocena')}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 14,
                                }}
                            >
                                <Text style={{ fontSize: 15, fontFamily: 'Poppins-Regular', color: '#e9eef8' }}>
                                    Oceni (najviša)
                                </Text>
                                {sortBy === 'ocena' && <MaterialIcons name="check" size={18} color={ACCENT_TEXT} />}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

export default Search;