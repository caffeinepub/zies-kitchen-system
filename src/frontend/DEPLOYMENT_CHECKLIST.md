# Deployment Checklist

This checklist ensures a successful build and deployment of the Zie's Kitchen POS application.

## Pre-Build Verification

- [ ] All dependencies installed (`pnpm install`)
- [ ] Backend canister created and deployed
- [ ] Backend bindings generated (`dfx generate backend`)
- [ ] No TypeScript errors (`pnpm typescript-check`)
- [ ] No linting errors (`pnpm lint`)

## Build Process

1. **Generate Backend Bindings**
   ```bash
   dfx generate backend
   ```

2. **Build Frontend**
   ```bash
   pnpm build:skip-bindings
   ```

3. **Verify Build Output**
   - Check `frontend/dist` directory exists
   - Verify `env.json` copied to dist folder
   - Confirm all assets are bundled

## Post-Deployment Smoke Tests

### Authentication Flow
- [ ] Login page loads correctly
- [ ] Internet Identity authentication works
- [ ] Profile setup modal appears for new users
- [ ] User can set their name on first login
- [ ] Logout clears all cached data

### Core Functionality
- [ ] Dashboard displays summary cards
- [ ] Kasir (Cashier) page allows transaction creation
- [ ] Transaction date/time validation prevents future dates
- [ ] Payment calculation and change work correctly
- [ ] Laporan (Reports) page loads daily and monthly reports
- [ ] Transaction deletion with confirmation dialog works
- [ ] Pengeluaran (Expenses) page allows expense entry
- [ ] All forms validate input correctly

### UI/UX
- [ ] Navigation menu works on all pages
- [ ] Responsive design works on mobile devices
- [ ] Print functionality works for reports
- [ ] CSV export downloads correctly
- [ ] Dark/light theme toggle works
- [ ] Toast notifications appear for success/error states

### PWA Features
- [ ] Install prompt appears on mobile
- [ ] App can be installed to home screen
- [ ] Service worker caches assets correctly
- [ ] Offline fallback works when network unavailable

## Known Issues to Monitor

- Ensure transaction deletion only allows users to delete their own transactions (non-admins)
- Verify date picker max validation prevents future transaction dates
- Check that React Query cache invalidation refreshes all dependent views

## Rollback Plan

If critical issues are found:
1. Note the deployment version/commit
2. Document the specific issue
3. Revert to previous stable version if necessary
4. Fix issue in development environment
5. Re-test before next deployment
