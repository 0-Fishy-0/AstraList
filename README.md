 <div align="center">

# ✨ AstraList

**A unified media tracker and library for anime, TV shows, movies, and video games.**

One place for all your media. Connect the services you already use, bring your libraries together, and stop juggling between different trackers.

[Report a bug](https://github.com/0-Fishy-0/AstraList/issues) · [Request a feature](https://github.com/0-Fishy-0/AstraList/issues)

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-5C5C5C?logo=javascript&logoColor=yellow)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

<!-- TODO: Add application screenshot or demo GIF -->
<!-- <img src="screenshots/preview.png" alt="AstraList preview" width="800"> -->

</div>

---

## About

AstraList is a personal project built around a simple idea: **you shouldn't need a different tracker for everything you watch or play.**

There are plenty of great platforms for tracking specific types of media, but their libraries exist independently. AstraList aims to bring them together into one centralised library, allowing users to manage their media without constantly switching between services.

Rather than reinventing existing media databases, AstraList builds on established platforms and their APIs to provide a unified tracking experience.

## Features

- 📚 **Unified media library**: A central place for organising anime, TV shows, movies, and video games.
- 🔗 **Third-party integrations**: Connect existing tracking services instead of maintaining entirely separate libraries.
- 🔐 **AniList authentication**: Sign in and connect your AniList account using OAuth.
- 🎯 **Anime tracking**: Manage watching, completed, on-hold, dropped, and planned anime.
- 📊 **Progress and ratings**: Track viewing progress and rate entries in your library.
- 👤 **User profiles**: Personalised profiles with custom handles and display names.

*Currently, AniList is the implemented integration. Additional platform integrations are planned.*

## Run locally

```bash
git clone https://github.com/0-Fishy-0/AstraList.git
cd AstraList
```

Install dependencies separately:

```bash
cd client
npm install
```

```bash
cd ../server
npm install
```

Configure the backend environment:

```bash
cp .env.example .env
```

Fill in the required values in `server/.env`:

- `ANILIST_CLIENT_ID`
- `ANILIST_CLIENT_SECRET`
- `ANILIST_REDIRECT_URI`
- `MONGODB_URI`

Register an AniList application to obtain your OAuth credentials.

Start the backend:

```bash
cd server
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd client
npm run dev
```

## Under the hood

- **Frontend**: React with Vite for the client application.
- **Backend**: Node.js and Express for API routes, authentication, and application logic.
- **Database**: MongoDB for persistent user and application data.
- **Authentication**: AniList OAuth with server-managed sessions.
- **Modular integrations**: Designed to accommodate multiple external media-tracking services as the project grows.

## Roadmap

- [ ] MyAnimeList integration
- [ ] IMDb integration
- [ ] Trakt integration for movies and TV shows
- [ ] Backloggd integration for video games
- [ ] HowLongToBeat integration
- [ ] Unified libraries across all supported media
- [ ] Cross-platform library synchronisation
- [ ] Media discovery and recommendations

---

<div align="center">

**Built by [0-Fishy-0](https://github.com/0-Fishy-0)**

*Still a work in progress. More media, fewer tabs.*

</div>
