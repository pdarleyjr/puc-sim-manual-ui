# Mobile UI Guide

**Last Updated:** 2025-11-03  
**Version:** Phase 5 Complete  
**Feature Flag:** `VITE_MOBILE_APP_UI`

## Quick Start

Enable mobile UI with `.env` file:
```env
VITE_MOBILE_APP_UI=true
```

Or query parameter: `?flag:mobile_app_ui=1&m=1`

Mobile UI activates when viewport ≤1024px or `?m=1` param.

## Core Components

### SA-HUD ([`SAHud.tsx`](../src/mobile/SAHud.tsx:54))
- Persistent header with critical metrics
- Collapsible: 72px → 48px on scroll  
- Metrics: Tank %, Foam %, Intake PSI/GPM, Discharge PSI
- Color-coded warnings
- Governor bump controls (±5 PSI)

### Bottom Nav ([`BottomNav.tsx`](../src/mobile/BottomNav.tsx))
- 48px touch targets (WCAG AA)
- Panel, Hydrant Lab, Scenarios links
- Fixed bottom position

### Quick-Toggles Sheet ([`QuickTogglesSheet.tsx`](../src/mobile/QuickTogglesSheet.tsx:50))
- Slide-up: 56px → 60vh
- Context-sensitive tiles
- Keyboard avoidance
- Drag handle UX

## Tile System

**Hydrant Tiles** ([`HydrantTiles.tsx`](../src/mobile/tiles/HydrantTiles.tsx)):
- HAV Control (off/bypass/boost)
- Gate Controls (Side A/B, Steamer, Open/Close All)
- Static Pressure Presets (40, 60, 80, 100 PSI)
- Supply Config (Single, Double, Triple tap)

**Panel Tiles** ([`PanelTiles.tsx`](../src/mobile/tiles/PanelTiles.tsx)):
- Discharge Gate Controls
- Governor Presets
- Master Discharge Control
- Tank/Foam Status

## Features

### Collapsible Header
Hook: [`useCollapseHeader.ts`](../src/mobile/hooks/useCollapseHeader.ts:1)
- Monitors 'mobile-main' scroll
- Triggers at 50px
- 200ms transition

### Keyboard Handling
- [`useKeyboard.ts`](../src/mobile/hooks/useKeyboard.ts) - Visual Viewport API
- [`useKeyboardOpen.ts`](../src/mobile/hooks/useKeyboardOpen.ts) - Detection
- Sheet lowers to -20vh when keyboard opens

### Responsive
- Viewport: 375px - 1024px
- Tailwind CSS utilities
- Touch targets ≥48px
- Dark theme (#0f141a)

## Accessibility (WCAG 2.1 AA)

✅ Touch targets ≥48px  
✅ Color contrast ≥4.5:1  
✅ ARIA labels  
✅ Semantic HTML5  
✅ Keyboard navigation  
✅ Focus management

### Color Warnings
- **Green**: Normal (≥20 PSI)
- **Amber**: Caution (10-20 PSI)
- **Red**: Critical (<10 PSI)

## Adding Features

Create new tile:
```typescript
export function MyNewTile() {
  const value = useHydrantLab(state => state.myValue)
  const setValue = useHydrantLab(state => state.setMyValue)
  
  return <ToggleTile title="Feature" sub={`${value}`} onClick={() => setValue(value + 1)} />
}
```

Register in [`HydrantTiles.tsx`](../src/mobile/tiles/HydrantTiles.tsx) or [`PanelTiles.tsx`](../src/mobile/tiles/PanelTiles.tsx).

## Testing

Enable mobile mode:
```bash
npm run dev
# Visit: http://localhost:5173/?flag:mobile_app_ui=1&m=1
```

DevTools: F12 → Toggle device toolbar (Ctrl+Shift+M) → Select iPhone/iPad

### Test Checklist
- [ ] SA-HUD metrics display
- [ ] SA-HUD collapses on scroll
- [ ] Bottom Nav navigation
- [ ] Quick-Toggles slide up/down
- [ ] Keyboard lowers sheet
- [ ] Tiles functional
- [ ] Touch targets ≥48px
- [ ] Color contrast WCAG AA

## Design Tokens

### Colors
```css
--bg-primary: #0f141a
--border: #232b35
--text-primary: #f1f5f9
--accent: #38bdf8
--success: #4ade80
--warning: #fbbf24
--error: #f87171
```

### Typography
```css
--font-mono: Monaco, Courier New
--text-xs: 0.75rem
--text-sm: 0.875rem
```

### Spacing
```css
--touch-target: 48px
--gap-sm: 0.5rem
--gap-md: 0.75rem
```

## Performance

- Zustand selective subscription
- React.memo for tiles
- Debounced scroll handlers
- CSS transforms (GPU-accelerated)

Bundle:
- Mobile shell: ~15KB gzipped
- Tiles: ~8KB gzipped
- Hooks: ~3KB gzipped

## Troubleshooting

**Mobile UI not activating:**
1. Check `VITE_MOBILE_APP_UI=true`
2. Viewport ≤1024px or `?m=1`
3. Clear cache, restart server

**Tiles not showing:**
1. Registration in [`registerMobileToggles.ts`](../src/mobile/registerMobileToggles.ts)
2. Called `initMobileToggles()` in [`main.tsx`](../src/main.tsx)
3. Correct route mapping

**Keyboard not detected:**
1. Virtual keyboard in DevTools
2. Input has focus
3. Visual Viewport API support (Safari iOS)

## References

### Documentation
- [`assumptions.md`](hydraulics/assumptions.md)
- [`CALC_ENGINE_V2_INTEGRATION.md`](CALC_ENGINE_V2_INTEGRATION.md)

### Code
- [`src/mobile/`](../src/mobile/) - Shell
- [`src/mobile/tiles/`](../src/mobile/tiles/) - Tiles
- [`src/mobile/hooks/`](../src/mobile/hooks/) - Hooks

### Standards
- W3C Mobile Web Best Practices
- Apple Human Interface Guidelines
- Material Design (touch targets)
- WCAG 2.1 Level AA

---

**Version:** 1.0  
**Maintained By:** Fire Pump Simulator Team  
**Feedback:** GitHub Issues