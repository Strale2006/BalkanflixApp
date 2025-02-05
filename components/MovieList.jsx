import React, { useState, useEffect } from 'react';
import { View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import axios from 'axios';
import AnimeCard from './AnimeCard';
import CardSkeleton from './CardSkeleton';

const { width } = Dimensions.get('window');

const MovieList = ({ type }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            try {
                const url = `https://balkanflix-server.vercel.app/api/content/seriesList?sort=${type}`;
                const { data } = await axios.get(url);
                setItems(data.series);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSeries();
    }, [type]);

    const renderItem = ({ item, index }) => (
        <View style={styles.slide}>
            {loading ? (
                <CardSkeleton />
            ) : (
                <AnimeCard item={item} />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                horizontal
                data={loading ? Array.from({ length: 10 }) : items}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <ActivityIndicator size="large" color="#E50914" />
                }
            />
        </View>
    );
};

const styles = {
    container: {
        marginVertical: 15,
    },
    listContent: {
        paddingHorizontal: 10,
    },
    slide: {
        width: width * 0.3,
        marginHorizontal: 5,
    },
};

MovieList.propTypes = {
    type: PropTypes.string.isRequired
};

export default MovieList;