
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { deleteProduct } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('products')
      .doc(productId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setProduct({ id: doc.id, ...doc.data() });
          } else {
            Alert.alert('Error', 'Product not found', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching product:', error);
          Alert.alert('Error', 'Failed to load product details');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [productId, navigation]);

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: '#EF4444', text: 'Out of Stock', icon: 'error', bgColor: '#FEF2F2' };
    if (stock < 10) return { color: '#F59E0B', text: 'Low Stock', icon: 'warning', bgColor: '#FFFBEB' };
    return { color: '#10B981', text: 'In Stock', icon: 'check-circle', bgColor: '#ECFDF5' };
  };

  const getProductImage = (productName) => {
    const name = productName?.toLowerCase() || '';
    if (name.includes('bottle') || name.includes('water')) return require('../assets/bottle.png');
    if (name.includes('pot') || name.includes('cooker')) return require('../assets/pot.png');
    if (name.includes('pan') || name.includes('fry')) return require('../assets/pan.png');
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.errorText}>Product not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const stockStatus = getStockStatus(product.stock);
  const productImage = getProductImage(product.name);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#2E3A59" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Product Details</Text>
          </View>
          {isAdmin() && (
            <TouchableOpacity 
              style={styles.deleteHeaderButton}
              onPress={handleDeleteProduct}
            >
              <Icon name="delete" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
          {!isAdmin() && <View style={styles.headerSpacer} />}
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {product.imageUri ? (
                <Image source={{ uri: product.imageUri }} style={styles.productImage} />
              ) : productImage ? (
                <Image source={productImage} style={styles.productImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="inventory" size={48} color="#8E92BC" />
                </View>
              )}
              
              {/* Stock Badge */}
              <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                <Icon name={stockStatus.icon} size={16} color={stockStatus.color} />
                <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                  {stockStatus.text}
                </Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>₹{product.mrp.toLocaleString()}</Text>
              
              {product.description && (
                <Text style={styles.productDescription}>{product.description}</Text>
              )}
            </View>

            {/* Stock Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stock Information</Text>
              <View style={styles.stockGrid}>
                <View style={styles.stockCard}>
                  <Icon name="inventory-2" size={24} color="#4F46E5" />
                  <Text style={styles.stockCardValue}>{product.stock}</Text>
                  <Text style={styles.stockCardLabel}>Current Stock ({product.unit})</Text>
                </View>
                
                <View style={styles.stockCard}>
                  <Icon name="inbox" size={24} color="#7C3AED" />
                  <Text style={styles.stockCardValue}>{product.cartons || 0}</Text>
                  <Text style={styles.stockCardLabel}>Cartons</Text>
                </View>
              </View>
            </View>

            {/* Product Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Unit</Text>
                  <Text style={styles.detailValue}>{product.unit}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {new Date(product.lastUpdated).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Admin Actions */}
            {isAdmin() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Actions</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('StockUpdate', { 
                      productId: product.id, 
                      productName: product.name,
                      currentStock: product.stock 
                    })}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="update" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Update Stock</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('StockHistory', { 
                      productId: product.id, 
                      productName: product.name 
                    })}
                  >
                    <View style={styles.secondaryActionButton}>
                      <Icon name="history" size={20} color="#4F46E5" />
                      <Text style={styles.secondaryActionButtonText}>Stock History</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleDeleteProduct}
                  >
                    <View style={[styles.secondaryActionButton, { borderColor: '#EF4444' }]}>
                      <Icon name="delete" size={20} color="#EF4444" />
                      <Text style={[styles.secondaryActionButtonText, { color: '#EF4444' }]}>
                        Delete Product
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8E92BC',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
  },
  deleteHeaderButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  productInfo: {
    marginBottom: 24,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#8E92BC',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 16,
  },
  stockGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stockCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stockCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E3A59',
    marginTop: 8,
  },
  stockCardLabel: {
    fontSize: 12,
    color: '#8E92BC',
    marginTop: 4,
    textAlign: 'center',
  },
  detailsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E92BC',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E3A59',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  secondaryActionButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProductDetailScreen;
