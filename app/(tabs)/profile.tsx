
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';
import { BACKEND_URL } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface ScanHistoryItem {
  id: string;
  imageUrl: string;
  species: string;
  commonName: string;
  isSafeToEat: boolean;
  isSafeToTouch: boolean;
  confidence: string;
  createdAt: string;
}

export default function ProfileScreen() {
  console.log('ProfileScreen rendered');
  console.log('Backend URL:', BACKEND_URL);
  
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadScanHistory();
    }
  }, [user]);

  const loadScanHistory = async () => {
    if (!user) {
      console.log('User not authenticated, skipping scan history load');
      return;
    }

    console.log('Loading scan history...');
    setIsLoading(true);
    
    try {
      console.log('Fetching from:', `${BACKEND_URL}/api/scans`);
      
      const response = await fetch(`${BACKEND_URL}/api/scans`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load scan history:', response.status, errorText);
        throw new Error(`Failed to load scan history: ${response.status}`);
      }

      const data = await response.json();
      console.log('Scan history loaded:', data);
      
      // Map the response to our interface
      const history: ScanHistoryItem[] = (data.scans || data || []).map((scan: any) => ({
        id: scan.id,
        imageUrl: scan.imageUrl,
        species: scan.species,
        commonName: scan.commonName,
        isSafeToEat: scan.isSafeToEat,
        isSafeToTouch: scan.isSafeToTouch,
        confidence: scan.confidence,
        createdAt: scan.createdAt,
      }));
      
      setScanHistory(history);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading scan history:', error);
      setIsLoading(false);
    }
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
            ios_icon_name="clock.fill" 
            android_material_icon_name="history" 
            size={40} 
            color={theme.primary} 
          />
          <Text style={[styles.title, { color: theme.text }]}>Scan History</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            View your past scans
          </Text>
        </View>

        {/* Auth Status */}
        {!authLoading && (
          <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {user ? (
              <>
                <View style={styles.authInfo}>
                  <IconSymbol 
                    ios_icon_name="person.circle.fill" 
                    android_material_icon_name="account-circle" 
                    size={24} 
                    color={theme.primary} 
                  />
                  <View style={styles.authTextContainer}>
                    <Text style={[styles.authName, { color: theme.text }]}>
                      {user.name || user.email}
                    </Text>
                    <Text style={[styles.authEmail, { color: theme.textSecondary }]}>
                      {user.email}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.authButton, { backgroundColor: theme.danger }]}
                  onPress={async () => {
                    await signOut();
                    setScanHistory([]);
                  }}
                >
                  <Text style={styles.authButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.authInfo}>
                  <IconSymbol 
                    ios_icon_name="person.circle" 
                    android_material_icon_name="account-circle" 
                    size={24} 
                    color={theme.textSecondary} 
                  />
                  <Text style={[styles.authText, { color: theme.textSecondary }]}>
                    Sign in to view your scan history
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.authButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/auth')}
                >
                  <Text style={styles.authButtonText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && scanHistory.length === 0 && user && (
          <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
            <IconSymbol 
              ios_icon_name="tray.fill" 
              android_material_icon_name="inbox" 
              size={64} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Scans Yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Your scan history will appear here after you analyze flora and fauna
            </Text>
          </View>
        )}

        {/* History List */}
        {!isLoading && scanHistory.length > 0 && (
          <View style={styles.historyList}>
            {scanHistory.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity 
                  style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => console.log('Tapped history item:', item.id)}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImage} />
                  
                  <View style={styles.historyContent}>
                    <Text style={[styles.historyTitle, { color: theme.text }]}>
                      {item.commonName}
                    </Text>
                    <Text style={[styles.historySpecies, { color: theme.textSecondary }]}>
                      {item.species}
                    </Text>
                    
                    <View style={styles.historyBadges}>
                      <View style={[styles.historyBadge, { 
                        backgroundColor: item.isSafeToEat ? theme.success + '20' : theme.danger + '20' 
                      }]}>
                        <IconSymbol 
                          ios_icon_name={item.isSafeToEat ? 'checkmark' : 'xmark'}
                          android_material_icon_name={item.isSafeToEat ? 'check' : 'close'}
                          size={12} 
                          color={item.isSafeToEat ? theme.success : theme.danger} 
                        />
                        <Text style={[styles.badgeText, { 
                          color: item.isSafeToEat ? theme.success : theme.danger 
                        }]}>
                          Eat
                        </Text>
                      </View>
                      
                      <View style={[styles.historyBadge, { 
                        backgroundColor: item.isSafeToTouch ? theme.success + '20' : theme.danger + '20' 
                      }]}>
                        <IconSymbol 
                          ios_icon_name={item.isSafeToTouch ? 'checkmark' : 'xmark'}
                          android_material_icon_name={item.isSafeToTouch ? 'check' : 'close'}
                          size={12} 
                          color={item.isSafeToTouch ? theme.success : theme.danger} 
                        />
                        <Text style={[styles.badgeText, { 
                          color: item.isSafeToTouch ? theme.success : theme.danger 
                        }]}>
                          Touch
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron-right" 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <IconSymbol 
            ios_icon_name="lightbulb.fill" 
            android_material_icon_name="lightbulb" 
            size={24} 
            color={theme.accent} 
          />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Safety Tips</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              - Always cross-reference with multiple sources{'\n'}
              - Never consume anything you&apos;re not 100% sure about{'\n'}
              - Some species have toxic look-alikes{'\n'}
              - When in doubt, consult an expert
            </Text>
          </View>
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
    marginTop: Platform.OS === 'android' ? 24 : 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  authCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  authInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authTextContainer: {
    flex: 1,
  },
  authName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  authText: {
    fontSize: 15,
    flex: 1,
  },
  authButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historySpecies: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  historyBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
