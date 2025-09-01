import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';

const AddProductScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [cartons, setCartons] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { isAdmin } = useAuth();

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to select images',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot access gallery without permission');
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleAddProduct = async () => {
    if (name.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }

    if (mrp.trim() === '') {
      Alert.alert('Validation Error', 'Please enter product MRP');
      return;
    }

    if (stock.trim() === '') {
      Alert.alert('Validation Error', 'Please enter initial stock');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        groupId,
        name: name.trim(),
        mrp: parseFloat(mrp),
        stock: parseInt(stock, 10),
        unit: unit.trim(),
        cartons: cartons.trim() ? parseInt(cartons, 10) : 0,
        description: description.trim(),
        imageUri: selectedImage?.uri || null,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      await firestore().collection('products').add(productData);

      Alert.alert('Success', 'Product added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const unitOptions = ['pcs', 'kg', 'grams', 'liters', 'ml', 'boxes', 'sets'];

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin()) {
      Alert.alert(
        'Access Denied',
        'Only administrators can add products.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    // Placeholder for loading product groups if needed in the future
    // loadProductGroups(); 
  }, [isAdmin, navigation]);


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Professional Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#2E3A59" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Add New Product</Text>
            <Text style={styles.headerSubtitle}>{groupName}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* Image Selection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Image</Text>
              <TouchableOpacity style={styles.imageUploadArea} onPress={handleImagePicker}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                    <View style={styles.imageOverlay}>
                      <Icon name="edit" size={20} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Icon name="add-photo-alternate" size={32} color="#8E92BC" />
                    <Text style={styles.uploadText}>Tap to add product image</Text>
                    <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Product Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <View style={styles.inputContainer}>
                  <Icon name="inventory" size={20} color="#8E92BC" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter product name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#B0B3C1"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MRP (₹) *</Text>
                <View style={styles.inputContainer}>
                  <Icon name="currency-rupee" size={20} color="#8E92BC" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={mrp}
                    onChangeText={setMrp}
                    keyboardType="numeric"
                    placeholderTextColor="#B0B3C1"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Stock Quantity *</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="inventory-2" size={20} color="#8E92BC" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                      placeholderTextColor="#B0B3C1"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitContainer}>
                    {unitOptions.map((unitOption) => (
                      <TouchableOpacity
                        key={unitOption}
                        style={[
                          styles.unitButton,
                          unit === unitOption && styles.unitButtonSelected
                        ]}
                        onPress={() => setUnit(unitOption)}
                      >
                        <Text style={[
                          styles.unitButtonText,
                          unit === unitOption && styles.unitButtonTextSelected
                        ]}>
                          {unitOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cartons (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="inbox" size={20} color="#8E92BC" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={cartons}
                    onChangeText={setCartons}
                    keyboardType="numeric"
                    placeholderTextColor="#B0B3C1"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter product description..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#B0B3C1"
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAddProduct}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#B0B3C1', '#B0B3C1'] : ['#4F46E5', '#7C3AED']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="add" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Add Product</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 16,
  },
  imageUploadArea: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  selectedImageContainer: {
    position: 'relative',
    height: 200,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#2E3A59',
    fontWeight: '500',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#8E92BC',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E3A59',
    marginBottom: 8,
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
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  unitContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginTop: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 4,
  },
  unitButtonSelected: {
    backgroundColor: '#4F46E5',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#8E92BC',
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddProductScreen;