import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radii, shadows, brand } from '@/src/theme/tokens';
import { fontFamily } from '@/src/components/navigation/typography';
import { useJourneyProgress } from './useJourneyProgress';
import { useIslamicDate } from '@/src/lib/prayer/use-islamic-date';
import { useLocation } from '@/src/lib/location';
import { ShareCard } from '@/src/components/cards/ShareCard';

// Analytics
import { track } from '@/src/lib/analytics/track';
import { EventName } from '@/src/lib/analytics/schema';

// Constants
const RAMADAN_YEAR = 1447; // Ramadan 2026
const DAYS_IN_RAMADAN = 30;

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { completedDays, toggleDay, streak } = useJourneyProgress();
  
  const { location } = useLocation();
  const coords = location?.coords;
  const { date: islamicDate, isLoading: isDateLoading } = useIslamicDate(coords?.latitude, coords?.longitude);

  const currentRamadanDay = useMemo(() => {
    if (!islamicDate) return null;
    const isRamadan = islamicDate.hijriMonth.includes('Ramadan'); 
    if (isRamadan && islamicDate.hijriYear === RAMADAN_YEAR) {
        return islamicDate.hijriDay;
    }
    return null;
  }, [islamicDate]);

  // Track milestones
  useEffect(() => {
      // Current streak check
      if ([3, 7, 14, 30].includes(streak)) {
          track(
              EventName.JOURNEY_STREAK_MILESTONE, 
              {
                  streak_days: streak,
                  milestone_type: String(streak) as '3' | '7' | '14' | '30',
              },
              'Journey'
          );
      }
  }, [streak]);

  const handleDayPress = (dayIndex: number) => {
    const wasCompleted = completedDays[dayIndex];
    toggleDay(dayIndex);
    
    // Track completion (only when marking complete)
    if (!wasCompleted) {
        track(
            EventName.JOURNEY_DAY_COMPLETED, 
            {
                day_number: dayIndex + 1,
                ramadan_year: RAMADAN_YEAR,
                action_type: 'reflection', 
            },
            'Journey'
        );
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let i = 1; i <= DAYS_IN_RAMADAN; i++) {
        const isCompleted = completedDays[i-1];
        const isCurrent = currentRamadanDay === i;
        
        cells.push(
            <Pressable 
                key={i} 
                style={[
                    styles.dayCell, 
                    isCompleted && styles.dayCellCompleted,
                    isCurrent && styles.dayCellCurrent
                ]}
                onPress={() => handleDayPress(i-1)}
            >
                <Text style={[
                    styles.dayNumber, 
                    isCompleted && styles.dayNumberCompleted,
                    isCurrent && styles.dayNumberCurrent
                ]}>
                    {i}
                </Text>
                {isCompleted && (
                    <View style={styles.checkMark} />
                )}
            </Pressable>
        );
    }
    return cells;
  };

  const isRamadanComplete = completedDays[29];

  return (
    <ScrollView 
        contentContainerStyle={[
            styles.container, 
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Ramadan Journey</Text>
        <Text style={styles.subtitle}>{isDateLoading ? 'Loading...' : `${streak} Days of Nur`}</Text>
      </View>

      <View style={styles.gridContainer}>
        {renderGrid()}
      </View>

      {isRamadanComplete && (
          <View style={styles.shareSection}>
            <Text style={styles.shareTitle}>Ramadan Completed!</Text>
            <View style={styles.shareCardContainer}>
                 <ShareCard 
                    imageSource={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' }}
                    headline="30 Days of Nur"
                    body={`I completed the full Ramadan journey with Path of Nur.`}
                    footerLabel="pathofnur.com"
                 />
            </View>
          </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.accentDisplay,
    fontSize: 32,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  dayCell: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellCompleted: {
    backgroundColor: brand.metallicGold, 
    borderColor: brand.metallicGold,
  },
  dayCellCurrent: {
    borderColor: brand.metallicGold,
    borderWidth: 2,
  },
  dayNumber: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    color: colors.text.primary,
  },
  dayNumberCompleted: {
    color: colors.text.onAccent,
  },
  dayNumberCurrent: {
    color: brand.metallicGold,
  },
  checkMark: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.onAccent,
  },
  shareSection: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  shareTitle: {
      fontFamily: fontFamily.appSemiBold,
      fontSize: 20,
      color: colors.text.primary,
      textAlign: 'center',
  },
  shareCardContainer: {
      alignSelf: 'center',
      width: '80%',
  }
});
