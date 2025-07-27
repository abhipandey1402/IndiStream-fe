import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    GestureResponderEvent,
    LayoutChangeEvent,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoData {
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
    likes?: string;
    filename: string;
}

export default function VideoPlayerScreen() {
    const { videoData, playbackUrl } = useLocalSearchParams<{
        videoData: string;
        playbackUrl: string;
    }>();

    const video: VideoData = JSON.parse(videoData);
    const insets = useSafeAreaInsets();

    // Video player state
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);

    // Animation values
    const controlsOpacity = useSharedValue(1);
    const progressValue = useSharedValue(0);

    const progressBarRef = useRef<View>(null);
    const [progressBarWidth, setProgressBarWidth] = useState(0);

    const handleProgressBarLayout = (event: LayoutChangeEvent) => {
        setProgressBarWidth(event.nativeEvent.layout.width);
    };

    const handleSeek = async (event: GestureResponderEvent) => {
        if (!progressBarWidth || !status.isLoaded || !status.durationMillis) return;

        const touchX = event.nativeEvent.locationX;
        const seekRatio = Math.min(Math.max(touchX / progressBarWidth, 0), 1); // clamp between 0 and 1
        await seekTo(seekRatio);
    };

    // Hide controls after 3 seconds
    useEffect(() => {
        let timeout: number;
        if (showControls && !isLoading) {
            timeout = setTimeout(() => {
                setShowControls(false);
                controlsOpacity.value = withTiming(0, { duration: 300 });
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls, isLoading]);

    // Update progress
    useEffect(() => {
        if (status.durationMillis && status.positionMillis) {
            progressValue.value = status.positionMillis / status.durationMillis;
        }
    }, [status.positionMillis, status.durationMillis]);

    // Handle screen tap to show/hide controls
    const handleScreenTap = () => {
        if (isLoading) return;
        setShowControls(!showControls);
        controlsOpacity.value = withTiming(showControls ? 0 : 1, { duration: 300 });
    };

    // Video event handlers
    const onPlaybackStatusUpdate = (playbackStatus: any) => {
        setStatus(playbackStatus);
        if (playbackStatus.isLoaded) {
            setIsLoading(false);
            setIsPlaying(!playbackStatus.shouldPlay ? false : true);
        }
    };

    // Control functions
    const togglePlayPause = async () => {
        if (status.isLoaded) {
            if (isPlaying) {
                await videoRef.current?.pauseAsync();
            } else {
                await videoRef.current?.playAsync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seekTo = async (position: number) => {
        if (status.isLoaded && status.durationMillis) {
            const seekPosition = position * status.durationMillis;
            await videoRef.current?.setPositionAsync(seekPosition);
        }
    };

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // const toggleFullscreen = async () => {
    //     if (isFullscreen) {
    //         await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    //     } else {
    //         await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    //     }
    //     setIsFullscreen(!isFullscreen);
    // };

    const changePlaybackRate = async () => {
        const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);

        if (videoRef.current && status.isLoaded) {
            await videoRef.current.setRateAsync(nextRate, true);
        }
    };

    const toggleMute = async () => {
        if (videoRef.current && status.isLoaded) {
            await videoRef.current.setIsMutedAsync(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    // const handleGoBack = async () => {
    //     // Reset orientation when leaving
    //     await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    //     router.back();
    // };

    const handleLike = () => {
        setIsLiked(!isLiked);
        if (isDisliked) setIsDisliked(false);
    };

    const handleDislike = () => {
        setIsDisliked(!isDisliked);
        if (isLiked) setIsLiked(false);
    };

    const handleShare = () => {
        Alert.alert('Share', 'Share functionality coming soon!');
    };

    const handleDownload = () => {
        Alert.alert('Download', 'Download functionality coming soon!');
    };

    const handleSubscribe = () => {
        Alert.alert('Subscribe', 'Subscribe functionality coming soon!');
    };

    // Animated styles
    const controlsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${interpolate(progressValue.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
    }));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="#000"
                hidden={isFullscreen}
            />

            {/* Video Player */}
            <TouchableOpacity
                style={[
                    styles.videoContainer,
                    isFullscreen && styles.fullscreenVideo
                ]}
                activeOpacity={1}
                onPress={handleScreenTap}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: playbackUrl }}
                    style={styles.video}
                    shouldPlay={isPlaying}
                    onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                    resizeMode={ResizeMode.CONTAIN}
                    rate={playbackRate}
                    isMuted={isMuted}
                />

                {/* Loading Indicator */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>Loading video...</Text>
                    </View>
                )}

                {/* Video Controls Overlay */}
                <Animated.View style={[styles.controlsOverlay, controlsAnimatedStyle]}>
                    {/* Top Controls */}
                    <View style={styles.topControls}>
                        {/* <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleGoBack}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity> */}

                        <View style={styles.topRightControls}>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={changePlaybackRate}
                            >
                                <Text style={styles.playbackRateText}>{playbackRate}x</Text>
                            </TouchableOpacity>

                            {/* <TouchableOpacity
                                style={styles.controlButton}
                                onPress={toggleFullscreen}
                            >
                                <Ionicons
                                    name={isFullscreen ? "contract" : "expand"}
                                    size={20}
                                    color="#fff"
                                />
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    {/* Center Play/Pause Button */}
                    <View style={styles.centerControls}>
                        <TouchableOpacity
                            style={styles.playPauseButton}
                            onPress={togglePlayPause}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={40}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomControls}>
                        <View style={styles.progressContainer}>
                            <Text style={styles.timeText}>
                                {status.positionMillis ? formatTime(status.positionMillis) : '0:00'}
                            </Text>

                            <View
                                style={styles.progressBar}
                                ref={progressBarRef}
                                onLayout={handleProgressBarLayout}
                            >
                                {/* Seekable area */}
                                <TouchableOpacity
                                    style={StyleSheet.absoluteFill}
                                    onPress={handleSeek}
                                    activeOpacity={1}
                                />

                                <View style={styles.progressTrack} />
                                <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />

                                <Animated.View
                                    style={[
                                        styles.progressThumb,
                                        { transform: [{ translateX: progressValue.value * progressBarWidth }] },
                                    ]}
                                />
                            </View>

                            <Text style={styles.timeText}>
                                {status.durationMillis ? formatTime(status.durationMillis) : '0:00'}
                            </Text>

                            <TouchableOpacity style={styles.volumeButton} onPress={toggleMute}>
                                <Ionicons
                                    name={isMuted ? 'volume-mute' : 'volume-high'}
                                    size={20}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>

            {/* Video Information (only visible when not fullscreen) */}
            {!isFullscreen && (
                <ScrollView style={styles.infoContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle}>{video.title}</Text>

                        <View style={styles.statsRow}>
                            <Text style={styles.statsText}>
                                {video.views || '0'} views • {video.uploadTime || 'Recently uploaded'}
                            </Text>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleLike}
                                >
                                    <Ionicons
                                        name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
                                        size={20}
                                        color={isLiked ? "#FF6B35" : "#fff"}
                                    />
                                    <Text style={[
                                        styles.actionButtonText,
                                        isLiked && { color: "#FF6B35" }
                                    ]}>
                                        {video.likes || '0'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleDislike}
                                >
                                    <Ionicons
                                        name={isDisliked ? "thumbs-down" : "thumbs-down-outline"}
                                        size={20}
                                        color={isDisliked ? "#FF6B35" : "#fff"}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleShare}
                                >
                                    <Ionicons name="share-outline" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Share</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleDownload}
                                >
                                    <Ionicons name="download-outline" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Download</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Channel Information */}
                    <View style={styles.channelInfo}>
                        <Image
                            source={{
                                uri: video.channelAvatar || 'https://via.placeholder.com/50x50/4ECDC4/fff?text=U'
                            }}
                            style={styles.channelAvatar}
                        />

                        <View style={styles.channelDetails}>
                            <View style={styles.channelNameRow}>
                                <Text style={styles.channelName}>
                                    {video.channelName || 'IndiStream User'}
                                </Text>
                                {video.verified && (
                                    <MaterialIcons name="verified" size={16} color="#4ECDC4" />
                                )}
                            </View>
                            <Text style={styles.subscriberCount}>1.2K subscribers</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={handleSubscribe}
                        >
                            <Text style={styles.subscribeButtonText}>Subscribe</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    {video.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{video.description}</Text>
                        </View>
                    )}

                    {/* Comments Section Placeholder */}
                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsHeader}>Comments</Text>
                        <Text style={styles.comingSoonText}>Comments coming soon...</Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E3A8A', // blue-950
    },
    videoContainer: {
        width: screenWidth,
        height: screenWidth * (9 / 16), // 16:9 aspect ratio
        backgroundColor: '#000',
        position: 'relative',
    },
    fullscreenVideo: {
        width: screenHeight,
        height: screenWidth,
        transform: [{ rotate: '90deg' }],
        position: 'absolute',
        top: (screenHeight - screenWidth) / 2,
        left: (screenWidth - screenHeight) / 2,
        zIndex: 1000,
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: 'transparent',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    topRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
    },
    playbackRateText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    centerControls: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 50,
        padding: 20,
    },
    bottomControls: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'transparent',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        minWidth: 35,
        textAlign: 'center',
    },
    progressBar: {
        flex: 1,
        height: 20,
        marginHorizontal: 10,
        justifyContent: 'center',
        position: 'relative',
    },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1.5,
    },
    progressFill: {
        position: 'absolute',
        height: 3,
        backgroundColor: '#FF6B35',
        borderRadius: 1.5,
    },
    progressThumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#FF6B35',
        borderRadius: 6,
        top: -4.5,
        marginLeft: -6,
    },
    volumeButton: {
        padding: 8,
        marginLeft: 8,
    },
    infoContainer: {
        flex: 1,
        backgroundColor: '#1E3A8A',
    },
    videoInfo: {
        padding: 16,
    },
    videoTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 24,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statsText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        paddingVertical: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
    },
    channelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#374151',
    },
    channelAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    channelDetails: {
        flex: 1,
        marginLeft: 12,
    },
    channelNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    subscriberCount: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 2,
    },
    subscribeButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    subscribeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    descriptionContainer: {
        padding: 16,
    },
    descriptionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    descriptionText: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 20,
    },
    commentsSection: {
        padding: 16,
        borderTopWidth: 1,
        borderColor: '#374151',
    },
    commentsHeader: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    comingSoonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontStyle: 'italic',
    },
});