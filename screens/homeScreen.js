import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { Video } from 'expo-av';
import axios from 'axios';

const { height } = Dimensions.get('window');

const API_KEY = 'AlPCF6uutzXYGHJr5B1biHhahT31ywOT1fZvLyQDyZqbAfE1oZ4BoPHg';
const BASE_URL = 'https://api.pexels.com/videos/search';

const HomeScreen = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewableItems, setViewableItems] = useState([]);

  const videoRefs = useRef([]);

  const fetchVideos = useCallback(async () => {
    if (!hasMore || loading) return;
  
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL, {
        headers: {
          Authorization: API_KEY,
        },
        params: {
          page: page,
          per_page: 1,
          query: 'funny',
        },
      });
      if (response.data.videos && response.data.videos.length > 0) {
        setVideos((prevVideos) => [...prevVideos, ...response.data.videos]);
        setPage((prevPage) => prevPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (error.response && error.response.status === 429) {
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        fetchVideos(); // Retry fetch
      }
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    setViewableItems(viewableItems);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Adjust this as needed
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.videoContainer}>
      <Video
        ref={(ref) => videoRefs.current[index] = ref}
        source={{ uri: item.video_files[0].link }}
        style={styles.video}
        useNativeControls
        resizeMode="cover"
        isLooping
        shouldPlay={viewableItems.some(viewableItem => viewableItem.index === index)}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="large" color="#fff" />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={fetchVideos}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        snapToInterval={height}
        decelerationRate="fast"
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;