import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Dimensions, TouchableOpacity, InteractionManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import AnimeCard from './AnimeCard';
import CardSkeleton from './CardSkeleton';

const { width } = Dimensions.get('window');

const COLUMNS = 2;
const ROWS = 4;
const PAGE_SIZE = COLUMNS * ROWS; // 8 stavki po strani
const GAP = 12;

const CARD_WIDTH = (width - GAP * (COLUMNS + 1)) / COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.93; // ista proporcija kao pre (0.31 / 0.6)

const MovieList = ({ type }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageReady, setPageReady] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`https://balkanflix-server.up.railway.app/api/content/seriesList?sort=${type}`);
        setItems(data.series);
        setPage(0);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [type]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const pageItems = useMemo(
      () => items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
      [items, page]
  );

  // prozor od max 5 brojeva strana, centriran oko trenutne
  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(0, page - 2);
    let end = Math.min(totalPages, start + windowSize);
    start = Math.max(0, end - windowSize);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [page, totalPages]);

  const goToPage = useCallback((next) => {
    if (next < 0 || next > totalPages - 1 || next === page) return;
    setPage(next);
    setPageReady(false); // odmah skeletoni
    InteractionManager.runAfterInteractions(() => {
      setPageReady(true); // tek nakon tranzicije ucitaj stvarne kartice/slike
    });
  }, [page, totalPages]);

  const showSkeletons = loading || !pageReady;
  const displayItems = showSkeletons ? Array.from({ length: PAGE_SIZE }) : pageItems;

  const rows = [];
  for (let i = 0; i < displayItems.length; i += COLUMNS) {
    rows.push(displayItems.slice(i, i + COLUMNS));
  }

  return (
      <View className="my-5">
        <View style={{ paddingHorizontal: GAP }}>
          {rows.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row" style={{ marginBottom: GAP, gap: GAP }}>
                {row.map((item, colIndex) => (
                    <View
                        key={showSkeletons ? `sk-${rowIndex}-${colIndex}` : `${type}-${page}-${rowIndex}-${colIndex}`}
                        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                    >
                      {showSkeletons ? <CardSkeleton /> : <AnimeCard item={item} />}
                    </View>
                ))}
              </View>
          ))}

          {!loading && items.length === 0 && (
              <View className="items-center py-10">
                <MaterialIcons name="movie-filter" size={28} color="#666" />
                <Text className="text-gray-500 text-sm mt-2">Nema sadržaja</Text>
              </View>
          )}
        </View>

        {!loading && totalPages > 1 && (
            <View className="flex-row items-center justify-center mt-2" style={{ gap: 6 }}>
              <TouchableOpacity
                  onPress={() => goToPage(page - 1)}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ opacity: page === 0 ? 0.3 : 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <MaterialIcons name="chevron-left" size={22} color="white" />
              </TouchableOpacity>

              {pageNumbers[0] > 0 && <Text className="text-gray-500 text-xs">…</Text>}

              {pageNumbers.map((p) => (
                  <TouchableOpacity
                      key={p}
                      onPress={() => goToPage(p)}
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: p === page ? '#E50914' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text className={`text-xs font-psemibold ${p === page ? 'text-white' : 'text-gray-300'}`}>
                      {p + 1}
                    </Text>
                  </TouchableOpacity>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <Text className="text-gray-500 text-xs">…</Text>
              )}

              <TouchableOpacity
                  onPress={() => goToPage(page + 1)}
                  disabled={page === totalPages - 1}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ opacity: page === totalPages - 1 ? 0.3 : 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <MaterialIcons name="chevron-right" size={22} color="white" />
              </TouchableOpacity>
            </View>
        )}
      </View>
  );
};

MovieList.propTypes = {
  type: PropTypes.string.isRequired,
};

export default MovieList;