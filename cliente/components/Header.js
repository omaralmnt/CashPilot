import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ 
  title = "CashPilot", 
  showProfile = true, 
  showNotifications = true,
  onProfilePress,
  onNotificationPress 
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="cash" size={22} color="white" />
            </View>
            <Text style={styles.appTitle}>{title}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {showNotifications && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onNotificationPress}
            >
              <Ionicons 
                name="notifications-outline" 
                size={20} 
                color="white" 
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {showProfile && (
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={onProfilePress}
            >
              <Ionicons 
                name="person" 
                size={18} 
                color="#667eea" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Decorative gradient overlay */}
      <View style={styles.gradientOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#667eea',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backdropFilter: 'blur(10px)',
  },
  appTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 44, // Align with title
    display: 'none', // Hidden since we removed the subtitle
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    zIndex: 1,
  },
});

export default Header;