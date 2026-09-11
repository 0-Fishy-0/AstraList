import {
    requestAniList,
    getAnimeList,
    updateAnimeEntry
} from './anilist.js';
import express from 'express';
import cors from 'cors';
import { randomUUID, randomInt } from 'node:crypto';
import cookieParser from 'cookie-parser'
import { MongoClient, ReturnDocument } from 'mongodb';

const app = express();
const PORT = 3000;
const mongoClient = new MongoClient(process.env.MONGODB_URI);
let db;
let usersCollection;
let sessionsCollection;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use(cookieParser());
app.use(express.json());


async function connectToDatabase() {
    await mongoClient.connect();
   
    db = mongoClient.db('astraList');
    usersCollection = db.collection('users');
    await usersCollection.createIndex(
        { handle: 1 },
        { unique: true }
    )
    sessionsCollection = db.collection('sessions');
    console.log("Connected to MongoDB");
}

function generateDefaultHandle() {
    return `user${randomInt(1_000_000_000, 10_000_000_000)}`;
}
function normalizeHandle(handle) {
    return handle.trim().toLowerCase();
}

const ANIME_UPDATE_FIELDS = new Set([
    'status',
    'rating',
    'progress',
    'startedAt',
    'completedAt'
]);
const ANIME_STATUSES = new Set([
    'watching',
    'completed',
    'on-hold',
    'dropped',
    'planning'
]);

function isValidAnimeDate(value) {
    if (value === null) return true;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    const keys = Object.keys(value);
    if (
        keys.length === 0 ||
        !keys.every((key) => ['year', 'month', 'day'].includes(key))
    ) return false;

    const year = value.year ?? null;
    const month = value.month ?? null;
    const day = value.day ?? null;

    if (
        (year !== null && (!Number.isInteger(year) || year < 1 || year > 9999)) ||
        (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) ||
        (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) ||
        (month !== null && year === null) ||
        (day !== null && month === null)
    ) return false;

    if (year === null || month === null || day === null) return true;

    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    return day <= daysInMonth[month - 1];
}

async function requireAuth(req, res, next) {
    const sessionId = req.cookies.astra_session;

    if (!sessionId) {
        return res.status(401).json({
            error: 'UNAUTHORIZED'
        });
    }

    const session = await sessionsCollection.findOne({ sessionId });

    if (!session) {
        return res.status(401).json({
            error: 'UNAUTHORIZED'
        });
    }

    if (new Date() > session.expiresAt) {
        await sessionsCollection.deleteOne({ sessionId });

        res.clearCookie('astra_session', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        return res.status(401).json({
            error: 'UNAUTHORIZED'
        });
    }

    const user = await usersCollection.findOne({ _id: session.userId });

    if (!user) {
        await sessionsCollection.deleteOne({ sessionId });

        return res.status(401).json({
            error: 'UNAUTHORIZED'
        });
    }

    req.session = session;
    req.user = user;
    next();
}




// ANILIST

app.get('/auth/anilist', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.ANILIST_CLIENT_ID,
        redirect_uri: process.env.ANILIST_REDIRECT_URI,
        response_type: 'code'
    });
    const authUrl = 
        `https://anilist.co/api/v2/oauth/authorize?${params.toString()}`;
    res.redirect(authUrl)
})


app.get('/auth/anilist/callback', async (req, res) => {

    const code = req.query.code

    if (typeof code !== 'string' || !code) {
        return res.status(400).json({
            error: 'ANILIST_AUTH_CODE_REQUIRED'
        });
    }

    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
       method: 'POST',

        headers:{
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },

        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: process.env.ANILIST_CLIENT_ID,
            client_secret: process.env.ANILIST_CLIENT_SECRET,
            redirect_uri: process.env.ANILIST_REDIRECT_URI,
            code: code
        })
    });

    const data = await response.json();

    if (
        !response.ok ||
        typeof data.access_token !== 'string' ||
        !Number.isFinite(data.expires_in)
    ) {
        console.error(`AniList token exchange failed with status ${response.status}`);
        return res.status(502).json({
            error: 'ANILIST_TOKEN_EXCHANGE_FAILED'
        });
    }
    
    const query = `
        query {
            Viewer {
                id
                name
            }
        }
    `;
   
    const viewerData = await requestAniList(
        query, 
        {}, 
        data.access_token);

    const viewer = viewerData.Viewer;

    const defaultHandle = generateDefaultHandle();
    const now = new Date();

    const user = await usersCollection.findOneAndUpdate(
        { 
            "accounts.anime.anilist.userId": viewer.id 
        },

        {
            $set: {
                "accounts.anime.anilist.username": viewer.name,
                "accounts.anime.anilist.accessToken": data.access_token,
                "accounts.anime.anilist.tokenExpiresAt": new Date(
                    Date.now() + data.expires_in * 1000
                ),
                updatedAt: now
            },
            
            $setOnInsert: {
                handle: normalizeHandle(defaultHandle),
                handleChangedAt: null,

                displayName: viewer.name,
                profileSetupComplete: false,

                "accounts.anime.anilist.userId": viewer.id,
                "accounts.anime.anilist.connectedAt": now,

                "accounts.anime.myanimelist": {},
                "accounts.movies": {},
                "accounts.games": {},

                createdAt: now
            }
        },

        { 
            upsert: true,
            returnDocument: 'after'
        }
    );

    const sessionId = randomUUID();
    const SESSION_DURATION = 1000 * 60 * 60;

    await sessionsCollection.insertOne({
        sessionId: sessionId,
        userId: user._id,
        expiresAt: new Date(Date.now() + SESSION_DURATION),
        createdAt: new Date()
    });

    res.cookie('astra_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: SESSION_DURATION
    });

    res.redirect('http://localhost:5173')

});

