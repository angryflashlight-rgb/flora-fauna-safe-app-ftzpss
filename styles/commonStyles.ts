
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Nature-themed color palette
export const colors = {
  // Light theme - Fresh, natural colors
  light: {
    background: '#F5F9F5',
    card: '#FFFFFF',
    text: '#1A3A1A',
    textSecondary: '#4A6B4A',
    primary: '#2D7A2D',
    secondary: '#8BC34A',
    accent: '#FF9800',
    highlight: '#E8F5E9',
    border: '#C8E6C9',
    danger: '#D32F2F',
    warning: '#FFA726',
    success: '#66BB6A',
  },
  // Dark theme - Deep forest colors
  dark: {
    background: '#0D1F0D',
    card: '#1A2F1A',
    text: '#E8F5E9',
    textSecondary: '#A5D6A7',
    primary: '#66BB6A',
    secondary: '#4CAF50',
    accent: '#FFB74D',
    highlight: '#1B3A1B',
    border: '#2E5D2E',
    danger: '#EF5350',
    warning: '#FFA726',
    success: '#81C784',
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
  },
});
