import React from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { StallCell, Legend } from './StallComponents';
import { Stall } from '@/types';

interface HallLayoutProps {
  hallId: string;
  hallName: string;
  stalls: Stall[];
  onStallSelect: (stall: Stall) => void;
  selectedStallId?: string;
}

export const HallH2Layout: React.FC<HallLayoutProps> = ({
  hallId,
  hallName,
  stalls,
  onStallSelect,
  selectedStallId,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  // Use full width with minimal padding - scrollable so no height restriction
  const availableWidth = screenWidth - 24;

  const COLS = 3;
  const ROWS = 18;

  // Calculate cell size based on width only - allow vertical scroll
  // You can manually adjust this value to make stalls bigger/smaller
  const CELL_SIZE = Math.floor((availableWidth - 20) / COLS); // ~115px per cell
  const cellSize = Math.max(CELL_SIZE, 20); // Minimum 100px per cell

  const totalWidth = cellSize * COLS;
  const totalHeight = cellSize * ROWS;

  const stallsByPosition: { [key: string]: Stall } = {};
  stalls.forEach((stall) => {
    const key = `${stall.position_x},${stall.position_y}`;
    stallsByPosition[key] = stall;
  });

  const getStallAt = (col: number, row: number) => stallsByPosition[`${col},${row}`];

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <View style={[styles.headerLabel, { backgroundColor: '#D4E8D4' }]}>
          <Text style={styles.headerText}>{hallName}</Text>
        </View>

        <View
          style={[
            styles.gridContainer,
            {
              width: totalWidth,
              height: totalHeight,
            },
          ]}
        >
          {Array.from({ length: ROWS }).map((_, rowIndex) => (
            <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', height: cellSize }}>
              {Array.from({ length: COLS }).map((_, colIndex) => {
                // Column 1 is walkway
                if (colIndex === 1) {
                  return (
                    <View
                      key={`walkway-${colIndex}-${rowIndex}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#E8F5E9',
                        borderWidth: 0.5,
                        borderColor: '#C8E6C9',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {rowIndex === ROWS - 1 && (
                        <Text style={{ fontSize: cellSize * 0.4 }}>🚪</Text>
                      )}
                    </View>
                  );
                }

                const stall = getStallAt(colIndex, rowIndex);
                if (stall) {
                  return (
                    <StallCell
                      key={stall.id}
                      stall={stall}
                      size={cellSize}
                      isSelected={stall.id === selectedStallId}
                      onPress={() => onStallSelect(stall)}
                    />
                  );
                }

                return (
                  <View
                    key={`empty-${colIndex}-${rowIndex}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: '#F0F0F0',
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        <Legend />
      </View>
    </ScrollView>
  );
};

export const HallH7Layout: React.FC<HallLayoutProps> = ({
  hallId,
  hallName,
  stalls,
  onStallSelect,
  selectedStallId,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  // H7 has more columns, so calculate based on width
  const availableWidth = screenWidth - 16;

  const COLS = 12;
  const ROWS = 20;

  // You can manually adjust this value to make stalls bigger/smaller
  const CELL_SIZE = Math.floor(availableWidth / COLS);
  const cellSize = Math.max(CELL_SIZE, 35); // Minimum 32px for H7 (more columns)

  const totalWidth = cellSize * COLS;
  const totalHeight = cellSize * ROWS;

  const stallsByPosition: { [key: string]: Stall } = {};
  stalls.forEach((stall) => {
    const key = `${stall.position_x},${stall.position_y}`;
    stallsByPosition[key] = stall;
  });

  const getStallAt = (col: number, row: number) => stallsByPosition[`${col},${row}`];

  const isCourtyard = (col: number, row: number) => {
    // Walkway columns
    if (col === 0 || col === 2 || col === 3 || col === 5 || col === 7 || col === 8 || col === 10 || col === 11) {
      return true;
    }
    // Center stalls only exist in rows 3-16
    if ((col === 4 || col === 6) && (row < 3 || row > 16)) {
      return true;
    }
    return false;
  };

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={[styles.container, { alignItems: 'center' }]}>
          <View style={[styles.headerLabel, { backgroundColor: '#B4E5F0' }]}>
            <Text style={styles.headerText}>{hallName}</Text>
          </View>

          <View
            style={[
              styles.gridContainer,
              {
                width: totalWidth,
                height: totalHeight,
              },
            ]}
          >
            {Array.from({ length: ROWS }).map((_, rowIndex) => {
              let colIndex = 0;
              const cells = [];

              while (colIndex < COLS) {
                const stall = getStallAt(colIndex, rowIndex);

                if (stall) {
                  cells.push(
                    <StallCell
                      key={stall.id}
                      stall={stall}
                      size={cellSize}
                      isSelected={stall.id === selectedStallId}
                      onPress={() => onStallSelect(stall)}
                    />
                  );
                  colIndex += stall.width;
                } else if (isCourtyard(colIndex, rowIndex)) {
                  cells.push(
                    <View
                      key={`courtyard-${colIndex}-${rowIndex}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#D4F1F9',
                        borderWidth: 0.5,
                        borderColor: '#B4E5F0',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {rowIndex === ROWS - 1 && colIndex === 5 && (
                        <Text style={{ fontSize: cellSize * 0.5 }}>🚪</Text>
                      )}
                    </View>
                  );
                  colIndex++;
                } else {
                  cells.push(
                    <View
                      key={`empty-${colIndex}-${rowIndex}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#F0F0F0',
                      }}
                    />
                  );
                  colIndex++;
                }
              }

              return (
                <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', height: cellSize }}>
                  {cells}
                </View>
              );
            })}
          </View>

          <Legend />
        </View>
      </ScrollView>
    </ScrollView>
  );
};

export const HallH3Layout: React.FC<HallLayoutProps> = ({
  hallId,
  hallName,
  stalls,
  onStallSelect,
  selectedStallId,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  // Use full width - scrollable so no height restriction
  const availableWidth = screenWidth - 20;

  const COLS = 7;
  const ROWS = 16;

  // You can manually adjust this value to make stalls bigger/smaller
  const CELL_SIZE = Math.floor((availableWidth - 10) / COLS);
  const cellSize = Math.max(CELL_SIZE, 50); // Minimum 50px per cell

  const totalWidth = cellSize * COLS;
  const totalHeight = cellSize * ROWS;

  const stallsByPosition: { [key: string]: Stall } = {};
  stalls.forEach((stall) => {
    const key = `${stall.position_x},${stall.position_y}`;
    stallsByPosition[key] = stall;
  });

  const getStallAt = (col: number, row: number) => stallsByPosition[`${col},${row}`];

  const isWalkway = (col: number, row: number) => {
    // Column 1 and 5 are walkways
    if (col === 1 || col === 5) return true;
    // Center walkway areas (rows 7-9 and 13-15)
    if (col === 3 && ((row >= 7 && row <= 9) || (row >= 13 && row <= 15))) return true;
    return false;
  };

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <View style={[styles.headerLabel, { backgroundColor: '#F5D0C5' }]}>
          <Text style={styles.headerText}>{hallName}</Text>
        </View>

        <View
          style={[
            styles.gridContainer,
            {
              width: totalWidth,
              height: totalHeight,
            },
          ]}
        >
          {Array.from({ length: ROWS }).map((_, rowIndex) => (
            <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', height: cellSize }}>
              {Array.from({ length: COLS }).map((_, colIndex) => {
                if (isWalkway(colIndex, rowIndex)) {
                  return (
                    <View
                      key={`walkway-${colIndex}-${rowIndex}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#FBE4D8',
                        borderWidth: 0.5,
                        borderColor: '#F5D0C5',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {rowIndex === ROWS - 1 && colIndex === 3 && (
                        <Text style={{ fontSize: cellSize * 0.4 }}>🚪</Text>
                      )}
                    </View>
                  );
                }

                const stall = getStallAt(colIndex, rowIndex);
                if (stall) {
                  return (
                    <StallCell
                      key={stall.id}
                      stall={stall}
                      size={cellSize}
                      isSelected={stall.id === selectedStallId}
                      onPress={() => onStallSelect(stall)}
                    />
                  );
                }

                return (
                  <View
                    key={`empty-${colIndex}-${rowIndex}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: '#F0F0F0',
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        <Legend />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  headerLabel: {
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    borderWidth: 2,
    borderColor: '#999',
    backgroundColor: 'white',
    borderRadius: 8,
  },
});
