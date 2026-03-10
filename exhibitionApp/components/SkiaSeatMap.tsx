import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, SeatColors } from '@/constants/theme';
import { SeatPosition, Stall } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

interface SkiaSeatMapProps {
  eventId: string;
  stalls: Stall[];
  onStallSelect: (stall: Stall) => void;
  selectedStallId?: string;
}

export default function SkiaSeatMap({ 
  eventId, 
  stalls, 
  onStallSelect, 
  selectedStallId 
}: SkiaSeatMapProps) {
  const [canvasSize] = useState({
    width: screenWidth - 40,
    height: 400,
  });

  const [seatPositions, setSeatPositions] = useState<SeatPosition[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: screenWidth - 40, height: 400 });
  const [zoomLevel] = useState(1);

  // Validate that we have proper data before rendering Canvas
  const canRenderCanvas = useMemo(() => {
    if (!stalls || !Array.isArray(stalls) || stalls.length === 0) {
      return false;
    }

    // Check if at least some stalls have valid coordinates
    const validCount = stalls.filter(s => 
      s &&
      typeof s.position_x === 'number' &&
      typeof s.position_y === 'number' &&
      !isNaN(s.position_x) &&
      !isNaN(s.position_y)
    ).length;

    console.log('[SkiaSeatMap] canRenderCanvas check:', { validCount, total: stalls.length });
    return validCount > 0;
  }, [stalls]);

  // Convert stalls data to seat positions for Skia rendering
  useEffect(() => {
    console.log('[SkiaSeatMap] useEffect triggered:', { stallsCount: stalls?.length });
    if (!stalls || !Array.isArray(stalls) || stalls.length === 0) {
      setSeatPositions([]);
      return;
    }

    // Filter out invalid stalls before rendering
    const validStalls = stalls.filter(stall => 
      stall && 
      typeof stall.position_x === 'number' && 
      typeof stall.position_y === 'number' &&
      !isNaN(stall.position_x) &&
      !isNaN(stall.position_y)
    );

    if (validStalls.length === 0) {
      setSeatPositions([]);
      return;
    }

    // Calculate bounds for stall positioning
    const maxX = Math.max(...validStalls.map(s => s.position_x));
    const maxY = Math.max(...validStalls.map(s => s.position_y));
    const minX = Math.min(...validStalls.map(s => s.position_x));
    const minY = Math.min(...validStalls.map(s => s.position_y));

    const padding = 80; // Increased padding for stage area
    const stallSize = 60; // Larger stall size - 60px instead of 30px
    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;

    // Calculate total canvas size needed (no auto-scaling, will scroll)
    const totalWidth = gridWidth * stallSize + padding * 2;
    const totalHeight = gridHeight * stallSize + padding * 2;

    console.log('[SkiaSeatMap] Canvas dimensions:', { 
      bounds: { minX, maxX, minY, maxY },
      grid: { width: gridWidth, height: gridHeight },
      canvas: { width: totalWidth, height: totalHeight },
      stallSize
    });

    const positions = validStalls.map(stall => {
      return {
        x: padding + (stall.position_x - minX) * stallSize,
        y: padding + (stall.position_y - minY) * stallSize,
        width: stallSize * 0.9, // 90% of stallSize for gaps
        height: stallSize * 0.9,
        stallId: stall.id,
        stallNumber: stall.stall_number,
        status: stall.status,
      };
    });

    setCanvasDimensions({ width: totalWidth, height: totalHeight });

    setSeatPositions(positions);
  }, [stalls, zoomLevel]);

  // CRITICAL: Early return AFTER all hooks but BEFORE Canvas render
  if (!canRenderCanvas) {
    console.log('[SkiaSeatMap] Early return: canRenderCanvas is false');
    return (
      <View style={styles.container}>
        <View style={[styles.canvas, { width: canvasSize.width, height: canvasSize.height, justifyContent: 'center', alignItems: 'center' }]}>
          <ThemedText style={styles.emptyIcon}>⏳</ThemedText>
          <ThemedText style={styles.emptyText}>Loading stalls...</ThemedText>
        </View>
      </View>
    );
  }

  // Get color based on stall status
  const getStallColor = (status: Stall['status'], isSelected: boolean) => {
    if (isSelected) {
      return BrandColors.purple[400]; // Highlighted selection
    }
    
    switch (status) {
      case 'available':
        return SeatColors.available;
      case 'reserved':
        return SeatColors.reserved;
      case 'booked':
        return SeatColors.booked;
      case 'disabled':
        return SeatColors.disabled;
      default:
        return BrandColors.gray[300];
    }
  };

  const renderStalls = () => {
    if (!seatPositions || seatPositions.length === 0) {
      return null;
    }

    return seatPositions.map((seat, index) => {
      const isSelected = seat.stallId === selectedStallId;
      const color = getStallColor(seat.status, isSelected);
      
      return (
        <Group key={`stall-${index}`}>
          {/* Stall rectangle */}
          <Rect
            x={seat.x}
            y={seat.y}
            width={seat.width}
            height={seat.height}
            color={color}
            style="fill"
          />
          
          {/* Stall border */}
          <Rect
            x={seat.x}
            y={seat.y}
            width={seat.width}
            height={seat.height}
            color={isSelected ? BrandColors.purple[600] : 'white'}
            style="stroke"
            strokeWidth={isSelected ? 3 : 1}
          />
        </Group>
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: SeatColors.available }]} />
          <ThemedText style={styles.legendText}>Available</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: SeatColors.reserved }]} />
          <ThemedText style={styles.legendText}>Reserved</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: SeatColors.booked }]} />
          <ThemedText style={styles.legendText}>Booked</ThemedText>
        </View>
        {selectedStallId && (
          <View style={styles.legendRow}>
            <View style={[styles.legendItem, { backgroundColor: BrandColors.purple[400] }]} />
            <ThemedText style={styles.legendText}>Selected</ThemedText>
          </View>
        )}
      </View>

      {/* Seat Map Canvas - Scrollable */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        bounces={false}
      >
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          bounces={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          <View
            style={[styles.canvas, { width: canvasDimensions.width, height: canvasDimensions.height }]}
          >
            <Canvas
              style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
            >
              {/* Stage area indicator */}
              <Rect
                x={canvasDimensions.width / 2 - 80}
                y={30}
                width={160}
                height={40}
                color={BrandColors.gray[300]}
                style="fill"
              />
              
              {/* Render all stalls */}
              {renderStalls()}
            </Canvas>
            
            {/* Touchable Overlays for Each Stall */}
            {seatPositions.map((seat, index) => {
              const stall = stalls.find(s => s.id === seat.stallId);
              if (!stall) return null;
              
              return (
                <TouchableOpacity
                  key={`touch-${index}`}
                  style={{
                    position: 'absolute',
                    left: seat.x,
                    top: seat.y,
                    width: seat.width,
                    height: seat.height,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (stall.status === 'available') {
                      onStallSelect(stall);
                    } else {
                      Alert.alert('Unavailable', `Stall ${stall.stall_number} is ${stall.status}`);
                    }
                  }}
                  activeOpacity={0.7}
                />
              );
            })}
            
            {/* Text Overlay for Stall Numbers */}
          {seatPositions.map((seat, index) => {
            const stallNumber = String(seat.stallNumber || '');
            if (!stallNumber) return null;
            
            return (
              <Text
                key={`label-${index}`}
                style={{
                  position: 'absolute',
                  left: seat.x + seat.width / 2 - 15,
                  top: seat.y + seat.height / 2 - 8,
                  fontSize: 11,
                  fontWeight: '600',
                  color: seat.status === 'available' ? '#FFF' : '#333',
                  textAlign: 'center',
                  width: 30,
                }}
              >
                {stallNumber}
              </Text>
            );
          })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText style={styles.instructionsText}>
          {selectedStallId 
            ? `Stall ${stalls.find(s => s.id === selectedStallId)?.stall_number} selected. Tap to proceed with booking.`
            : 'Tap on any available (green) stall to select it for booking.'
          }
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  scrollContainer: {
    maxHeight: 500,
    borderWidth: 1,
    borderColor: BrandColors.gray[300],
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  canvas: {
    backgroundColor: '#FAFAFA',
  },
  instructions: {
    padding: 16,
    backgroundColor: BrandColors.purple[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.purple[200],
  },
  instructionsText: {
    fontSize: 14,
    textAlign: 'center',
    color: BrandColors.purple[800],
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});