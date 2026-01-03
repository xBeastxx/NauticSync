<p align="center">
  <img src="public/icon.ico" alt="NauticSync Logo" width="120" />
</p>

<h1 align="center">NauticSync</h1>

<p align="center">
  <strong>Your Files. Your Devices. Your Control.</strong>
</p>

<p align="center">
  A modern, privacy-focused file synchronization application powered by Syncthing.
  <br />
  Built with Electron, React, and TypeScript.
</p>

<p align="center">
  <a href="https://github.com/xBeastxx/NauticSync/releases/latest">
    <img src="https://img.shields.io/github/v/release/xBeastxx/NauticSync?style=for-the-badge&logo=windows&logoColor=white" alt="Latest Release" />
  </a>
  <a href="https://github.com/xBeastxx/NauticSync/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/xBeastxx/NauticSync?style=for-the-badge" alt="License" />
  </a>
</p>

---

## 🎯 What is NauticSync?

NauticSync is a **desktop application** that synchronizes files between your devices using **peer-to-peer technology**. Unlike cloud storage services, your data never passes through third-party servers — files are transferred directly between your computers and devices.

**No cloud. No subscription. No limits.**

---

## ✨ Key Features

### 🔄 Real-time Synchronization
Powered by [Syncthing](https://syncthing.net/), files sync automatically as soon as changes are detected. No manual uploads or downloads needed.

### 🖼️ Media Hub
Browse, preview, and manage your synced media files with beautiful thumbnail previews. Supports images, videos, and common media formats.

### 📂 Selective Sync
Choose exactly which folders sync to each device. Keep work files on your work computer and personal files elsewhere.

### 🕐 Version History & Backup
Accidentally deleted or modified a file? Restore previous versions with a single click. NauticSync keeps a history of your file changes.

### ⚔️ Conflict Resolution
When the same file is edited on multiple devices, NauticSync detects the conflict and provides a visual diff viewer to help you merge or choose the correct version.

### 🔒 Privacy Mode
Enable **Strict LAN Only** mode to disable all global discovery and relay servers. Your devices will only find each other on the same local network — maximum privacy.

### ⏰ Bandwidth Scheduler
Control when and how fast your files sync. Set up schedules to avoid using bandwidth during work hours or limit speeds during peak times.

### 🔍 Global Search
Instantly find any file across all your synchronized folders with the global search (Ctrl + K). Type a filename and jump directly to it.

### 💻 System Tray Integration
Minimize to tray to keep NauticSync running quietly in the background. Your files continue syncing while you work.

### 🚀 Auto-Start with Windows
Enable auto-start to launch NauticSync when you log in. Never worry about forgetting to start the app.

---

## � Screenshots

| Sync Center | Media Hub | Settings |
|-------------|-----------|----------|
| ![Sync Center](docs/screenshots/sync-center.png) | ![Media Hub](docs/screenshots/media-hub.png) | ![Settings](docs/screenshots/settings.png) |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop app framework |
| **React 19** | User interface library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast development and build tooling |
| **Tailwind CSS** | Utility-first styling |
| **Syncthing** | Decentralized file synchronization engine |
| **Zustand** | Lightweight state management |
| **React Query** | Server state and caching |

---

## 📦 Installation

### Download the Installer

1. Go to the [Releases Page](https://github.com/xBeastxx/NauticSync/releases/latest)
2. Download `NauticSync Setup 1.0.0.exe`
3. Run the installer and follow the prompts
4. Launch NauticSync and name your device
5. Start adding folders to sync!

### Build from Source

```bash
# Clone the repository
git clone https://github.com/xBeastxx/NauticSync.git
cd NauticSync

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run package
```

---

## 🔧 Development

### Prerequisites
- Node.js 20+
- npm 10+
- Git

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the React app and Electron main process |
| `npm run package` | Build and package as installable .exe |
| `npm run lint` | Run ESLint |

### Project Structure

```
NauticSync/
├── electron/           # Electron main process
│   ├── main.ts         # Main entry point
│   ├── preload.ts      # Preload script for IPC
│   └── services/       # Backend services (Syncthing, FS, etc.)
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── lib/            # Utilities and API clients
│   ├── store/          # Zustand state stores
│   └── App.tsx         # Root component
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

---

## 🔒 Security & Privacy

NauticSync uses Syncthing's proven security model:

- **End-to-End Encryption**: All data transferred between devices is encrypted using TLS.
- **No Central Server**: Files are never stored on or routed through third-party servers.
- **Device Authentication**: Devices must be mutually approved before syncing.
- **Open Source**: Both NauticSync and Syncthing are open source and auditable.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Syncthing](https://syncthing.net/) - The incredible synchronization engine that powers NauticSync
- [Electron](https://www.electronjs.org/) - Making cross-platform desktop apps possible
- [Lucide Icons](https://lucide.dev/) - Beautiful open-source icons

---

<p align="center">
  Made with ❤️ by <strong>NauticGames™</strong>
</p>
