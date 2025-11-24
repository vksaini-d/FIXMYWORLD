# 🌍 FixMyWorld

![Project Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech](https://img.shields.io/badge/Built%20With-React%20%7C%20Vite%20%7C%20Firebase-cyan)

**FixMyWorld** is a next-generation citizen reporting platform designed to help communities track and resolve civic issues. Built with a "Cyberpunk/Vibe" aesthetic, it combines real-time geolocation, interactive mapping, and community analytics to turn residents into active guardians of their city.

> **"Built for a better tomorrow."**

---

## ✨ Features

### 🗺️ Interactive Mapping
* **Layer Switching:** Seamlessly toggle between **Dark Mode**, **Street View**, **Satellite Imagery**, and **Terrain** modes using a custom glass-panel switcher.
* **Live GPS Tracking:** Real-time user location tracking with **Compass Heading** support (rotates the marker as you turn your phone).
* **Clustered Issues:** Visualize potholes, garbage dumps, and street light failures on a global map.

### 📱 "Vibe" UI & UX
* **Glassmorphism Design:** Modern, translucent UI components with neon accents.
* **Mobile-First Architecture:** Fully responsive layout using Dynamic Viewport Height (`dvh`) for a perfect experience on Android/iOS browsers.
* **Horizontal Scroll Filters:** Instagram-story style category filters for easy one-handed mobile use.

### 🛠️ Core Functionality
* **Issue Reporting:** Users can drop pins, select categories (Pothole, Water Leakage, etc.), and describe issues.
* **Real-Time Analytics:** Dashboard view showing total issues reported, resolved, and category breakdowns.
* **Community Upvoting:** Users can upvote critical issues to increase visibility.
* **Weather Integration:** Real-time local weather updates overlaid on the UI.
* **Secure Auth:** One-click **Google Sign-In** via Firebase.

---

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your app)*

| **Dashboard (Dark Mode)** | **Mobile View** |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/400x200?text=Map+Dashboard+Screenshot) | ![Mobile](https://via.placeholder.com/200x400?text=Mobile+View) |

| **Reporting Interface** | **Analytics** |
|:---:|:---:|
| ![Report](https://via.placeholder.com/400x200?text=Reporting+Screen) | ![Analytics](https://via.placeholder.com/400x200?text=Analytics+Screen) |

---

## 🚀 Tech Stack

* **Frontend Framework:** [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Maps:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
* **Backend & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
* **Weather Data:** [WeatherAPI](https://www.weatherapi.com/)
* **Icons:** Custom SVG Icons

---

## 🛠️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/vksaini-d/fixmyworld.git
cd fix-my-world
```
2. Install dependencies
```bash
npm install
```
3. Configure Environment Variables
Create a .env file in the root directory and add your keys:
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WEATHER_API_KEY=your_weatherapi_key
```
4. Run the development server
```bash
npm run dev
```
5. Live at locally
```bash
http://localhost:5173 
```
## 📂 Project Structure
```src/
├── App.jsx             # Main Application Logic (Map, Auth, State)
├── main.jsx            # Entry Point
├── index.css           # Tailwind Imports
├── custom.css          # Neon Animations & Leaflet Overrides
└── assets/             # Images and Static Files
```
## 🤝 Contributing
## Contributions are always welcome!

## Fork the project.

## Create your Feature Branch (git checkout -b feature/AmazingFeature).

## Commit your changes (git commit -m 'Add some AmazingFeature').

## Push to the Branch (git push origin feature/AmazingFeature).

## Open a Pull Request.

## 📜 License
## Distributed under the MIT License. See LICENSE for more information.

<p align="center"> Built with ❤️ by [VIKASH SAINI] </p>
