import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient gradient overlay */}
      <View style={styles.ambientGradientContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.35)', 'rgba(4, 180, 162, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambientGradient}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.flexSpacer} />

        {/* Logo and Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoGlassBox}>
            <View style={styles.logoBadge}>
              <Ionicons name="shield-checkmark" size={64} color="#D2BBFF" />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>FocusVault</Text>
            <Text style={styles.subtitle}>Built for day 45, not day 1.</Text>
          </View>
        </View>

        <View style={styles.flexSpacer} />

        {/* Bottom Action Area */}
        <View style={styles.actionContainer}>
          <Button
            title="Get Started"
            variant="gradient"
            onPress={handleGetStarted}
            style={styles.startButton}
          />
          <Text style={styles.disclaimerText}>
            By continuing, you accept the disciplined path.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  ambientGradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  flexSpacer: {
    flex: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logoGlassBox: {
    width: 140,
    height: 140,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 19, 19, 0.6)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#E5E2E1',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCC3D8',
    opacity: 0.8,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingBottom: 16,
  },
  startButton: {
    width: '100%',
  },
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(204, 195, 216, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
});
