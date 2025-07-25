import '../../global.css';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import UploadModal from '../../components/uploadModal';

// API Configuration
const API_BASE_URL = 'http://3.110.108.64:8080';

// Types
type IoniconName =
  | 'grid-outline'
  | 'musical-notes'
  | 'happy-outline'
  | 'newspaper-outline'
  | 'football-outline'
  | 'film-outline'
  | 'phone-portrait-outline';

interface Category {
  id: string;
  name: string;
  icon: IoniconName;
  color: string;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  uploadTime?: string;
  channelName?: string;
  channelAvatar?: string;
  verified?: boolean;
  category?: string;
  likes?: string;
  filename: string;
  status?: string;
}

interface UploadResponse {
  filename: string;
  url: string;
  video_id: string;
}

// API Functions
const videoAPI = {
  // Get upload URL from server
  getUploadURL: async (): Promise<UploadResponse> => {
    const response = await fetch(`${API_BASE_URL}/videos/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    return await response.json();
  },

  // Upload video file to S3
  uploadVideoFile: async (uploadUrl: string, fileUri: string): Promise<void> => {
    const response = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to upload video: ${response.status}`);
    }
  },

  // Create video metadata
  createVideoMetadata: async (title: string, filename: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/videos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create video metadata: ${response.statusText}`);
    }
  },

  // Get all ready videos
  getReadyVideos: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/videos/ready`);

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.statusText}`);
    }

    return await response.json();
  },

  // Get video by ID
  getVideoById: async (id: string): Promise<Video> => {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    return await response.json();
  },

  // Get playback URL
  getPlaybackURL: async (id: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/videos/${id}/play`);

    if (!response.ok) {
      throw new Error(`Failed to get playback URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url || data.playback_url;
  },

  // Delete video
  deleteVideo: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.statusText}`);
    }
  },
};

const categories: Category[] = [
  { id: '1', name: 'All', icon: 'grid-outline', color: '#FF6B35' },
  { id: '2', name: 'Music', icon: 'musical-notes', color: '#4ECDC4' },
  { id: '3', name: 'Comedy', icon: 'happy-outline', color: '#45B7D1' },
  { id: '4', name: 'News', icon: 'newspaper-outline', color: '#96CEB4' },
  { id: '5', name: 'Sports', icon: 'football-outline', color: '#FECA57' },
  { id: '6', name: 'Movies', icon: 'film-outline', color: '#FF9FF3' },
  { id: '7', name: 'Tech', icon: 'phone-portrait-outline', color: '#54A0FF' },
];

