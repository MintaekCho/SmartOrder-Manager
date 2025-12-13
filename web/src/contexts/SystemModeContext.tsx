/**
 * @deprecated SystemModeContext is deprecated. Use FeatureSettingsContext instead.
 * This file re-exports from FeatureSettingsContext for backward compatibility.
 */

export {
  FeatureSettingsProvider as SystemModeProvider,
  useSystemMode,
  useFeatureSettings,
  type FeatureSettings,
} from './FeatureSettingsContext';

// Legacy type for backward compatibility
export type SystemMode = 'dropshipping' | 'inventory' | 'hybrid' | 'shop' | 'custom';
