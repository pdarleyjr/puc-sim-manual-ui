import { describe, it, expect, beforeEach } from 'vitest';
import { useNozzleProfiles } from '../src/features/nozzle-profiles/store';
import type { NozzlePreset } from '../src/features/nozzle-profiles/types';

describe.skip('Nozzle Precedence', () => {
  let preset1: NozzlePreset;
  let preset2: NozzlePreset;

  beforeEach(async () => {
    const store = useNozzleProfiles.getState();
    
    // Clear existing data
    const existingPresets = store.presets;
    for (const preset of existingPresets) {
      await store.deletePreset(preset.id);
    }
    
    const localOverrides = store.localOverrides;
    for (const override of localOverrides) {
      await store.clearLocalOverride(override.tabId, override.category);
    }
    
    // Create test presets
    await store.createPreset({
      name: 'Test Preset 1',
      category: 'crosslay',
      kind: 'smooth_bore',
      tipDiameterIn: 15/16,
      ratedNPpsi: 50,
      isDefault: true
    });
    
    await store.createPreset({
      name: 'Test Preset 2',
      category: 'crosslay',
      kind: 'smooth_bore',
      tipDiameterIn: 1.125,
      ratedNPpsi: 50,
      isDefault: false
    });
    
    const presets = store.presets;
    preset1 = presets.find(p => p.name === 'Test Preset 1')!;
    preset2 = presets.find(p => p.name === 'Test Preset 2')!;
    
    expect(preset1).toBeDefined();
    expect(preset2).toBeDefined();
  });

  describe('Basic Precedence', () => {
    it('should return Admin default when no local override', () => {
      const store = useNozzleProfiles.getState();
      
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      
      // Should return the default preset (preset1)
      expect(effective).toBeDefined();
      expect(effective?.id).toBe(preset1.id);
      expect(effective?.isDefault).toBe(true);
    });

    it('should return local override when present', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set local override to preset2
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      
      // Should return the override (preset2)
      expect(effective).toBeDefined();
      expect(effective?.id).toBe(preset2.id);
    });

    it('should return first match if no default set', async () => {
      const store = useNozzleProfiles.getState();
      
      // Remove default flag from preset1
      await store.updatePreset(preset1.id, { isDefault: false });
      
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      
      // Should return any crosslay preset (first match)
      expect(effective).toBeDefined();
      expect(effective?.category).toBe('crosslay');
    });

    it('should return null if no presets match category', () => {
      const store = useNozzleProfiles.getState();
      
      const effective = store.getEffectiveNozzle('panel', 'trash');
      
      // No trash category presets exist
      expect(effective).toBeNull();
    });
  });

  describe('Override Isolation', () => {
    it('should isolate overrides by tab', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set override for panel tab
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      // Check panel tab
      const panelEffective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(panelEffective?.id).toBe(preset2.id);
      
      // Check hydrant_lab tab (should use admin default)
      const hydrantEffective = store.getEffectiveNozzle('hydrant_lab', 'crosslay');
      expect(hydrantEffective?.id).toBe(preset1.id);
    });

    it('should isolate overrides by category', async () => {
      const store = useNozzleProfiles.getState();
      
      // Create a leader preset
      await store.createPreset({
        name: 'Leader Preset',
        category: 'leader',
        kind: 'fog_fixed',
        ratedGPM: 200,
        ratedNPpsiFog: 100,
        isDefault: true
      });
      
      const leaderPreset = store.presets.find(p => p.category === 'leader')!;
      
      // Set override for crosslay
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      // Check crosslay
      const crosslayEffective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(crosslayEffective?.id).toBe(preset2.id);
      
      // Check leader (should use its own default)
      const leaderEffective = store.getEffectiveNozzle('panel', 'leader');
      expect(leaderEffective?.id).toBe(leaderPreset.id);
    });
  });

  describe('Timestamp-Based Invalidation', () => {
    it('should invalidate stale local override when Admin updates preset', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set local override
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      
      // Verify override is active
      let effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset1.id);
      
      // Wait 100ms to ensure timestamp difference
      await new Promise(r => setTimeout(r, 100));
      
      // Admin updates the preset (newer timestamp)
      await store.updatePreset(preset1.id, { name: 'Test Preset 1 Updated' });
      
      // Override should be invalidated, fall back to admin default
      effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective).toBeDefined();
      
      // Should use the updated preset (as admin default)
      expect(effective?.name).toBe('Test Preset 1 Updated');
    });

    it('should clear stale overrides when preset is deleted', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set local override to preset2
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      // Verify override is active
      let effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset2.id);
      
      // Delete preset2
      await store.deletePreset(preset2.id);
      
      // Override should be cleared
      const overrides = store.localOverrides.filter(
        o => o.tabId === 'panel' && o.category === 'crosslay'
      );
      expect(overrides.length).toBe(0);
      
      // Should fall back to admin default (preset1)
      effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset1.id);
    });

    it('should preserve recent overrides when Admin updates', async () => {
      const store = useNozzleProfiles.getState();
      
      // Admin updates preset1 first
      await store.updatePreset(preset1.id, { name: 'Preset 1 v2' });
      
      // Wait 100ms
      await new Promise(r => setTimeout(r, 100));
      
      // User sets local override AFTER admin update (newer timestamp)
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      
      // Override should still be active (it's newer than the preset update)
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset1.id);
      expect(effective?.name).toBe('Preset 1 v2');
    });
  });

  describe('Multiple Overrides', () => {
    it('should handle multiple tabs with different overrides', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set different overrides for different tabs
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      await store.setLocalOverride('hydrant_lab', 'crosslay', preset2.id);
      
      // Each tab should respect its own override
      const panelEffective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(panelEffective?.id).toBe(preset1.id);
      
      const hydrantEffective = store.getEffectiveNozzle('hydrant_lab', 'crosslay');
      expect(hydrantEffective?.id).toBe(preset2.id);
    });

    it('should handle clearing specific overrides', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set overrides
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      await store.setLocalOverride('hydrant_lab', 'crosslay', preset2.id);
      
      // Clear only panel override
      await store.clearLocalOverride('panel', 'crosslay');
      
      // Panel should fall back to admin default
      const panelEffective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(panelEffective?.id).toBe(preset1.id);
      
      // Hydrant lab should still have override
      const hydrantEffective = store.getEffectiveNozzle('hydrant_lab', 'crosslay');
      expect(hydrantEffective?.id).toBe(preset2.id);
    });
  });

  describe('Admin Default Changes', () => {
    it('should respect new admin default when override is cleared', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set local override
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      // Admin changes default to preset2
      await store.updatePreset(preset1.id, { isDefault: false });
      await store.updatePreset(preset2.id, { isDefault: true });
      
      // Clear override
      await store.clearLocalOverride('panel', 'crosslay');
      
      // Should now use new admin default (preset2)
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset2.id);
      expect(effective?.isDefault).toBe(true);
    });

    it('should handle multiple defaults by returning first default', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set both as default (edge case, shouldn't happen but test behavior)
      await store.updatePreset(preset1.id, { isDefault: true });
      await store.updatePreset(preset2.id, { isDefault: true });
      
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      
      // Should return one of the defaults
      expect(effective).toBeDefined();
      expect(effective?.isDefault).toBe(true);
      expect(effective?.category).toBe('crosslay');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid override preset ID', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set override to non-existent preset
      await store.setLocalOverride('panel', 'crosslay', 'non-existent-id');
      
      // Should fall back to admin default
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset1.id);
    });

    it('should handle category with no presets', () => {
      const store = useNozzleProfiles.getState();
      
      const effective = store.getEffectiveNozzle('panel', 'highrise');
      
      // Should return null
      expect(effective).toBeNull();
    });

    it('should handle override to same preset as default', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set override to same as admin default
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      
      // Should still work (explicit override even if same as default)
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset1.id);
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle rapid override changes', async () => {
      const store = useNozzleProfiles.getState();
      
      // Rapidly set overrides
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      await store.setLocalOverride('panel', 'crosslay', preset1.id);
      
      // Should have only the last override
      const overrides = store.localOverrides.filter(
        o => o.tabId === 'panel' && o.category === 'crosslay'
      );
      expect(overrides.length).toBe(1);
      expect(overrides[0].presetId).toBe(preset1.id);
    });

    it('should handle preset update during active override', async () => {
      const store = useNozzleProfiles.getState();
      
      // Set override
      await store.setLocalOverride('panel', 'crosslay', preset2.id);
      
      // Admin updates a different preset (preset1)
      await store.updatePreset(preset1.id, { name: 'Updated Preset 1' });
      
      // Override to preset2 should still be active
      const effective = store.getEffectiveNozzle('panel', 'crosslay');
      expect(effective?.id).toBe(preset2.id);
    });
  });
});