export default function HomeScreen() {
  // State
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchAnimation = useRef(new Animated.Value(0)).current;

  // Load videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    Animated.timing(searchAnimation, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch]);

  // Load videos from API
  const loadVideos = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const fetchedVideos = await videoAPI.getReadyVideos();
      setVideos(fetchedVideos?.videos);
    } catch (error) {
      console.error('Failed to load videos:', error);
      Alert.alert('Error', 'Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle video selection for upload
  const selectVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video file.');
    }
  };

  // Handle video upload
  const handleUpload = async () => {
    if (!selectedVideo || !uploadTitle.trim()) {
      Alert.alert('Error', 'Please select a video and enter a title.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get upload URL
      setUploadProgress(20);
      const uploadData = await videoAPI.getUploadURL();

      // Step 2: Upload video file to S3
      setUploadProgress(40);
      await videoAPI.uploadVideoFile(uploadData.url, selectedVideo);

      // Step 3: Create video metadata
      setUploadProgress(80);
      await videoAPI.createVideoMetadata(uploadTitle.trim(), uploadData.filename);

      setUploadProgress(100);

      // Reset form and close modal
      setUploadTitle('');
      setSelectedVideo(null);
      setShowUploadModal(false);

      Alert.alert('Success', 'Video uploaded successfully!');

      // Refresh video list
      loadVideos();

    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle video playback
  const handleVideoPress = async (video: Video) => {
    try {
      const playbackUrl = await videoAPI.getPlaybackURL(video.id);
      // Here you would typically navigate to a video player screen
      // For now, just show an alert with the playback URL
      Alert.alert('Playback URL', playbackUrl);
    } catch (error) {
      console.error('Failed to get playback URL:', error);
      Alert.alert('Error', 'Failed to load video for playback.');
    }
  };

  // Handle video deletion
  const handleDeleteVideo = async (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await videoAPI.deleteVideo(videoId);
              Alert.alert('Success', 'Video deleted successfully!');
              loadVideos();
            } catch (error) {
              console.error('Failed to delete video:', error);
              Alert.alert('Error', 'Failed to delete video.');
            }
          },
        },
      ]
    );
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [100, 60],
    extrapolate: 'clamp',
  });

  const filteredVideos = videos.filter((video) => {
    const matchCategory =
      selectedCategory === '1' || video.category === categories.find((c) => c.id === selectedCategory)?.name;
    const matchSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const renderVideoCard = ({ item }: { item: Video }) => (
    <TouchableOpacity className="mb-5" onPress={() => handleVideoPress(item)}>
      <View className="bg-blue-950 rounded-xl overflow-hidden shadow-md">
        {/* Large thumbnail */}
        <Image
          source={{
            uri: item.thumbnail || 'https://via.placeholder.com/640x360/333/fff?text=Video'
          }}
          style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#333' }}
        />

        {/* Duration badge on thumbnail */}
        {item.duration && (
          <View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
            <Text className="text-white text-xs font-semibold">{item.duration}</Text>
          </View>
        )}

        {/* Details */}
        <View className="flex-row p-4">
          {/* Channel avatar */}
          <Image
            source={{
              uri: item.channelAvatar || 'https://via.placeholder.com/40x40/4ECDC4/fff?text=U'
            }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
          />

          {/* Text content */}
          <View className="flex-1">
            <Text className="text-white text-base font-semibold leading-5 mb-1">
              {item.title}
            </Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-gray-400 text-sm mr-1">
                {item.channelName || 'IndiStream User'}
              </Text>
              {item.verified && (
                <MaterialIcons name="verified" size={14} color="#4ECDC4" />
              )}
            </View>
            <Text className="text-gray-400 text-xs">
              {item.views || '0'} views • {item.uploadTime || 'Recently uploaded'}
            </Text>
          </View>

          {/* Options */}
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteVideo(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      className={`mr-2 rounded-full px-4 py-2 ${selectedCategory === item.id ? 'bg-orange-500' : 'bg-gray-800'}`}
      onPress={() => setSelectedCategory(item.id)}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={item.icon}
          size={16}
          color={selectedCategory === item.id ? '#fff' : '#8F9BB3'}
        />
        <Text
          className={`ml-2 text-sm font-semibold ${selectedCategory === item.id ? 'text-white' : 'text-gray-400'}`}
        >
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  
  return (
    <View className="flex-1 bg-blue-950">
      <StatusBar barStyle="light-content" backgroundColor="#1A1D29" />

      <Animated.View
        className="absolute top-0 left-0 right-0 z-50 px-4 pt-10 pb-4 bg-blue-950"
        style={{ height: headerHeight }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View style={styles.logoCircle}>
              <Text className="text-white font-bold">IS</Text>
            </View>
            <Text className="text-white text-xl font-bold ml-2">IndiStream</Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              className="p-2 mr-2"
              onPress={() => setShowUploadModal(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color="#FF6B35" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 mr-2" onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
            {/* <TouchableOpacity className="p-2 relative">
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </TouchableOpacity> */}
          </View>
        </View>

        <Animated.View
          style={{
            opacity: searchAnimation,
            transform: [
              {
                translateY: searchAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-2">
            <Ionicons name="search" size={18} color="#8F9BB3" />
            <TextInput
              className="flex-1 ml-2 text-white"
              placeholder="Search videos..."
              placeholderTextColor="#8F9BB3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>
      </Animated.View>

      <View style={{ marginTop: 100 }}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-white mt-2">Loading videos...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredVideos}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 100, paddingTop: 16 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshing={refreshing}
          onRefresh={() => loadVideos(true)}
        />
      )}

      <UploadModal
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        selectedVideo={selectedVideo}
        setSelectedVideo={setSelectedVideo}
        uploadTitle={uploadTitle}
        setUploadTitle={setUploadTitle}
        uploading={uploading}
        uploadProgress={uploadProgress}
        handleUpload={handleUpload}
        selectVideo={selectVideo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoCircle: {
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});