// HELPER ENDPOINTS

app.get('/api/me', async (req, res) => {
    const sessionId = req.cookies.astra_session;

    if (!sessionId) {
        return res.json({
            loggedIn: false,
            user: null
        });
    }

    const session = await sessionsCollection.findOne({ sessionId });

    if (!session) {
        return res.json({
            loggedIn: false,
            user: null
        });
    }

    if (new Date() > session.expiresAt) {
        await sessionsCollection.deleteOne({ sessionId });

        res.clearCookie('astra_session', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        return res.json({
            loggedIn: false,
            user: null
        });
    }
    
    const user = await usersCollection.findOne({ _id: session.userId });

    if (!user) {
        await sessionsCollection.deleteOne({ sessionId });

        return res.json({
            loggedIn: false,
            user: null
        });
    }

    res.json({
        loggedIn: true,
        user: {
            handle: user.handle,
            displayName: user.displayName,
            profileSetupComplete: user.profileSetupComplete
        }
    });
});

app.post('/auth/logout', async (req, resp) => {
    const sessionId = req.cookies.astra_session;
    if (sessionId) {
        await sessionsCollection.deleteOne({ sessionId })
    }

    resp.clearCookie('astra_session', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    });

    resp.json({
        loggedOut: true
    });
});

app.get(
    '/api/account/handle-available',
    requireAuth,

    async (req, res) => {
        const handle = normalizeHandle(req.query.handle);
        if (!handle) {
            return res.status(400).json({
                error: 'HANDLE_REQUIRED'
            });
        }

        const owner = await usersCollection.findOne({ handle });

        if (!owner) {
            return res.json({
                status: 'available'
            });
        }
        if (owner._id.equals(req.user._id)) {
            return res.json({
                status: 'current'
            });
        }
        return res.json({
            status: 'taken'
        });
    }

);

app.get('/api/profile/:handle', async (req, res) => {
    const handle = normalizeHandle(req.params.handle);

    const user = await usersCollection.findOne({ handle });

    if (!user) {
        return res.status(404).json({
            error: 'PROFILE_NOT_FOUND'
        })
    }
    
    res.json({
        handle: user.handle,
        displayName: user.displayName
    })

})
app.get('/api/list/anime', requireAuth, async (req, res) => {
    try {
        const anilistAccount = req.user.accounts?.anime?.anilist;

        if (!anilistAccount?.accessToken || !anilistAccount?.userId) {
            return res.status(409).json({
                error: 'ANILIST_NOT_CONNECTED'
            });
        }

        const entries = await getAnimeList(
            anilistAccount.userId, 
            anilistAccount.accessToken
        );

        res.json({entries});
    } catch (error) {
        console.error('Failed to fetch AniList anime list:', error);

        res.status(502).json({
            error: 'ANILIST_LIST_REQUEST_FAILED'
        });
    }
});

app.patch('/api/list/anime/:entryId', requireAuth, async (req, res) => {
    const entryId = Number(req.params.entryId);

    if (!Number.isInteger(entryId) || entryId <= 0) {
        return res.status(400).json({
            error: 'INVALID_ANIME_ENTRY_ID'
        });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({
            error: 'INVALID_ANIME_UPDATE'
        });
    }

    const updateFields = Object.keys(req.body);

    if (
        updateFields.length === 0 ||
        updateFields.some((field) => !ANIME_UPDATE_FIELDS.has(field))
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_UPDATE'
        });
    }

    if (
        Object.hasOwn(req.body, 'status') &&
        !ANIME_STATUSES.has(req.body.status)
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_STATUS'
        });
    }

    if (
        Object.hasOwn(req.body, 'rating') &&
        req.body.rating !== null &&
        (!Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 10)
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_RATING'
        });
    }

    if (
        Object.hasOwn(req.body, 'progress') &&
        (!Number.isInteger(req.body.progress) || req.body.progress < 0)
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_PROGRESS'
        });
    }

    if (
        Object.hasOwn(req.body, 'startedAt') &&
        !isValidAnimeDate(req.body.startedAt)
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_START_DATE'
        });
    }

    if (
        Object.hasOwn(req.body, 'completedAt') &&
        !isValidAnimeDate(req.body.completedAt)
    ) {
        return res.status(400).json({
            error: 'INVALID_ANIME_COMPLETION_DATE'
        });
    }

    const anilistAccount = req.user.accounts?.anime?.anilist;

    if (!anilistAccount?.accessToken || !anilistAccount?.userId) {
        return res.status(409).json({
            error: 'ANILIST_NOT_CONNECTED'
        });
    }

    try {
        const updates = { ...req.body };

        if (updates.startedAt === null) {
            updates.startedAt = { year: null, month: null, day: null };
        }
        if (updates.completedAt === null) {
            updates.completedAt = { year: null, month: null, day: null };
        }

        const entry = await updateAnimeEntry(
            entryId,
            updates,
            anilistAccount.accessToken
        );

        if (!entry) {
            throw new Error('AniList returned no updated entry');
        }

        res.json({ entry });
    } catch (error) {
        console.error('Failed to update AniList anime entry:', error);

        res.status(502).json({
            error: 'ANILIST_ENTRY_UPDATE_FAILED'
        });
    }
});


async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }

}
startServer();
