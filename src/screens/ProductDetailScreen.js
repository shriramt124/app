import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { subscribeToProductById } from '../services/firebaseService';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToProductById } from '../services/firebaseService'; // Added import for AuthContext

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    // Set up real-time listener for product details
    const unsubscribe = subscribeToProductById(productId, (productData) => {
      setProduct(productData);
      setLoading(false);
      navigation.setOptions({
        title: productData.name,
      });
    });

    // Clean up listener on component unmount
    return () => {
      unsubscribe();
    };
  }, [productId, navigation]);



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a80f5" />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Icon name="inventory" size={24} color="#4a80f5" />
            <Text style={styles.title}>{product.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MRP:</Text>
            <Text style={styles.detailValue}>₹{product.mrp}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Stock:</Text>
            <Text style={styles.detailValue}>{product.stock} {product.unit}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cartons:</Text>
            <Text style={styles.detailValue}>{product.cartons || 0}</Text>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          <View style={styles.actionsContainer}>
            {isAdmin() && ( // Conditionally render update button for admin
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => navigation.navigate('StockUpdate', {
                  productId: product.id,
                  productName: product.name,
                  currentStock: product.stock,
                  currentCartons: product.cartons || 0,
                })}
              >
                <Icon name="edit" size={20} color="#fff" style={styles.actionIcon} />
                <Text style={styles.actionText}>Update Stock</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50', marginLeft: isAdmin() ? 10 : 0 }]}
              onPress={() => navigation.navigate('StockHistory', { productId: product.id, productName: product.name })}
            >
              <Icon name="history" size={20} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionContainer: {
    marginTop: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: '#4a80f5',
    minWidth: 150,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProductDetailScreen;