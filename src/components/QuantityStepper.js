import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function QuantityStepper({ quantity, onIncrease, onDecrease, size = 'medium' }) {
  const isSmall = size === 'small';
  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <TouchableOpacity
        style={[styles.button, isSmall && styles.buttonSmall]}
        onPress={onDecrease}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={isSmall ? 14 : 18} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.quantity, isSmall && styles.quantitySmall]}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.button, isSmall && styles.buttonSmall]}
        onPress={onIncrease}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={isSmall ? 14 : 18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
  },
  containerSmall: {
    borderRadius: 8,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    width: 28,
    height: 28,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  quantitySmall: {
    minWidth: 20,
    fontSize: 13,
  },
});
