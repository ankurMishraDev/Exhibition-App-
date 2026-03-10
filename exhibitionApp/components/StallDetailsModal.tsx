import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors } from '@/constants/theme';

interface StallDetailsModalProps {
  visible: boolean;
  stall: {
    id: string;
    stall_number: string;
    company_name?: string;
    company_logo_url?: string;
    status: 'available' | 'reserved' | 'booked' | 'disabled';
  } | null;
  exhibitorSnapshot?: {
    company_name: string;
    company_domain: string;
    company_website?: string;
    company_logo_url?: string;
    contact_number: string;
    executive_name: string;
    executive_designation: string;
  } | null;
  onClose: () => void;
}

export const StallDetailsModal: React.FC<StallDetailsModalProps> = ({
  visible,
  stall,
  exhibitorSnapshot,
  onClose,
}) => {
  if (!stall) return null;

  const handleWebsitePress = () => {
    if (exhibitorSnapshot?.company_website) {
      const url = exhibitorSnapshot.company_website.startsWith('http')
        ? exhibitorSnapshot.company_website
        : `https://${exhibitorSnapshot.company_website}`;
      Linking.openURL(url);
    }
  };

  const handlePhonePress = () => {
    if (exhibitorSnapshot?.contact_number) {
      Linking.openURL(`tel:${exhibitorSnapshot.contact_number}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[BrandColors.purple[600], BrandColors.purple[800]]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Stall Details</Text>
            <Text style={styles.modalSubtitle}>Stall #{stall.stall_number}</Text>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            {exhibitorSnapshot ? (
              <>
                {/* Company Logo */}
                {exhibitorSnapshot.company_logo_url && (
                  <View style={styles.logoContainer}>
                    <Image
                      source={{ uri: exhibitorSnapshot.company_logo_url }}
                      style={styles.companyLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Company Name */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Company Name</Text>
                  <Text style={styles.sectionValue}>{exhibitorSnapshot.company_name}</Text>
                </View>

                {/* Domain */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Industry Domain</Text>
                  <Text style={styles.sectionValue}>{exhibitorSnapshot.company_domain}</Text>
                </View>

                {/* Website */}
                {exhibitorSnapshot.company_website && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Website</Text>
                    <TouchableOpacity onPress={handleWebsitePress}>
                      <Text style={styles.linkValue}>{exhibitorSnapshot.company_website}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Executive Details */}
                <View style={styles.divider} />
                <Text style={styles.subsectionTitle}>Contact Person</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Name</Text>
                  <Text style={styles.sectionValue}>{exhibitorSnapshot.executive_name}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Designation</Text>
                  <Text style={styles.sectionValue}>{exhibitorSnapshot.executive_designation}</Text>
                </View>

                {/* Contact Number */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Phone</Text>
                  <TouchableOpacity onPress={handlePhonePress}>
                    <Text style={styles.linkValue}>{exhibitorSnapshot.contact_number}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No exhibitor information available for this stall.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={[BrandColors.purple[600], BrandColors.purple[800]]}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalBody: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  companyLogo: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  linkValue: {
    fontSize: 16,
    color: BrandColors.purple[600],
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  closeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
