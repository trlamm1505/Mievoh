import React from 'react';
import { Stack } from 'expo-router';

export default function CinemaBookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
