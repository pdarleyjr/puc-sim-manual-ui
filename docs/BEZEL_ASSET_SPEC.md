# Bezel Asset Specification

## Overview

This document defines the **non-negotiable geometry requirements** for gauge bezel PNG artwork used in the fire pump simulator. Following these specifications ensures perfect alignment between PNG bezel artwork and SVG needle overlays.

---

## Hard Geometry Requirements

### Canvas Specifications
- **Size:** `2000 × 2000 px` (square)
- **Background:** Fully transparent (alpha = 0)
- **Color Space:** sRGB
- **DPI:** 300
- **Format:** PNG with alpha channel (24-bit RGB + 8-bit alpha)

### Dial Hole (Transparent Circle)
- **Center Position:** Exactly `(1000, 1000)` px
- **Radius:** `600 px` (diameter `1200 px`)
- **Alpha:** 0 (fully transparent)
- **Purpose:** This transparent hole is where the SVG needle will be visible

### SVG Coordinate Mapping
When used in the application with `viewBox="0 0 200 200"`:
- **Canvas → SVG scale:** `200 SVG units / 2000 px = 0.1` (or `10 px = 1 SVG unit`)
- **Dial radius in SVG:** `60 units` (600 px ÷ 10)
- **Center in SVG:** `(100, 100)` units

### Needle Keep-Back Margin
- **Margin:** 20 px (2 SVG units)
- **Needle length:** Will be set to `r - margin = 58 SVG units` in code
- **Purpose:** Ensures needle tip stays safely inside dial hole edge

### Alpha Channel Requirements
- **Inside dial hole:** Alpha = 0 (fully transparent)
- **Outside bezel silhouette:** Alpha = 0 (transparent background)
- **Bezel plate area:** Alpha = 255 (fully opaque)

---

## Visual Design Specifications

### Materials
- **Primary:** Brushed stainless steel plate
  - Subtle anisotropic grain texture
  - Physically-based reflections (PBR/HDRI lighting)
- **Inner Ring:** Polished chrome
  - Soft beveled chamfer around dial hole
  - Realistic specular highlights

### Hardware
- **Mounting:** Four Torx screws (T20 style)
- **Positions:** At corners or cardinal positions
- **Detail:** Recessed with realistic shadows
- **Alignment:** Consistent orientation

### Edge Details
- **Corner Radius:** 20–40 px rounded corners
- **Ambient Occlusion:** Delicate shadows at:
  - Inner dial hole edge
  - Screw recesses
  - Plate edges

### Depth & Shadow
- **Inner Shadow:** 8–12 px Gaussian blur around dial hole
- **Purpose:** Creates depth perception, lifts inner ring
- **Micro Details:** Very subtle scratches and wear (minimal)

### Color & Neutrality
- **Palette:** Silver/gray tones only
- **Restriction:** No color cast or tinting
- **Balance:** Neutral, professional appearance

### Prohibited Elements
- ❌ No tick marks
- ❌ No numbers or labels  
- ❌ No needle (handled by SVG overlay)
- ❌ No embedded text or branding

---

## Quality Standards

### Rendering Quality
- **Level:** Hyper-realistic, product-shot quality
- **HDR:** High dynamic range reflections
- **Lighting:** Soft 3-point studio setup
  - Top-left key light (primary)
  - Gentle fill light (ambient)
  - Subtle rim highlight on inner ring

### Technical Quality
- **Compression:** No artifacts on edges
- **Precision:** Center and radius must be exact
- **Clarity:** Crisp edges, no blur (except intentional shadows)
- **Color Profile:** No embedded profile shifts

---

## Image Generation Prompt

Use this prompt with AI image generators (GPT-5, Midjourney, DALL-E, etc.):

