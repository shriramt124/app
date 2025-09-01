
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const StockUpdateScreen = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const productDoc = await firestore().collection('products').doc(productId).get();
      if (productDoc.exists) {
        setProduct({ id: productDoc.id, ...productDoc.data() });
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!quantity || isNaN(parseInt(quantity))) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    const updateQuantity = parseInt(quantity);
    const newStock = operation === 'add' 
      ? product.stock + updateQuantity 
      : product.stock - updateQuantity;

    if (newStock < 0) {
      Alert.alert('Invalid Operation', 'Stock cannot be negative');
      return;
    }

    setUpdating(true);
    try {
      await firestore().collection('products').doc(productId).update({
        stock: newStock,
        lastUpdated: new Date().toISOString(),
      });

      // Add to stock history
      await firestore().collection('stockHistory').add({
        productId,
        productName: product.name,
        operation,
        quantity: updateQuantity,
        previousStock: product.stock,
        newStock,
        reason: reason.trim() || `Stock ${operation === 'add' ? 'added' : 'removed'}`,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Success', 'Stock updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Failed to update stock. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getOperationColor = () => {
    return operation === 'add' ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626'];
  };

  const getOperationIcon = () => {
    return operation === 'add' ? 'add-circle' : 'remove-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Professional Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#2E3A59" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Update Stock</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{product?.name}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Current Stock Card */}
            <View style={styles.currentStockCard}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.currentStockGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.currentStockContent}>
                  <Icon name="inventory-2" size={32} color="#fff" />
                  <View style={styles.currentStockInfo}>
                    <Text style={styles.currentStockLabel}>Current Stock</Text>
                    <Text style={styles.currentStockValue}>
                      {product?.stock} {product?.unit}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Operation Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Operation Type</Text>
              <View style={styles.operationButtons}>
                <TouchableOpacity 
                  style={[
                    styles.operationButton,
                    operation === 'add' && styles.operationButtonSelected
                  ]}
                  onPress={() => setOperation('add')}
                >
                  <Icon 
                    name="add-circle" 
                    size={24} 
                    color={operation === 'add' ? '#fff' : '#10B981'} 
                  />
                  <Text style={[
                    styles.operationButtonText,
                    operation === 'add' && styles.operationButtonTextSelected
                  ]}>
                    Add Stock
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.operationButton,
                    operation === 'subtract' && styles.operationButtonSelected
                  ]}
                  onPress={() => setOperation('subtract')}
                >
                  <Icon 
                    name="remove-circle" 
                    size={24} 
                    color={operation === 'subtract' ? '#fff' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.operationButtonText,
                    operation === 'subtract' && styles.operationButtonTextSelected
                  ]}>
                    Remove Stock
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quantity Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.inputContainer}>
                <Icon name={getOperationIcon()} size={20} color="#8E92BC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#B0B3C1"
                />
                <Text style={styles.unitText}>{product?.unit}</Text>
              </View>
            </View>

            {/* Reason Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason (Optional)</Text>
              <View style={[styles.inputContainer, styles.reasonInputContainer]}>
                <TextInput
                  style={[styles.input, styles.reasonInput]}
                  placeholder="Enter reason for stock update..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#B0B3C1"
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Preview Card */}
            {quantity && !isNaN(parseInt(quantity)) && (
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Icon name="preview" size={20} color="#2E3A59" />
                  <Text style={styles.previewTitle}>Preview Changes</Text>
                </View>
                <View style={styles.previewContent}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Current Stock:</Text>
                    <Text style={styles.previewValue}>{product?.stock} {product?.unit}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>
                      {operation === 'add' ? 'Adding:' : 'Removing:'}
                    </Text>
                    <Text style={[
                      styles.previewValue,
                      { color: operation === 'add' ? '#10B981' : '#EF4444' }
                    ]}>
                      {operation === 'add' ? '+' : '-'}{quantity} {product?.unit}
                    </Text>
                  </View>
                  <View style={[styles.previewRow, styles.previewRowFinal]}>
                    <Text style={styles.previewLabelFinal}>New Stock:</Text>
                    <Text style={styles.previewValueFinal}>
                      {operation === 'add' 
                        ? product?.stock + parseInt(quantity) 
                        : product?.stock - parseInt(quantity)
                      } {product?.unit}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Update Button */}
            <TouchableOpacity 
              style={[styles.updateButton, updating && styles.updateButtonDisabled]}
              onPress={handleStockUpdate}
              disabled={updating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={updating ? ['#B0B3C1', '#B0B3C1'] : getOperationColor()}
                style={styles.updateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="update" size={20} color="#fff" />
                    <Text style={styles.updateButtonText}>Update Stock</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 2,
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
  currentStockCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  currentStockGradient: {
    padding: 20,
  },
  currentStockContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStockInfo: {
    marginLeft: 16,
  },
  currentStockLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  currentStockValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 12,
  },
  operationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  operationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  operationButtonSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  operationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E92BC',
    marginLeft: 8,
  },
  operationButtonTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2E3A59',
    paddingVertical: 0,
  },
  unitText: {
    fontSize: 14,
    color: '#8E92BC',
    fontWeight: '500',
  },
  reasonInputContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginLeft: 8,
  },
  previewContent: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8E92BC',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E3A59',
  },
  previewLabelFinal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
  },
  previewValueFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  updateButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default StockUpdateScreen;
