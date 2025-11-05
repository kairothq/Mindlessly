# Mindlessly Extension - Feedback Forms Setup Guide

## Overview
The Mindlessly extension now includes a sophisticated feedback system that tracks user sessions and requests feedback after 3 completed focused sessions. The system uses a two-tier approach:

1. **Quick NPS Survey**: Embedded in the extension for immediate feedback
2. **Detailed Forms**: External Google Forms based on NPS category

## Google Forms Setup

You'll need to create 3 different Google Forms for different user segments:

### 1. Promoter Form (NPS 9-10) - "Share what you love"
**Target**: Users who gave high scores and are likely to recommend

**Questions to include:**
- What do you love most about Mindlessly?
- How has Mindlessly helped improve your focus?
- Would you recommend Mindlessly to a friend/colleague? Why?
- What features would you like to see added?
- Can we feature your story as a testimonial? (Optional: Name & occupation)
- How did you discover Mindlessly?

**Tone**: Celebratory, asking for testimonials and feature requests

### 2. Passive Form (NPS 7-8) - "Help us improve"
**Target**: Users who are satisfied but not enthusiastic

**Questions to include:**
- What's working well with Mindlessly?
- What would make you more likely to recommend it?
- What features are missing that would be helpful?
- How could we make the experience better?
- What's your biggest challenge with staying focused online?
- Any suggestions for improvements?

**Tone**: Constructive, focused on improvement opportunities

### 3. Detractor Form (NPS 0-6) - "Tell us what's wrong"
**Target**: Users who had a poor experience

**Questions to include:**
- What specific issues did you encounter?
- What frustrated you most about the extension?
- How could we have made your experience better?
- Did you experience any technical problems?
- What would need to change for you to recommend Mindlessly?
- Would you like direct support to resolve your issues? (Contact info)

**Tone**: Apologetic, focused on problem-solving

## Form URLs to Update

After creating your Google Forms, update these URLs in the code:

```javascript
// In inject.js, showFeedbackThankYou method:
if (category === 'promoter') {
    formUrl = 'https://forms.gle/YOUR_PROMOTER_FORM_ID'
} else if (category === 'passive') {
    formUrl = 'https://forms.gle/YOUR_PASSIVE_FORM_ID'  
} else {
    formUrl = 'https://forms.gle/YOUR_DETRACTOR_FORM_ID'
}
```

## Email Setup

Update the support email in the contact function:

```javascript
// In inject.js, feedbackContact event listener:
window.open(`mailto:YOUR_SUPPORT_EMAIL@domain.com?subject=${subject}&body=${body}`, '_blank')
```

## Analytics & Data Collection

The extension automatically tracks:
- Session completion count
- NPS scores and categories
- Feedback request timing
- User engagement metrics

All data is stored locally in Chrome storage for privacy.

## Testing the System

1. Install the extension
2. Complete 3 timer sessions (use 1-minute timers for quick testing)
3. On the 3rd completion, the feedback dialog should appear
4. Test all NPS scores to see different form links
5. Verify email contact works properly

## Customization Options

### Modify Feedback Timing
Change when feedback appears by editing the `shouldRequestFeedback` function in `feedback.js`:

```javascript
// Currently triggers after 3 sessions
const shouldRequest = (
    stats.sessionsCompleted >= 3 && 
    !stats.feedbackGiven && 
    (!stats.feedbackRequested || stats.sessionsCompleted >= 6)
)
```

### Update Copy
All user-facing text is in the template section of `inject.js`. Key messages:

- Main headline: "🎉 You're on a roll!"
- Subtitle: "You've completed 3 focused sessions with Mindlessly. Your opinion matters to us!"
- NPS question: "How likely are you to recommend Mindlessly to a friend?"

### Styling
All feedback dialog styles are in the CSS section of `inject.js` under the "Feedback Dialog" comment block.
