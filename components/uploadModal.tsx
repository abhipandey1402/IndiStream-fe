import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface UploadModalProps {
    showUploadModal: boolean;
    setShowUploadModal: (visible: boolean) => void;
    selectedVideo: any; // You can replace `any` with a specific type if you have it
    setSelectedVideo: (video: any) => void;
    uploadTitle: string;
    setUploadTitle: (title: string) => void;
    uploading: boolean;
    uploadProgress: number;
    handleUpload: () => void;
    selectVideo: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
    showUploadModal,
    setShowUploadModal,
    selectedVideo,
    setSelectedVideo,
    uploadTitle,
    setUploadTitle,
    uploading,
    uploadProgress,
    handleUpload,
    selectVideo,
}) => {
    return (
        <Modal
            visible={showUploadModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowUploadModal(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-blue-950 rounded-xl p-6 w-11/12 max-w-md">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-xl font-bold">Upload Video</Text>
                        <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Video Selection */}
                    <TouchableOpacity
                        className="bg-gray-800 rounded-lg p-4 mb-4 flex-row items-center justify-center"
                        onPress={selectVideo}
                        disabled={uploading}
                    >
                        <Ionicons name="videocam" size={24} color="#4ECDC4" />
                        <Text className="text-white ml-2">
                            {selectedVideo ? 'Video Selected' : 'Select Video File'}
                        </Text>
                    </TouchableOpacity>

                    {/* Title Input */}
                    <TextInput
                        className="bg-gray-800 rounded-lg p-4 text-white mb-4"
                        placeholder="Enter video title..."
                        placeholderTextColor="#8F9BB3"
                        value={uploadTitle}
                        onChangeText={setUploadTitle}
                        editable={!uploading}
                    />

                    {/* Upload Progress */}
                    {uploading && (
                        <View className="mb-4">
                            <View className="bg-gray-700 rounded-full h-2 mb-2">
                                <View
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </View>
                            <Text className="text-gray-400 text-center text-sm">
                                Uploading... {uploadProgress}%
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row justify-end">
                        <TouchableOpacity
                            className="bg-gray-700 rounded-lg px-4 py-2 mr-2"
                            onPress={() => setShowUploadModal(false)}
                            disabled={uploading}
                        >
                            <Text className="text-white">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-orange-500 rounded-lg px-4 py-2 flex-row items-center"
                            onPress={handleUpload}
                            disabled={uploading || !selectedVideo || !uploadTitle.trim()}
                        >
                            {uploading && (
                                <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                            )}
                            <Text className="text-white">
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default UploadModal;
