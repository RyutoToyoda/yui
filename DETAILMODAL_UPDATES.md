# DetailModal Component Updates

## Summary
Updated the DetailModal component in `src/app/schedule/page.tsx` to match the styling and layout of the job detail view in `src/app/explore/[id]/page.tsx`.

## Key Changes Made

### 1. **Added Lucide Icons**
- **File**: `src/app/schedule/page.tsx` (line 37-39)
- **Added imports**: `MapPin`, `Users`, `Wrench`
- These replace emoji indicators for a more polished look

### 2. **Unified Header Layout**
- **Location**: Both recruitment and volunteering job sections
- Job title and creator name now appear in a unified header at the top (matching explore layout)
- Colored backgrounds (#8c7361 for recruitment, #468065 for volunteering)

### 3. **Grid-Based Layout for Info Items**
- **Changed from**: Simple stacked containers
- **Changed to**: 2-column grid layout with `grid grid-cols-2 gap-3`
- Full-width items use `col-span-2`
  - 作業日と時間 (Calendar & Time) - full width
  - 作業場所 (Location) - full width
  - 必要な人数 (Required People) - half width (if present)
  - 農機具 (Equipment) - half width (if present)
  - お礼のポイント (Reward Points) - adaptive width

### 4. **Updated Typography**
- **Title**: `text-xl font-bold` (matching explore detail)
- **Section labels**: `text-xs font-bold` with icon+label pairs
- **Content**: `text-sm font-bold` for main info, `text-sm` for descriptions
- **Subtext**: `text-[11px] font-bold` for rate per hour

### 5. **Consistent Spacing**
- **Container padding**: `p-5`
- **Grid gap**: `gap-3`
- **Section spacing**: `space-y-4`
- **Label-to-content spacing**: `mb-1` between icon/label and content

### 6. **Applicants List Handling**
- **Recruitment jobs**: Full applicants section maintained at the bottom with reject button
- **Volunteering jobs**: No applicants section - just shows job details
- This matches the actual use case (only recruitment has applicants to manage)

### 7. **Info Box Styling**
- **Background colors**: `bg-yui-green-50` for most fields, `bg-yui-accent/10` for rewards
- **Borders**: Matching `rounded-xl` for consistency
- **Icon colors**: `text-yui-green-600` with proper sizing

## Visual Comparison

### Before
- Section headers ("自分の募集" and "手伝いの予定") at the top of each section
- Emoji indicators for info labels
- Stacked vertical layout for info boxes
- Inconsistent typography

### After
- Unified job header with title and creator name
- Lucide icons (CalendarDays, MapPin, Users, Wrench, Coins)
- Grid-based 2-column layout
- Consistent typography matching explore detail view
- Same spacing and alignment as explore page

## Files Modified
- `src/app/schedule/page.tsx`
  - Line 37-39: Added icon imports
  - Lines 446-729: Updated DetailModal function

## Compatibility
- No breaking changes
- All existing functionality (approve/reject applicants) preserved
- Responsive design maintained (works on mobile and desktop)