```
Create an ultra-realistic, PBR-quality fire-pump gauge bezel as a TRANSPARENT PNG.

HARD GEOMETRY (do not deviate):
- Canvas: 2000 × 2000 px, 300 DPI, sRGB.
- Background: fully transparent.
- Center of bezel: exactly (1000, 1000) px.
- Transparent dial hole: perfect circle, radius = 600 px (diameter 1200 px), alpha=0.
- Opaque bezel area surrounds the hole; outside bezel silhouette alpha=0.

VISUAL DESIGN:
- Material: brushed stainless steel plate with subtle anisotropic grain.
- Inner polished chrome ring around the dial hole with a soft beveled chamfer, realistic specular reflections.
- Four Torx screws (T20 style) at the corners; aligned consistently; recessed with realistic shadows.
- Plate corners rounded (radius ~30 px). Delicate ambient occlusion around the inner hole and screws.
- Soft inner shadow around the hole (8–12 px blur) for depth; micro-scratches and minute wear (very subtle).
- No tick marks, numbers, labels, or needle; bezel only.
- Neutral color balance (silver/gray), no color cast.

DELIVERABLE:
- One PNG file with alpha (24-bit RGB + 8-bit alpha).
- The dial hole and outside background must be fully transparent.
- No compression artifacts; crisp edges.

QUALITY:
- Hyper-realistic, life-like, high dynamic range reflections; cinematic product-shot quality.
- Lighting: soft 3-point studio lighting; mild top-left key light, gentle fill, subtle rim highlight on inner ring.
```

---

## Variant Bezels (Optional)

While maintaining **identical geometry**, additional bezel variants may be created:

### Color Variants
- **Black Anodized:** Matte black finish, same geometry
- **Red Powder-Coat:** High-visibility training/emergency
- **Yellow Training:** Bright yellow for training scenarios
- **Custom Themes:** Other colors while preserving dimensions

### Critical Rule
All variants MUST maintain:
- Same canvas size (2000 × 2000 px)
- Same center point (1000, 1000)
- Same dial hole radius (600 px)
- Full alpha transparency in dial hole and background

---

## Code Integration

### File Location
Place generated PNG files in:
```
public/assets/bezel_[name]_v1.png
```

Examples:
- `public/assets/bezel_crosslay_v1.png` (default stainless)
- `public/assets/bezel_crosslay_black_v1.png` (black anodized)
- `public/assets/bezel_training_yellow_v1.png` (training)

### Component Usage

```tsx
<LineAnalogGauge
  label="PSI"
  psi={discharge.displayPsi}
  bezelSrc={`${import.meta.env.BASE_URL}assets/bezel_crosslay_v1.png`}
  cal={{ 
    cx: 100,   // SVG center X
    cy: 100,   // SVG center Y  
    r: 60,     // Dial radius (maps to 600px)
    margin: 2, // Needle stops 2 units short
    debug: false // Set true to show calibration ring
  }}
/>
```

### Debug Mode

To verify alignment:
1. Set `cal.debug` to `true`
2. A magenta dashed circle will overlay at radius `r`
3. This circle should **perfectly coincide** with the transparent dial edge
4. If misaligned, adjust `r` value slightly

---

## Visual QA Checklist

Before deploying new bezel artwork:

- [ ] Load bezel PNG in browser
- [ ] Enable `debug: true` in component
- [ ] Verify magenta debug circle aligns exactly with dial hole edge
- [ ] Test needle at 0%, 50%, 100% positions
- [ ] Confirm needle tip stays ~2 units inside dial edge
- [ ] Resize container (`w-40`, `w-44`, `w-48`) - alignment must remain perfect
- [ ] Check in different browsers (Chrome, Firefox, Safari)
- [ ] Verify no visual artifacts or compression issues

---

## Maintenance Notes

### When to Update This Spec
- Changing SVG coordinate system (viewBox dimensions)
- Modifying needle length calculations
- Adding new bezel size variants
- Updating rendering quality standards

### Version History
- **v1.0** (2025-10-20): Initial specification
  - 2000×2000 px canvas
  - 600 px radius dial hole
  - SVG coordinate mapping at 60 units

---

## Future Improvements

### Optional Enhancements
1. **Tick Marks in SVG:** Add tick marks as SVG elements at `r - 4` to guarantee alignment
2. **Auto-Measurement:** Canvas-based radius detection from PNG alpha channel
3. **Bezel Registry:** JSON config file mapping bezel files to calibration values

```json
// public/assets/gauge_cal.json
{
  "bezel_crosslay_v1.png": {
    "cx": 100,
    "cy": 100,
    "r": 60,
    "margin": 2
  }
}
```

4. **Multiple Sizes:** Support for different gauge sizes (small, medium, large) with proportional geometry

---

## Support

For questions or issues with bezel artwork:
1. Verify geometry with debug mode first
2. Check PNG dimensions and alpha channel in image editor
3. Confirm center point and radius measurements
4. Test with fallback SVG circle (when PNG fails to load)

**Contact:** See project repository for maintainer information