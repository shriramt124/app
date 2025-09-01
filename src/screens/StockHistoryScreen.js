import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserById, subscribeToStockHistory } from '../services/firebaseService';

const StockHistoryScreen = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: `Stock History: ${productName}`,
    });
    
    // Set up real-time listener for stock history
    const unsubscribe = subscribeToStockHistory(productId, async (historyData) => {
      setHistory(historyData);
      
      // Fetch user details for each history entry
      const userIds = [...new Set(historyData.map(item => item.userId))];
      await fetchUserDetails(userIds);
      
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, [productId, productName]);



  const fetchUserDetails = async (userIds) => {
    const cache = { ...userCache };
    
    for (const userId of userIds) {
      if (!cache[userId]) {
        try {
          const result = await getUserById(userId);
          if (result.success) {
            cache[userId] = result.user;
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }
    }
    
    setUserCache(cache);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getUserName = (userId) => {
    if (userCache[userId]) {
      return userCache[userId].displayName || userCache[userId].email || 'Unknown User';
    }
    return 'Unknown User';
  };

  const renderHistoryItem = ({ item }) => {
    const isAddition = item.changeAmount > 0;
    
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          <Text style={[styles.changeAmount, isAddition ? styles.addition : styles.reduction]}>
            {isAddition ? '+' : ''}{item.changeAmount} units
          </Text>
        </View>
        
        <View style={styles.historyDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Previous Stock:</Text> {item.previousStock} units
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>New Stock:</Text> {item.newStock} units
          </Text>
          
          {(item.previousCartons !== undefined || item.newCartons !== undefined) && (
            <View style={styles.cartonDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Previous Cartons:</Text> {item.previousCartons || 0}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>New Cartons:</Text> {item.newCartons || 0}
              </Text>
            </View>
          )}
          
          {item.changeReason && (
            <Text style={styles.reason}>
              <Text style={styles.detailLabel}>Reason:</Text> {item.changeReason}
            </Text>
          )}
          
          <Text style={styles.user}>
            <Text style={styles.detailLabel}>Updated by:</Text> {getUserName(item.userId)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading stock history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stock history available</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addition: {
    color: '#28a745',
  },
  reduction: {
    color: '#dc3545',
  },
  historyDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  cartonDetails: {
    marginTop: 8,
  },
  reason: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  user: {
    fontSize: 14,
    marginTop: 8,
    color: '#666',
  },
});

export default StockHistoryScreen;