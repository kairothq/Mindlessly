# Chrome Web Store Resubmission Checklist for Mindlessly

## 🚨 Previous Rejection Reason

**Rejection Reason:** "Red Potassium" - Functionality not reproducible

**Root Cause:** Chrome reviewers couldn't see your extension working because they didn't know they had to ADD WEBSITES FIRST before the interface appears.

---

## ✅ CURRENT CONFIGURATION

### 1. **Data Collection (KEPT)**
- ✅ Google Forms submission for anonymous NPS scores is **ACTIVE**
- ✅ Privacy Policy correctly discloses this data collection
- ✅ Only anonymous data sent: NPS score, category, session count, timestamp, anonymous ID
- ✅ NO personally identifiable information collected

### 2. **Privacy Compliance**
- ✅ Privacy Policy hosted and accessible
- ✅ All data collection disclosed in PRIVACY_POLICY.md
- ✅ Notion forms are voluntary/user-initiated only
- ✅ Google Forms is automatic but anonymous

---

## 📋 PRE-SUBMISSION CHECKLIST

### Step 1: Create the Extension Package

**CRITICAL: Package the RIGHT files**

Create a ZIP file containing **ONLY** these files/folders:

```
✅ manifest.json
✅ background.js
✅ popup.html
✅ options.html
✅ onboarding.html
✅ changelog.html
✅ js/ (entire folder)
✅ style/ (entire folder)
✅ images/ (entire folder)
✅ media/ (entire folder)
✅ PRIVACY_POLICY.md
✅ LICENSE

❌ DO NOT INCLUDE:
   - .git/
   - .DS_Store
   - node_modules/
   - *.md files (except PRIVACY_POLICY.md and LICENSE)
   - Any other documentation files
   - This checklist
```

---

### Step 2: Test Locally BEFORE Submitting

**Load the extension in Chrome and test:**

1. Open Chrome → Extensions (`chrome://extensions`)
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the extension folder
5. **RUN FULL TEST** (see testing steps below)

---

### Step 3: Testing Instructions (Run This EXACTLY)

**Test on YouTube (pre-configured):**

1. Navigate to `https://www.youtube.com`
2. Extension should auto-activate (YouTube is pre-configured)
3. You should see the intention prompt overlay
4. Type an intention: "Watch coding tutorials"
5. Press Tab
6. Timer selection should appear
7. Click "1 min" and "Start Timer"
8. Timer should count down in top-right of intention box
9. Wait for timer to complete OR click intention box to see options
10. Completion dialog should appear

**Test on a new website:**

1. Navigate to `https://twitter.com`
2. Click Mindlessly extension icon
3. Should show "Add this website" button
4. Click "Add this website to mindful browsing list"
5. Refresh the page
6. Intention prompt should now appear
7. Repeat steps 4-9 from YouTube test

---

### Step 4: Chrome Web Store Submission

#### A. Upload Package

1. Go to Chrome Web Store Developer Dashboard
2. Click on "Mindlessly" extension
3. Click "Package" tab
4. Click "Upload new package"
5. Upload your ZIP file
6. **Wait for upload to complete fully**

#### B. Verify Store Listing

- Title: Mindlessly ✅
- Summary: Transform mindless browsing into focused sessions. Set intentions, use smart timers, and stay purposeful online. ✅
- Category: Tools ✅
- Language: English ✅
- Icons and screenshots: ✅

#### C. Privacy Tab - CRITICAL SETTINGS

**Single Purpose:**
```
Help users browse the internet more mindfully by setting clear intentions and using focus timers on websites they choose, promoting digital wellness and productive online habits.
```

**Permission Justifications:**

**webNavigation:**
```
WebNavigation permission is required to detect when users navigate to websites they have added to their mindful browsing list. This allows the extension to automatically display the intention-setting interface when users visit these specific sites. The permission is only used for navigation detection, not for tracking or data collection.
```

**storage:**
```
Local storage is used to save user preferences, website lists, intentions, timer settings, and usage statistics. All data is stored locally on the user's device using Chrome's storage API. No personal data is transmitted to external servers.
```

**activeTab:**
```
The activeTab permission allows the extension to access the current tab when users click the extension icon to add or remove websites from their mindful browsing list. This provides secure, user-initiated access without broad permissions. The permission is only active when users explicitly interact with the extension.
```

**scripting:**
```
Host permissions (http://*/ and https://*/) work together with the scripting permission to inject the mindful browsing interface on websites users explicitly add to their list. The extension only activates on user-selected domains stored locally. This is essential for displaying the intention prompt and focus timer on specific websites users choose to browse mindfully.
```

**Remote Code:**
- ✅ Select: "No, I am not using Remote code"

**Data Usage - IMPORTANT:**

⚠️ **CHECK THE FOLLOWING BOXES** (since we collect NPS data):

Under "What user data is collected?":
- ✅ **User activity** → Then select: "Product interaction"

**Why this is required:** NPS scores (0-10 ratings) are user-generated product interaction data sent to Google Forms for anonymous analytics. This is fully disclosed in our privacy policy.

**Certify all three disclosures (CHECK ALL 3):**
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes unrelated to the item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy Policy URL:**
```
https://github.com/kairothq/Mindlessly/blob/main/PRIVACY_POLICY.md
```

#### D. TEST INSTRUCTIONS TAB - ADD THIS

Click the "Test instructions" section and paste this EXACTLY:

