
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getProductGroups, getTotalProducts } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const [productGroups, setProductGroups] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groups, total] = await Promise.all([
        getProductGroups(),
        getTotalProducts(),
      ]);
      setProductGroups(groups);
      setTotalProducts(total);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const navigateToAdminDashboard = () => {
    navigation.navigate('AdminDashboard');
  };

  const navigateToAddProduct = () => {
    if (productGroups.length === 0) {
      Alert.alert(
        'No Product Groups',
        'Please create a product group first before adding products.',
        [
          {
            text: 'Create Group',
            onPress: () => navigation.navigate('ProductGroup'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    
    navigation.navigate('ProductGroup');
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('ProductList', { 
        groupId: item.id, 
        groupName: item.name 
      })}
      activeOpacity={0.9}
    >
      <View style={styles.groupCardHeader}>
        <View style={styles.groupIconContainer}>
          <Icon name="category" size={24} color="#4F46E5" />
        </View>
        <View style={styles.groupCardContent}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          {item.description && (
            <Text style={styles.groupDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color="#8E92BC" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.appName}>Stock Manager</Text>
            <Text style={styles.welcomeText}>
              Welcome, {currentUser?.name || currentUser?.email || 'User'}
            </Text>
            {isAdmin() && (
              <Text style={styles.roleIndicator}>● ADMIN</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {isAdmin() && (
              <TouchableOpacity style={styles.adminButton} onPress={navigateToAdminDashboard}>
                <Icon name="admin-panel-settings" size={24} color="#4a80f5" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.statsCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="inventory" size={32} color="#fff" />
              <View style={styles.statsContent}>
                <Text style={styles.statsNumber}>{totalProducts}</Text>
                <Text style={styles.statsLabel}>Total Products</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Admin Actions */}
        {isAdmin() && (
          <View style={styles.adminActionsContainer}>
            <Text style={styles.adminActionsTitle}>Admin Actions</Text>
            <View style={styles.adminButtonsRow}>
              <TouchableOpacity style={styles.adminActionButton} onPress={navigateToAdminDashboard}>
                <Icon name="people" size={24} color="#4a80f5" />
                <Text style={styles.adminActionText}>Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminActionButton} onPress={() => navigation.navigate('ProductGroup')}>
                <Icon name="category" size={24} color="#4a80f5" />
                <Text style={styles.adminActionText}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminActionButton} onPress={navigateToAddProduct}>
                <Icon name="add-box" size={24} color="#4a80f5" />
                <Text style={styles.adminActionText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Product Categories</Text>
            <Text style={styles.sectionSubtitle}>Manage your inventory by category</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : productGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="category" size={48} color="#8E92BC" />
                </View>
                <Text style={styles.emptyTitle}>No Categories Found</Text>
                <Text style={styles.emptyDescription}>
                  Create your first product category to get started
                </Text>
                {isAdmin() && (
                  <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={() => navigation.navigate('ProductGroup')}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.createFirstButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="add" size={18} color="#fff" />
                      <Text style={styles.createFirstButtonText}>Create Category</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <FlatList
              data={productGroups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.groupsList}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E3A59',
  },
  welcomeText: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 2,
  },
  roleIndicator: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsContent: {
    marginLeft: 16,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  adminActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  adminActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 12,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adminActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminActionText: {
    fontSize: 12,
    color: '#4a80f5',
    marginTop: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8E92BC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E92BC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createFirstButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createFirstButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  groupsList: {
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  groupDescription: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 4,
  },
});

export default HomeScreen;
