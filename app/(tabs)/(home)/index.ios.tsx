
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import Constants from 'expo-constants';
import { BACKEND_URL } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface ScanResult {
  scanId: string;
  species: string;
  commonName: string;
  isSafeToEat: boolean;
  isSafeToTouch: boolean;
  confidence: string;
  warnings: string;
  description: string;
  imageUrl: string;
}

export default function HomeScreen() {
  console.log('HomeScreen (iOS) rendered');
  console.log('Backend URL:', BACKEND_URL);
  
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { user, loading: authLoading } = useAuth();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const pickImage = async () => {
    console.log('User tapped Pick Image button');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('ImagePicker result:', result);

      if (!result.canceled) {
        console.log('Image selected:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
        setScanResult(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    console.log('User tapped Take Photo button');
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.log('Camera permission denied');
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('Camera result:', result);

      if (!result.canceled) {
        console.log('Photo taken:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
        setScanResult(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const analyzePlant = async () => {
    if (!selectedImage) {
      console.log('No image selected for analysis');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      console.log('User not authenticated, redirecting to auth screen');
      Alert.alert(
        'Authentication Required',
        'Please sign in to analyze images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    console.log('User tapped Analyze button, starting analysis...');
    setIsAnalyzing(true);
    setScanResult(null);

    try {
      // Step 1: Upload image to backend
      console.log('Step 1: Uploading image to backend...');
      
      // Create FormData for image upload
      const formData = new FormData();
      
      // Get file extension from URI
      const uriParts = selectedImage.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Create file object for upload
      const file = {
        uri: selectedImage,
        type: `image/${fileType}`,
        name: `scan.${fileType}`,
      } as any;
      
      formData.append('image', file);
      
      console.log('Uploading to:', `${BACKEND_URL}/api/scans/upload`);
      
      const uploadResponse = await fetch(`${BACKEND_URL}/api/scans/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);

      // Step 2: The backend automatically analyzes the image and returns the result
      // The response should contain the scan result
      const result: ScanResult = {
        scanId: uploadData.id || uploadData.scanId,
        species: uploadData.species || 'Unknown',
        commonName: uploadData.commonName || 'Unknown',
        isSafeToEat: uploadData.isSafeToEat || false,
        isSafeToTouch: uploadData.isSafeToTouch || false,
        confidence: uploadData.confidence || 'low',
        warnings: uploadData.warnings || '',
        description: uploadData.description || 'No description available',
        imageUrl: uploadData.imageUrl || selectedImage,
      };

      console.log('Analysis complete:', result);
      setScanResult(result);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setIsAnalyzing(false);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to analyze image. Please try again.'
      );
    }
  };

  const resetScan = () => {
    console.log('User tapped Reset button');
    setSelectedImage(null);
    setScanResult(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="leaf.fill" 
            android_material_icon_name="eco" 
            size={40} 
            color={theme.primary} 
          />
          <Text style={[styles.title, { color: theme.text }]}>
            Flora & Fauna Scanner
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Identify plants and animals safely
          </Text>
        </View>

        {/* Image Display */}
        {selectedImage ? (
          <View style={[styles.imageContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: theme.danger }]}
              onPress={resetScan}
            >
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="close" 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <IconSymbol 
              ios_icon_name="camera.fill" 
              android_material_icon_name="camera" 
              size={64} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
              Take a photo or select from gallery
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {!selectedImage ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={takePhoto}
            >
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera" 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.secondary }]}
              onPress={pickImage}
            >
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="image" 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.analyzeButton, { backgroundColor: theme.accent }]}
            onPress={analyzePlant}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol 
                  ios_icon_name="sparkles" 
                  android_material_icon_name="auto-awesome" 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.buttonText}>Analyze</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Results */}
        {scanResult && (
          <View style={[styles.resultContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.resultTitle, { color: theme.text }]}>Analysis Results</Text>
            
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Common Name:</Text>
              <Text style={[styles.resultValue, { color: theme.text }]}>{scanResult.commonName}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Scientific Name:</Text>
              <Text style={[styles.resultValue, { color: theme.text, fontStyle: 'italic' }]}>
                {scanResult.species}
              </Text>
            </View>

            <View style={styles.safetyContainer}>
              <View style={[styles.safetyBadge, { backgroundColor: scanResult.isSafeToEat ? theme.success : theme.danger }]}>
                <IconSymbol 
                  ios_icon_name={scanResult.isSafeToEat ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  android_material_icon_name={scanResult.isSafeToEat ? 'check-circle' : 'cancel'}
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.safetyText}>
                  {scanResult.isSafeToEat ? 'Safe to Eat' : 'Not Safe to Eat'}
                </Text>
              </View>

              <View style={[styles.safetyBadge, { backgroundColor: scanResult.isSafeToTouch ? theme.success : theme.danger }]}>
                <IconSymbol 
                  ios_icon_name={scanResult.isSafeToTouch ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  android_material_icon_name={scanResult.isSafeToTouch ? 'check-circle' : 'cancel'}
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.safetyText}>
                  {scanResult.isSafeToTouch ? 'Safe to Touch' : 'Not Safe to Touch'}
                </Text>
              </View>
            </View>

            <View style={[styles.confidenceBadge, { backgroundColor: theme.highlight }]}>
              <Text style={[styles.confidenceText, { color: theme.primary }]}>
                Confidence: {scanResult.confidence.toUpperCase()}
              </Text>
            </View>

            {scanResult.warnings && (
              <View style={[styles.warningContainer, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
                <IconSymbol 
                  ios_icon_name="exclamationmark.triangle.fill" 
                  android_material_icon_name="warning" 
                  size={20} 
                  color={theme.warning} 
                />
                <Text style={[styles.warningText, { color: theme.text }]}>{scanResult.warnings}</Text>
              </View>
            )}

            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: theme.textSecondary }]}>Description:</Text>
              <Text style={[styles.descriptionText, { color: theme.text }]}>{scanResult.description}</Text>
            </View>
          </View>
        )}

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={16} 
            color={theme.textSecondary} 
          />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Always verify with multiple sources before consuming or touching unknown species
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  resetButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainer: {
    height: 300,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultRow: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  safetyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  safetyBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  safetyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBadge: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
