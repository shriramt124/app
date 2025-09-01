import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getProductGroups, addProductGroup, updateProductGroup, deleteProductGroup, checkUserRole } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const ProductGroupScreen = ({ navigation }) => {
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadProductGroups();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    if (currentUser) {
      const result = await checkUserRole(currentUser.uid);
      if (result.success) {
        setIsAdmin(result.role === 'admin');
      }
    }
  };

  const loadProductGroups = async () => {
    setLoading(true);
    try {
      const groups = await getProductGroups();
      setProductGroups(groups);
    } catch (error) {
      console.error('Error loading product groups:', error);
      Alert.alert('Error', 'Failed to load product groups');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setGroupName('');
    setGroupDescription('');
    setEditingGroup(null);
    setModalVisible(true);
  };

  const openEditModal = (group) => {
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setEditingGroup(group);
    setModalVisible(true);
  };

  const handleSaveGroup = async () => {
    if (groupName.trim() === '') {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      if (editingGroup) {
        await updateProductGroup(editingGroup.id, groupName.trim(), groupDescription.trim());
        Alert.alert('Success', 'Product group updated successfully');
      } else {
        await addProductGroup(groupName.trim(), groupDescription.trim());
        Alert.alert('Success', 'Product group added successfully');
      }
      loadProductGroups();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving product group:', error);
      Alert.alert('Error', `Failed to ${editingGroup ? 'update' : 'add'} product group`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteProductGroup(id);
              loadProductGroups();
              Alert.alert('Success', 'Product group deleted successfully');
            } catch (error) {
              console.error('Error deleting product group:', error);
              Alert.alert('Error', 'Failed to delete product group');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupItem}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.description && <Text style={styles.groupDescription}>{item.description}</Text>}
      </View>
      {isAdmin && (
        <View style={styles.groupActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Icon name="edit" size={20} color="#4a80f5" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteGroup(item.id)}
          >
            <Icon name="delete" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Product Groups</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={openAddModal}
          >
            <Icon name="add" size={24} color="#4a80f5" />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={styles.placeholder} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a80f5" style={styles.loader} />
      ) : (
        <FlatList
          data={productGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No product groups found.</Text>}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingGroup ? 'Edit Product Group' : 'Add Product Group'}</Text>
            
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  groupItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupInfo: {
    flex: 1,
    marginRight: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4a80f5',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProductGroupScreen;