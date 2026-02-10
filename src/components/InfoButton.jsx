import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * InfoButton Component
 * Displays an info icon that shows detailed guidelines in a modal
 */
const InfoButton = ({ 
  title = 'Guidelines', 
  guidelines = [],
  examples = [],
  rules = [],
  tips = [],
  size = 20,
  color = '#007AFF',
  onPress = () => {},
  style = {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
    onPress();
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.infoButton, { width: size, height: size }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.infoIcon, { fontSize: size * 0.6, color }]}>
          ℹ️
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
          >
            {/* Guidelines Section */}
            {guidelines && guidelines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Guidelines</Text>
                {guidelines.map((guideline, index) => (
                  <View key={index} style={styles.guidelineItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.guidelineText}>{guideline}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rules Section */}
            {rules && rules.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Naming Rules</Text>
                {rules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <View style={styles.ruleTitleContainer}>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                    </View>
                    <Text style={styles.ruleDescription}>
                      {rule.description}
                    </Text>
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleLabel}>✓ Good:</Text>
                      <Text style={styles.exampleGood}>{rule.good}</Text>
                    </View>
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleLabel}>✗ Avoid:</Text>
                      <Text style={styles.exampleBad}>{rule.bad}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Examples Section */}
            {examples && examples.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Examples</Text>
                {examples.map((example, index) => (
                  <View key={index} style={styles.exampleItem}>
                    <Text style={styles.exampleNumber}>{index + 1}.</Text>
                    <Text style={styles.exampleText}>{example}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips Section */}
            {tips && tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
                {tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bottom Padding */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Info Button Styles
  infoButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoIcon: {
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },

  // Content Styles
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Section Styles
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Guideline Styles
  guidelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  bulletPoint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 10,
    marginTop: -2,
  },
  guidelineText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },

  // Rule Styles
  ruleItem: {
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ruleTitleContainer: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  ruleDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  exampleContainer: {
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  exampleGood: {
    fontSize: 13,
    color: '#27ae60',
    fontStyle: 'italic',
    paddingLeft: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fff4',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  exampleBad: {
    fontSize: 13,
    color: '#e74c3c',
    fontStyle: 'italic',
    paddingLeft: 12,
    paddingVertical: 6,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
  },

  // Example Styles
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  exampleNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27ae60',
    marginRight: 10,
    minWidth: 24,
  },
  exampleText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },

  // Tip Styles
  tipItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fffbf0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});

export default InfoButton;
