# Mindlessly 🎯

A Chrome extension that transforms mindless browsing into mindful, productive sessions with purposeful focus and smart timer management.

## ✨ Features

- **Purpose Setting**: Force yourself to state your purpose before browsing distracting websites
- **Smart Timer System**: Built-in session timers (1min, 10min, or custom duration) with visual countdown
- **Schedule Control**: Set specific hours when the extension should be active (e.g., work hours only)
- **Visual Progress**: Circular timer with real-time progress indicators
- **Session Management**: Extend sessions or start fresh tasks when timers complete
- **Drag & Drop Interface**: Moveable purpose box for personalized positioning
- **Cross-session Persistence**: Maintains your purpose and timers across page reloads

## 🚀 Installation

### From Source (Developer Mode)

Simple language -> Open terminal, put this code below, then open browser, open extensions, turn on developer mode toggle, install package (present of user with name "Mindlessly")

1. Clone this repository:
   ```bash
   git clone https://github.com/kairothq/Mindlessly.git
   cd Mindlessly
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** in the top-right corner
4. Click **Load unpacked** and select the extension directory

## 🎮 How to Use

1. **Add Websites**: Use the popup or options page to add distracting websites you want to browse mindfully
2. **Set Your Schedule**: Configure active hours in the options page (optional)
3. **Browse Mindfully**: When you visit a tracked site, you'll see a purpose prompt
4. **State Your Purpose**: Type what you want to accomplish on this visit
5. **Choose Timer**: Select a timer duration to stay focused (1min, 10min, or custom)
6. **Stay Accountable**: The timer keeps you on track with visual progress

## ⚙️ Configuration

Access the options page by:
- Right-clicking the extension icon → Options
- Or navigate to `chrome://extensions` → Mindlessly → Options

### Options Available:
- **Manage Websites**: Add/remove sites you want to browse mindfully
- **Time Restrictions**: Set active hours (e.g., only during 9 AM - 5 PM)
- **Time Format**: Toggle between 12-hour and 24-hour display

## 🛠️ Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `webNavigation`, `storage`, optional `scripting`
- **Architecture**: Service worker background script with content script injection
- **Storage**: Local Chrome storage for persistence
- **Framework**: Vanilla JavaScript with Web Components

## 📱 Browser Support

- Chrome (Manifest V3)
- Chromium-based browsers (Edge, Brave, etc.)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or request features via [Issues](https://github.com/kairothq/Mindlessly/issues)
- Submit pull requests for improvements
- Share feedback and suggestions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by [Divy Kairoth](https://github.com/kairothq)**
