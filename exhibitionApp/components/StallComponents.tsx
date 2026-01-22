import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Stall } from '@/types';

interface StallCellProps {
  stall: Stall;
  size: number;
  isSelected: boolean;
  onPress: () => void;
}

export const StallCell: React.FC<StallCellProps> = ({ stall, size, isSelected, onPress }) => {
  const getStallStyle = () => {
    switch (stall.status) {
      case 'available':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#4CAF50',
          borderWidth: 2,
        };
      case 'booked':
        return {
          backgroundColor: '#F5F5F5',
          borderColor: '#9C27B0',
          borderWidth: 2,
        };
      case 'reserved':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: '#E0E0E0',
          borderColor: '#999',
          borderWidth: 1,
        };
    }
  };

  const renderWidth = size * stall.width;
  const renderHeight = size * stall.height;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={stall.status !== 'available'}
      activeOpacity={0.7}
      style={[
        {
          width: renderWidth,
          height: renderHeight,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        },
        getStallStyle(),
        isSelected && {
          borderColor: '#2196F3',
          borderWidth: 3,
          backgroundColor: '#E3F2FD',
        },
      ]}
    >
      {stall.status === 'booked' && stall.company_logo_url ? (
        <Image
          source={{ uri: stall.company_logo_url }}
          style={{
            width: renderWidth * 0.7,
            height: renderHeight * 0.7,
            resizeMode: 'contain',
          }}
        />
      ) : stall.status === 'booked' && stall.company_name ? (
        <View style={{ alignItems: 'center', padding: 4 }}>
          <Text
            style={{
              fontSize: Math.max(size * 0.15, 8),
              fontWeight: '600',
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            {stall.company_name}
          </Text>
          <Text style={{ fontSize: Math.max(size * 0.12, 7), color: '#666' }}>
            {stall.stall_number}
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: Math.max(size * 0.2, 9),
              fontWeight: '600',
              color: stall.status === 'available' ? '#4CAF50' : '#666',
            }}
            numberOfLines={1}
          >
            {stall.stall_number}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface LegendItemProps {
  color: string;
  borderColor: string;
  label: string;
}

export const LegendItem: React.FC<LegendItemProps> = ({ color, borderColor, label }) => (
  <View style={styles.legendItem}>
    <View
      style={[
        styles.legendBox,
        {
          backgroundColor: color,
          borderColor: borderColor,
        },
      ]}
    />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

export const Legend: React.FC = () => (
  <View style={styles.legendContainer}>
    <LegendItem color="#FFFFFF" borderColor="#4CAF50" label="Available" />
    <LegendItem color="#F5F5F5" borderColor="#9C27B0" label="Booked" />
    <LegendItem color="#FFF3E0" borderColor="#FF9800" label="Reserved" />
  </View>
);

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
