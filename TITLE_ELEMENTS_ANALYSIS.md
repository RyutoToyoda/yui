# Main Page Title Elements Analysis

## Summary
Compiled analysis of h1, h2, h3 main section titles across Yui app pages (excluding admin and detail pages).

---

## 1. Schedule Page
**File:** [src/app/schedule/page.tsx](src/app/schedule/page.tsx)

### H1 - "予定" (Schedule)
- **Line:** [321](src/app/schedule/page.tsx#L321)
- **HTML:**
  ```jsx
  <h1 className="text-xl font-bold text-yui-green-800 flex items-center gap-2 mb-2">
    <CalendarDays className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
    予定
  </h1>
  ```
- **Icon:** CalendarDays (lucide-react)
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Gap: `gap-2`
  - Margin: `mb-2`
  - Layout: flex with items-center

### H2 - "お知らせ" (Important Notifications Section)
- **Line:** [344](src/app/schedule/page.tsx#L344)
- **HTML:**
  ```jsx
  <h2 id="important-notice" className="text-xl font-bold text-yui-green-800 flex items-center gap-2">
    <BellRing className="w-6 h-6 text-yui-accent" aria-hidden="true" />
    お知らせ
  </h2>
  ```
- **Icon:** BellRing (lucide-react)
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-accent`
  - Gap: `gap-2`
  - Layout: flex with items-center
  - ID: `important-notice` (aria-labelledby target)

---

## 2. Notifications Page
**File:** [src/app/notifications/page.tsx](src/app/notifications/page.tsx)

### H1 - "お知らせ" (Notifications)
- **Line:** [48](src/app/notifications/page.tsx#L48)
- **HTML:**
  ```jsx
  <h1 className="text-xl font-bold text-yui-green-800">お知らせ</h1>
  ```
- **Icon:** None in h1 itself (Bell icon used in separate buttons below)
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Contained in flex container with justify-between for layout with buttons

---

## 3. Explore Page (Find Jobs)
**File:** [src/app/explore/page.tsx](src/app/explore/page.tsx)

### H1 - "お手伝い募集を探す" (Find Work Opportunities)
- **Line:** [276](src/app/explore/page.tsx#L276)
- **HTML:**
  ```jsx
  <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800">お手伝い募集を探す</h1>
  ```
- **Icon:** None
- **Styling:**
  - Font size: `text-2xl` (1.5rem) on mobile, `md:text-3xl` (1.875rem) on tablet+
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Responsive sizing for prominence

---

## 4. Create Page (Post a Job)
**File:** [src/app/create/page.tsx](src/app/create/page.tsx)

### H1 - "募集する" (Post a Job)
- **Line:** [227](src/app/create/page.tsx#L227)
- **HTML:**
  ```jsx
  <h1 className="text-2xl md:text-3xl font-bold text-yui-green-800 flex items-center gap-2 mb-6">
    <Megaphone className="w-7 h-7 text-yui-green-600" aria-hidden="true" />
    募集する
  </h1>
  ```
- **Icon:** Megaphone (lucide-react)
- **Styling:**
  - Font size: `text-2xl` (1.5rem) on mobile, `md:text-3xl` (1.875rem) on tablet+
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Icon size: `w-7 h-7`
  - Gap: `gap-2`
  - Margin bottom: `mb-6`
  - Layout: flex with items-center
  - Responsive sizing

### H2 - "募集を作成しました" (Success Message)
- **Line:** [196](src/app/create/page.tsx#L196)
- **HTML:**
  ```jsx
  <h2 className="text-2xl font-bold text-yui-green-800 mb-2">募集を作成しました</h2>
  ```
- **Icon:** None (CheckCircle2 icon used separately above)
- **Styling:**
  - Font size: `text-2xl` (1.5rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Margin bottom: `mb-2`
  - Context: Success page (after form submission)

---

## 5. Profile Page
**File:** [src/app/profile/page.tsx](src/app/profile/page.tsx)

### H1 - "マイページ" (My Profile)
- **Line:** [170](src/app/profile/page.tsx#L170)
- **HTML:**
  ```jsx
  <h1 className="text-xl font-bold text-yui-green-800">マイページ</h1>
  ```
- **Icon:** None in h1 itself
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Contained in flex container with justify-between for Settings link

### H2 - User Name (Dynamic)
- **Line:** [212](src/app/profile/page.tsx#L212)
- **HTML:**
  ```jsx
  <h2 className="text-xl font-bold">{user.name}</h2>
  ```
- **Icon:** None
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `white` (on gradient background)
  - Background: `bg-gradient-to-r from-yui-green-600 to-yui-green-700`
  - Context: Profile card header section
  - Content: User's name (dynamic)

### H3 - "もっている農機具" (Equipment Owned)
- **Line:** [272](src/app/profile/page.tsx#L272)
- **HTML:**
  ```jsx
  <h3 className="text-sm font-bold text-yui-green-800 flex items-center gap-2 mb-2">
    <Tractor className="w-4 h-4 text-yui-green-600" aria-hidden="true" /> もっている農機具
  </h3>
  ```
- **Icon:** Tractor (lucide-react)
- **Styling:**
  - Font size: `text-sm` (0.875rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Icon size: `w-4 h-4`
  - Gap: `gap-2`
  - Margin bottom: `mb-2`
  - Layout: flex with items-center
  - Border above: `border-t border-yui-green-100`

### H3 - "育てている作物" (Crops Grown)
- **Line:** [385](src/app/profile/page.tsx#L385)
- **HTML:**
  ```jsx
  <h3 className="text-sm font-bold text-yui-green-800 flex items-center gap-2 mb-2">
    <Sprout className="w-4 h-4 text-yui-green-600" aria-hidden="true" /> 育てている作物
  </h3>
  ```
- **Icon:** Sprout (lucide-react)
- **Styling:**
  - Font size: `text-sm` (0.875rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Icon size: `w-4 h-4`
  - Gap: `gap-2`
  - Margin bottom: `mb-2`
  - Layout: flex with items-center
  - Border above: `border-t border-yui-green-100`

---

## 6. Settings Page
**File:** [src/app/settings/page.tsx](src/app/settings/page.tsx)

### H2 - "見やすさ設定" (Accessibility Settings)
- **Line:** [30](src/app/settings/page.tsx#L30)
- **HTML:**
  ```jsx
  <h2 id="visibility-heading" className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 border-b-2 border-yui-green-200">
    <Eye className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
    見やすさ設定
  </h2>
  ```
- **Icon:** Eye (lucide-react)
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Icon size: `w-6 h-6`
  - Gap: `gap-2`
  - Padding bottom: `pb-2`
  - Border bottom: `border-b-2 border-yui-green-200`
  - Layout: flex with items-center
  - ID: `visibility-heading` (aria-labelledby target)
  - Section tag: `<section aria-labelledby="visibility-heading">`

### H3 - "文字の大きさ" (Font Size)
- **Line:** ~55 (estimated from context)
- **Styling:**
  - Font size: `text-base` (1rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-700`
  - Margin bottom: `mb-2`
  - Purpose: Sub-heading within accessibility section

### H3 - "画面のくっきりさ" (Contrast Settings)
- **Line:** ~69
- **HTML:**
  ```jsx
  <h3 className="text-base font-bold text-yui-green-700 mb-2">画面のくっきりさ</h3>
  ```
- **Icon:** None
- **Styling:**
  - Font size: `text-base` (1rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-700`
  - Margin bottom: `mb-2`
  - Border above: `border-t border-yui-earth-100`
  - Padding top: `pt-4`
  - Purpose: Sub-heading within accessibility section

### H2 - "サポート" (Support)
- **Line:** [127](src/app/settings/page.tsx#L127)
- **HTML:**
  ```jsx
  <h2 id="support-heading" className="text-xl font-bold text-yui-green-800 flex items-center gap-2 pb-2 border-b-2 border-yui-green-200">
    <HelpCircle className="w-6 h-6 text-yui-green-600" aria-hidden="true" />
    サポート
  </h2>
  ```
- **Icon:** HelpCircle (lucide-react)
- **Styling:**
  - Font size: `text-xl` (1.25rem)
  - Font weight: `font-bold` (700)
  - Color: `text-yui-green-800`
  - Icon color: `text-yui-green-600`
  - Icon size: `w-6 h-6`
  - Gap: `gap-2`
  - Padding bottom: `pb-2`
  - Border bottom: `border-b-2 border-yui-green-200`
  - Layout: flex with items-center
  - ID: `support-heading` (aria-labelledby target)
  - Section tag: `<section aria-labelledby="support-heading">`

---

## Color Palette Reference

### Text Colors
- `text-yui-green-800` - Primary dark green (most common for main headings)
- `text-yui-green-700` - Slightly lighter green (subheadings)
- `text-white` - White text (on dark backgrounds)

### Icon Colors
- `text-yui-green-600` - Medium green (most icons)
- `text-yui-accent` - Accent color (BellRing icon in schedule)
- `text-yui-green-700` - (Eye icon in accessibility heading)

### Border Colors
- `border-yui-green-200` - Light green border (section dividers)
- `border-yui-earth-100` - Earth tone border (minor dividers)

---

## Typography Summary

| Element | Font Size | Weight | Color |
|---------|-----------|--------|-------|
| Main H1 (schedule, notifications) | text-xl | bold | text-yui-green-800 |
| Main H1 (explore, create) | text-2xl/3xl | bold | text-yui-green-800 |
| H2 (settings sections) | text-xl | bold | text-yui-green-800 |
| H2 (user name) | text-xl | bold | white |
| H3 (profile subsections) | text-sm | bold | text-yui-green-800 |
| H3 (settings subsections) | text-base | bold | text-yui-green-700 |

---

## Icon Usage Summary

| Page | Icon | Element | Icon Size |
|------|------|---------|-----------|
| Schedule | CalendarDays | Main H1 | w-6 h-6 |
| Schedule | BellRing | Section H2 | w-6 h-6 |
| Create | Megaphone | Main H1 | w-7 h-7 |
| Profile | Tractor | H3 Subsection | w-4 h-4 |
| Profile | Sprout | H3 Subsection | w-4 h-4 |
| Settings | Eye | H2 Section | w-6 h-6 |
| Settings | HelpCircle | H2 Section | w-6 h-6 |

---

## Notes

### Accessibility Features
- All icons use `aria-hidden="true"` to prevent screen reader redundancy
- Section headings have `id` and are referenced via `aria-labelledby` in section tags
- Proper heading hierarchy maintained (H1 → H2 → H3)

### Responsive Design
- Main page headings (H1) in explore and create pages use responsive sizing: `text-2xl md:text-3xl`
- All other headings maintain fixed sizes

### Styling Patterns
- Section headings with borders use `border-b-2` with `pb-2` padding
- Icons and text are grouped in flex containers with `gap-2`
- Consistent use of `mb-2` or `mb-6` for spacing below headings
- Icon colors typically match the heading text color theme

