import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Enhanced icon mapping with all needed icons
const iconMap: { [key: string]: string } = {
  // Navigation
  'arrow-back': '←',
  'arrow-forward': '→',
  'chevron-forward': '›',
  'chevron-down': '⌄',
  'chevron-up': '⌃',
  'close': '×',
  
  // Actions
  'checkmark': '✓',
  'checkmark-circle': '✓',
  'checkmark-done': '✓',
  'add': '+',
  'add-circle': '+',
  'add-circle-outline': '+',
  'remove': '−',
  'remove-circle-outline': '−',
  'create': '✏',
  'create-outline': '✏',
  'edit': '✏',
  'trash': '🗑',
  'delete': '🗑',
  
  // Search & Filter
  'search': '🔍',
  'filter': '⚙',
  'filter-outline': '⚙',
  'funnel': '⚙',
  'options': '⋯',
  
  // Location
  'location': '📍',
  'location-outline': '📍',
  'map': '🗺',
  'compass': '🧭',
  'navigate': '🧭',
  
  // Communication
  'call': '📞',
  'call-outline': '📞',
  'phone': '📞',
  'mail': '✉',
  'mail-outline': '✉',
  'chatbubble': '💬',
  'chatbubble-outline': '💬',
  'message': '💬',
  
  // User & Profile
  'person': '👤',
  'person-outline': '👤',
  'people': '👥',
  'people-outline': '👥',
  'person-add': '👤+',
  'person-add-outline': '👤+',
  
  // Home & Navigation
  'home': '🏠',
  'home-outline': '🏠',
  'business': '🏢',
  'building': '🏢',
  
  // Settings
  'settings': '⚙',
  'settings-outline': '⚙',
  'cog': '⚙',
  'menu': '☰',
  
  // Time & Calendar
  'time': '⏰',
  'time-outline': '⏰',
  'clock': '⏰',
  'calendar': '📅',
  'calendar-outline': '📅',
  
  // Media
  'camera': '📷',
  'image': '🖼',
  'images': '🖼',
  'video': '📹',
  'mic': '🎙',
  'mic-outline': '🎙',
  'voice': '🎤',
  'volume': '🔊',
  'volume-high': '🔊',
  'volume-low': '🔉',
  'volume-off': '🔇',
  
  // Documents
  'document': '📄',
  'document-outline': '📄',
  'documents': '📚',
  'folder': '📁',
  'folder-outline': '📁',
  
  // Actions & Status
  'save': '💾',
  'share': '📤',
  'download': '⬇',
  'upload': '⬆',
  'refresh': '🔄',
  'sync': '🔄',
  
  // Technology
  'wifi': '📶',
  'bluetooth': '🔵',
  'battery': '🔋',
  'flash': '⚡',
  'flashlight': '🔦',
  
  // Security
  'lock': '🔒',
  'lock-closed': '🔒',
  'lock-open': '🔓',
  'unlock': '🔓',
  'key': '🔑',
  'shield': '🛡',
  'shield-checkmark': '🛡✓',
  'shield-outline': '🛡',
  
  // Status & Feedback
  'warning': '⚠',
  'alert': '⚠',
  'info': 'ℹ',
  'information': 'ℹ',
  'error': '❌',
  'close-circle': '❌',
  'success': '✅',
  'question': '❓',
  'help': '❓',
  'help-circle': '❓',
  'help-circle-outline': '❓',
  'exclamation': '❗',
  
  // Rating & Favorites
  'star': '★',
  'star-outline': '☆',
  'star-half': '⯪',
  'heart': '❤',
  'heart-outline': '♡',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  
  // Work & Jobs
  'briefcase': '💼',
  'briefcase-outline': '💼',
  'business-outline': '🏢',
  'hammer': '🔨',
  'build': '🔨',
  'wrench': '🔧',
  'tools': '🛠',
  'construct': '🛠',
  'construction': '🏗',
  
  // Skills & Categories
  'brush': '🎨',
  'color-palette': '🎨',
  'sparkles': '✨',
  'car': '🚗',
  'car-outline': '🚗',
  'restaurant': '🍽',
  'medical': '⚕',
  'school': '🎓',
  'library': '📚',
  'fitness': '💪',
  'water': '💧',
  'leaf': '🍃',
  
  // Money & Business
  'cash': '💵',
  'card': '💳',
  'wallet': '👛',
  'wallet-outline': '👛',
  'trending-up': '📈',
  'trending-down': '📉',
  'analytics': '📊',
  'bar-chart': '📊',
  'pie-chart': '📊',
  'money': '💰',
  
  // Transport & Delivery
  'airplane': '✈',
  'train': '🚆',
  'bus': '🚌',
  'bicycle': '🚲',
  'walk': '🚶',
  'boat': '🛥',
  'rocket': '🚀',
  
  // Notifications
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'notifications-off': '🔕',
  'alert-circle': '⚠',
  'alert-circle-outline': '⚠',
  
  // Media Controls
  'play': '▶',
  'pause': '⏸',
  'stop': '⏹',
  'record': '⏺',
  'fast-forward': '⏩',
  'rewind': '⏪',
  'skip-forward': '⏭',
  'skip-back': '⏮',
  'repeat': '🔁',
  'shuffle': '🔀',
  
  // Network & Globe
  'globe': '🌐',
  'globe-outline': '🌐',
  'wifi-outline': '📶',
  'cellular': '📶',
  'radio': '📻',
  'language': '🌐',
  'language-outline': '🌐',
  
  // Eye
  'eye': '👁',
  'eye-outline': '👁',
  'eye-off': '👁‍🗨',
  'eye-off-outline': '👁‍🗨',
  
  // Additional needed icons
  'bulb-outline': '💡',
  'pause-outline': '⏸',
  'ellipsis-horizontal': '...',
  'ellipsis-vertical': '⋮',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const iconChar = iconMap[name] || '?';
  
  return (
    <Text style={[
      styles.icon,
      { fontSize: size, color },
      style
    ]}>
      {iconChar}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default Icon;