```
HOW TO TEST MINDLESSLY - STEP-BY-STEP GUIDE

IMPORTANT: This extension only activates on websites that users explicitly add to their list. This is intentional for privacy and user control.

=== QUICK TEST (YouTube - Pre-configured) ===

1. After installing the extension, navigate to: https://www.youtube.com
2. The extension will AUTOMATICALLY activate (YouTube is pre-configured during installation)
3. You will see a white rounded intention prompt overlay at the top center of the page
4. Click the prompt or wait for it to auto-focus
5. Type any intention (example: "Watch React tutorial")
6. Press Tab or Enter key
7. A timer selection dialog will appear
8. Click "1 min" (recommended for quick testing)
9. Click "Start Timer" button
10. You will see a circular timer in the top-right of the intention box counting down
11. Wait 1 minute OR click the intention box to access timer controls
12. When timer completes, a completion dialog appears with options

=== FULL TEST (Adding New Website) ===

1. Navigate to any website (example: https://twitter.com or https://reddit.com)
2. Click the Mindlessly extension icon in the Chrome toolbar
3. You will see a button: "Add this website to mindful browsing list"
4. Click that button
5. Refresh the page or navigate within the site
6. The intention prompt overlay will now appear
7. Follow steps 4-12 from the Quick Test above

=== WHAT TO EXPECT ===

✅ White rounded intention box appears at top center
✅ Blur overlay on page background when setting intention
✅ Timer selection dialog with options: No timer, 1 min, 10 min, Custom
✅ Circular countdown timer visible during active session
✅ Completion dialog when timer finishes
✅ Draggable intention box (can be repositioned)
✅ Options page accessible via right-click on extension icon

=== PRE-CONFIGURED TEST SITES ===

The following sites are automatically added during installation for immediate testing:
- www.youtube.com
- www.instagram.com
- web.whatsapp.com
- twitter.com / x.com
- www.reddit.com
- www.facebook.com

Simply visit these sites to see the extension in action immediately after installation.

=== KEY FEATURES TO VERIFY ===

1. Intention setting (text input with blur overlay)
2. Timer selection dialog (4 options: no timer, 1 min, 10 min, custom)
3. Active timer display (circular progress indicator)
4. Timer completion dialog (2 buttons: extend or start new task)
5. Session tracking (NPS feedback prompt after 2+ sessions)
6. Milestone celebrations (at 3, 7, 15, 30, 50, 100 sessions)
7. Draggable interface (intention box can be moved)
8. Options page (accessible via extension popup)

=== DATA HANDLING ===

- User preferences, intentions, and timer settings: Stored locally via Chrome Storage API
- Anonymous NPS scores: Sent to Google Forms for product analytics (disclosed in privacy policy)
- No personally identifiable information collected
- No browsing history tracked

=== TROUBLESHOOTING ===

❌ If extension doesn't activate:
   - Make sure you've added the website to your list first
   - Try refreshing the page after adding
   - Check that the website is not a chrome:// or edge:// internal page

❌ If you see nothing after installing:
   - Navigate to YouTube.com (it's pre-configured)
   - OR manually add any website via the extension icon

Contact: divykairoth@gmail.com for any questions during review.
```

---

### Step 5: Submit for Review

1. Review all sections one final time
2. Click "Submit for review"
3. **WAIT** - Do not upload multiple versions while in review
4. Review typically takes 1-3 business days

---

## 🔍 VERIFICATION CHECKLIST BEFORE SUBMITTING

**Package Quality:**
- [ ] ZIP file is under 100MB
- [ ] No .git or .DS_Store files included
- [ ] manifest.json is at root of ZIP
- [ ] All js/, style/, images/ folders included
- [ ] No documentation files except PRIVACY_POLICY.md and LICENSE

**Functionality:**
- [ ] Tested on YouTube (pre-configured)
- [ ] Tested adding new website manually
- [ ] Timer works and counts down
- [ ] Completion dialog appears
- [ ] Intention can be edited
- [ ] Extension icon works
- [ ] Options page loads

**Privacy Compliance:**
- [ ] "User activity" checkbox CHECKED in data usage
- [ ] "Product interaction" selected under User activity
- [ ] Privacy policy URL is correct
- [ ] All 3 certification checkboxes CHECKED
- [ ] Remote code set to "No"

**Documentation:**
- [ ] Test instructions added to submission
- [ ] Test instructions mention pre-configured sites
- [ ] Test instructions explain how to add new sites
- [ ] Data handling section mentions Google Forms

---

## 📊 EXPECTED TIMELINE

- **Upload**: Instant
- **Initial Review**: 1-3 business days
- **If issues found**: You'll receive email with details
- **If approved**: Extension goes live immediately

---

## 💡 IF YOU GET REJECTED AGAIN

**Check the rejection reason and:**

1. **Functionality issues**: Record a video showing it working
2. **Privacy issues**: Verify data collection boxes match actual behavior
3. **Misleading content**: Update description to match actual features
4. **Policy violations**: Review Chrome Web Store policies

**Contact:** divykairoth@gmail.com

---

## ✅ SUMMARY OF WHAT CHANGED

### From Previous Submission:
1. ✅ **KEPT**: Google Forms anonymous NPS collection
2. ✅ **UPDATED**: Data collection declaration (check "User activity" box)
3. ✅ **IMPROVED**: Test instructions with clearer steps
4. ✅ **FIXED**: Data handling section now mentions Google Forms

### Key Points for Reviewer:
- Extension activates ONLY on user-selected websites
- Pre-configured sites allow immediate testing
- Anonymous NPS data collection disclosed in privacy policy
- No personally identifiable information collected

---

**Good luck with your submission! 🚀**
