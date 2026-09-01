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

connectToDatabase();

function generateDefaultHandle() {
    return `user${randomInt(1_000_000_000, 10_000_000_000)}`;
}
function normalizeHandle(handle) {
    return handle.trim().toLowerCase();
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
    
    const query = `
        query {
            Viewer {
                id
                name
            }
        }
    `;
   
    const viewerResponse = await fetch('https://graphql.anilist.co', {
        method: 'POST',

        headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },

        body: JSON.stringify({
            query: query
        })
    })

    const viewerData = await viewerResponse.json();
    const viewer = viewerData.data.Viewer;

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

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});