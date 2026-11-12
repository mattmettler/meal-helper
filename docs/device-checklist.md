# Device checklist

Run this on a real iPhone and a real Android phone after the site is live at `https://<user>.github.io/meal-helper/`. Do each section on both platforms unless noted. Record results in the spec (section 10) when done.

## 1. Install

- [ ] **iOS (Safari only):** open the site, tap Share, tap Add to Home Screen, tap Add.
- [ ] **Android (Chrome):** open the site, tap the menu (three dots), tap Install app (or Add to Home screen), confirm.
- [ ] Icon appears on the home screen with the right name.

## 2. Launch

- [ ] Open from the home-screen icon, not the browser.
- [ ] Runs standalone: no address bar or browser buttons.

## 3. Offline use

Install and open the app once online first, then turn on airplane mode and fully close and reopen the app from the icon.

- [ ] App loads.
- [ ] Build a meal through every step.
- [ ] Too-thin meal shows the too-thin message.
- [ ] Save a meal.
- [ ] Favorite a saved meal.
- [ ] Delete a saved meal.
- [ ] Add a custom option with clashes and a tip.
- [ ] Edit that option's clashes and note.
- [ ] Hide a built-in option, then restore it.
- [ ] Delete a custom option.
- [ ] Export a backup.
- [ ] Import a backup.

## 4. Persistence

- [ ] With saved meals and a custom option present, fully close the app (iOS: swipe it away in the app switcher; Android: swipe it away in recents), reopen, and confirm everything is still there.
- [ ] Repeat after restarting the phone.

## 5. storage.persist() on iOS (optional)

The app logs `Persistent storage granted: true` or `false` to the console on startup. It is not shown in the app. The app works either way. This only tells us whether iOS will protect data from eviction.

To read it you need a Mac: connect the iPhone by cable, enable Settings > Safari > Advanced > Web Inspector on the phone, open Safari on the Mac, then Develop > (your iPhone) > the app's page, and read the Console tab. Reload the page while the inspector is open to see the startup log. On Android, use `chrome://inspect` on a desktop Chrome with USB debugging on.

- [ ] iOS result: granted `true` / `false` (write it here: ______)
- [ ] Android result (optional): ______

## 6. Backup file

- [ ] Export downloads a file. Find it (iOS: Files app > Downloads or wherever the share/download prompt put it; Android: Downloads).
- [ ] Delete a saved meal, then import that file. The meal returns.
- [ ] Works from the installed home-screen app, not just the browser tab, on both platforms.
- [ ] If the installed iOS app blocks or loses the download: add `navigator.share` with files to `downloadFile`, and record the decision in spec sections 6 and 10.

## 7. Looks

- [ ] Emoji tab icons look acceptable on iOS and Android.
- [ ] Favorite hearts look acceptable on both.
- [ ] If either looks bad, replace the emoji with inline SVG (spec section 5).
- [ ] App icon on each home screen: yellow background, bird centered, not clipped by the platform mask.

## 8. Host unreachable

- [ ] After install, with airplane mode on (or the site's host blocked), the app still opens and works from the icon.
- [ ] Note: if iOS evicts the service worker cache, the app can't load offline until reinstalled (spec section 6 residual risk). Backups protect data, not the app.

## 9. Updates

- [ ] Publish a visible change (for example, edit a seed tip) to `main` and wait for the deploy to go green.
- [ ] Open the installed app while online. Close it fully and reopen if needed.
- [ ] The change appears (it may take a second launch for the new service worker to activate).
