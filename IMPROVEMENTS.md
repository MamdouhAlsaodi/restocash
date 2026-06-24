# RestoCash Mobile — Improvement Log

## 🎨 Design Direction (Approved by user — 2026-06-24)

**Modern light theme palette** with vibrant accent colors:
- **White** (off-white `#FAFAFA`) — primary background (light, clean)
- **Red** (`#E53935`) — destructive actions (delete, cancel, error)
- **Orange** (`#FF9800`) or **Yellow** (`#FFC107`) — warnings, highlights
- **Green** (`#43A047`) — success, confirm, complete
- Plus **light surface** (`#F5F5F5`) and **dark text** (`#1A1A1A`)

**Style guidelines**:
- Light mode primary (white background, not dark)
- Flat / Material 3 design — minimal shadows
- Bold accent colors for primary actions (green for confirm, red for cancel)
- High contrast text (`#1A1A1A` on white)
- Use orange/yellow sparingly — for badges, highlights, pending states
- Keep dark mode as **optional alternative** (system preference)

**Color mapping**:
- Background: `#FAFAFA` (was `#1A1A2E`)
- Surface: `#F5F5F5` (was `#232347`)
- Text primary: `#1A1A1A` (was `#F5F5F5`)
- Text secondary: `#666666` (was `#8888AA`)
- Primary action: `#43A047` (green for confirm/checkout)
- Destructive: `#E53935` (red for cancel/delete)
- Warning: `#FF9800` (orange for pending/retry)
- Highlight: `#FFC107` (yellow for badges/active tab indicator)
- Border: `#E0E0E0` (was `#333355`)

**Implementation plan**:
1. Update `src/theme.ts` with new palette
2. Update `LoginScreen` to use light theme
3. Update all screens to use new colors
4. Test on web (`expo start --web`)
5. Build APK

---

## UI/UX Issues (Pending)

### 1. Bottom Navigation Bar Overlap (RestoCash Mobile) — 2026-06-24
**Problem**: Bottom tab bar at the bottom of mobile screens overlaps with the phone's system gesture/navigation bar (3-button bar or gesture handle). The tabs are partially hidden behind the system bar.

**Affected screens**:
- All RestoCash Mobile screens (Login, Cashier, Cart, Payment, Confirmation, Reports)

**Required fix**:
- Add bottom safe-area inset to all screens with tab bar
- Apply `paddingBottom: insets.bottom` to tab bar container
- Use `useSafeAreaInsets()` from `react-native-safe-area-context`
- Currently the tab bar starts from absolute bottom of screen without accounting for system navigation bar

**Suggested implementation**:
```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {/* tabs */}
    </View>
  );
}
```

**Status**: ⏳ Pending — to fix in next session

---

### 2. App Loading Speed (Login screen) — 2026-06-24
**Problem**: Login screen takes long time to load. User perceives this as "Tain-scale" (time scale) problem.

**Possible causes**:
- API health check on launch
- AsyncStorage initialization
- Network timeout on slow connection
- Heavy bundle loading

**Suggested investigation**:
- Add loading indicator / splash
- Lazy load screens
- Cache API responses

**Status**: ⏳ Pending investigation

---

## Phase 10 — Sale Cancellation (Backend) — 2026-06-24
**Status**: 📋 Not started (last agreed)

**Scope**:
- POST /api/sales/:id/cancel endpoint
- Admin-only access
- Requires cancellation reason
- Sets Sale.status = CANCELLED
- Reports exclude cancelled sales
- Tests: integration test for cancellation flow

**Files to create**:
- apps/api/src/modules/sales/dto/cancel-sale.dto.ts
- apps/api/src/modules/sales/sales.service.ts (add cancel method)
- apps/api/src/modules/sales/sales.controller.ts (add cancel route)
- apps/api/test/sales.cancel.int-spec.ts (integration test)

**Estimated time**: 60-90 minutes

---

## Recent Fixes Applied

### NuBank Credit 200 → 1000
- ✅ Updated via SQLite
- File: prisma/dev.db BankCard table

### YuiOS Mobile v0.2.0 (Build be4659c7...)
- ✅ Cleartext HTTP allowed (Android network config)
- ✅ Chat polling every 3s
- ✅ Typing indicator
- ✅ Shared session registry

### RestoCash Mobile v0.2.1 (Build fad78bae...)
- ✅ Release APK with embedded bundle
- ✅ Login works
- ⏳ Bottom tab bar overlap (pending)

### Backend Chat APIs (YuiOS Dashboard)
- ✅ /api/chat/sessions
- ✅ /api/chat/typing
- ✅ /api/chat/poll (with local store fallback)
- ✅ /api/chat/yui (saves to local store)
- ✅ /api/chat/history (with local store fallback)
