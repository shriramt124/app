import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';


const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    // Get current user info
    const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            // Assuming the role is stored in the 'users' collection
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userDoc.data(),
            });
          } else {
            // If user document doesn't exist, ensure currentUser is null or handle accordingly
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Optionally, alert the user or navigate to login
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    });

    const unsubscribe = subscribeToProductGroups((groups) => {
      setProductGroups(groups);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribe();
    };
  }, []);

  const subscribeToProductGroups = (callback) => {
    setLoading(true);
    return firestore().collection('productGroups').onSnapshot((querySnapshot) => {
      const groups = [];
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(groups);
    }, (error) => {
      console.error('Error fetching product groups:', error);
      Alert.alert('Error', 'Failed to load product groups');
      setLoading(false);
      setRefreshing(false);
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const navigateToProductGroups = () => {
    navigation.navigate('ProductGroup');
  };

  const navigateToAdminDashboard = () => {
    navigation.navigate('AdminDashboard');
  };

  const navigateToAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const getGroupIcon = (groupName) => {
    const name = groupName.toLowerCase();
    if (name.includes('cook') || name.includes('utensil')) return 'restaurant';
    if (name.includes('steel') || name.includes('metal')) return 'build';
    if (name.includes('gift') || name.includes('set')) return 'card-giftcard';
    if (name.includes('hot') || name.includes('pot')) return 'local-fire-department';
    return 'category';
  };

  const getGroupColor = (index) => {
    const colors = [
      ['#4F46E5', '#7C3AED'],
      ['#059669', '#10B981'],
      ['#DC2626', '#EF4444'],
      ['#D97706', '#F59E0B'],
      ['#7C2D12', '#EA580C'],
      ['#1E40AF', '#3B82F6'],
    ];
    return colors[index % colors.length];
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ProductList', { groupId: item.id, groupName: item.name })}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={getGroupColor(index)}
        style={styles.categoryCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryIconContainer}>
          <Icon name={getGroupIcon(item.name)} size={28} color="#fff" />
        </View>
        <Text style={styles.categoryTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.description || 'Product category'}
        </Text>
        <View style={styles.categoryArrow}>
          <Icon name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleRefresh = () => {
    setRefreshing(true);
    // fetchProductGroups() logic would go here if not using subscription
    // For subscription-based data, refreshing is handled by the listener itself.
    // If you need to re-fetch manually, you might need to reset the subscription or fetch anew.
    // For now, we'll just set refreshing to false after a short delay to simulate.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.appName}>Stock Manager</Text>
            <Text style={styles.welcomeText}>Welcome, {currentUser?.email?.split('@')[0] || 'User'}</Text>
            {isAdmin() && (
              <Text style={styles.roleIndicator}>ADMIN</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {isAdmin() && (
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={navigateToAdminDashboard}
              >
                <Icon name="admin-panel-settings" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="logout" size={20} color="#8E92BC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.subtitle}>
            Welcome, {currentUser?.displayName || currentUser?.name || currentUser?.email}
          </Text>
          <Text style={styles.roleText}>
            Role: {isAdmin() ? 'Administrator' : 'User'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.statsCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="category" size={24} color="#fff" />
              <View style={styles.statsContent}>
                <Text style={styles.statsNumber}>{productGroups.length}</Text>
                <Text style={styles.statsLabel}>Categories</Text>
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
            <View style={styles.emptyContainer}>
              <Text>Loading...</Text>
            </View>
          ) : productGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="inventory" size={48} color="#8E92BC" />
                </View>
                <Text style={styles.emptyTitle}>No Categories Yet</Text>
                <Text style={styles.emptyDescription}>
                  Start by creating your first product category to organize your inventory
                </Text>
                {isAdmin() && (
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('ProductGroup')}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.createButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="add" size={18} color="#fff" />
                      <Text style={styles.createButtonText}>Create Category</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <FlatList
              data={productGroups}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.categoriesGrid}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.categoriesRow}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          )}

          {/* Floating Action Button */}
          {isAdmin() && (
            <TouchableOpacity 
              style={styles.fab}
              onPress={() => navigation.navigate('ProductGroup')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.fabGradient}
              >
                <Icon name="add" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E3A59',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 4,
  },
  categoriesGrid: {
    paddingBottom: 100,
  },
  categoriesRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 50) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryCardGradient: {
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  categoryIconContainer: {
    alignSelf: 'flex-start',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  categoryArrow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  adminActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 12,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  adminActionButton: {
    alignItems: 'center',
  },
  adminActionText: {
    fontSize: 12,
    color: '#8E92BC',
    marginTop: 4,
  },
  userInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default HomeScreen;