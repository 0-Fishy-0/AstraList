import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnimeEntry, deleteAnimeEntry, getAnimeListEntry } from './anilist.js';

function mockAniListResponse(data) {
    const originalFetch = globalThis.fetch;
    let requestBody;

    globalThis.fetch = async (_url, options) => {
        requestBody = JSON.parse(options.body);

        return {
            ok: true,
            json: async () => ({ data })
        };
    };

    return {
        getRequestBody: () => requestBody,
        restore: () => {
            globalThis.fetch = originalFetch;
        }
    };
}

test('gets and normalizes an anime list entry by media ID', async () => {
    const mock = mockAniListResponse({
        MediaList: {
            id: 42,
            status: 'CURRENT',
            score: 8,
            progress: 3,
            startedAt: { year: 2026, month: 9, day: 1 },
            completedAt: { year: null, month: null, day: null }
        }
    });

    try {
        const entry = await getAnimeListEntry(269, 7, 'secret-token');
        const request = mock.getRequestBody();

        assert.deepEqual(request.variables, { mediaId: 269, userId: 7 });
        assert.match(request.query, /MediaList\s*\(/);
        assert.deepEqual(entry, {
            id: 42,
            status: 'watching',
            rating: 8,
            progress: 3,
            startedAt: { year: 2026, month: 9, day: 1 },
            completedAt: { year: null, month: null, day: null }
        });
    } finally {
        mock.restore();
    }
});

test('returns null when the anime is not on the viewer list', async () => {
    const mock = mockAniListResponse({ MediaList: null });

    try {
        assert.equal(await getAnimeListEntry(269, 7, 'secret-token'), null);
    } finally {
        mock.restore();
    }
});

test('returns null when AniList reports that the list entry was not found', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        json: async () => ({
            data: { MediaList: null },
            errors: [{ message: 'Not Found.', status: 404 }]
        })
    });

    try {
        assert.equal(await getAnimeListEntry(269, 7, 'secret-token'), null);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('creates an anime list entry by media ID and status', async () => {
    const mock = mockAniListResponse({
        SaveMediaListEntry: {
            id: 84,
            status: 'PLANNING',
            score: 0,
            progress: 0,
            startedAt: { year: null, month: null, day: null },
            completedAt: { year: null, month: null, day: null }
        }
    });

    try {
        const entry = await createAnimeEntry(269, 'planning', 'secret-token');
        const request = mock.getRequestBody();

        assert.deepEqual(request.variables, {
            mediaId: 269,
            status: 'PLANNING'
        });
        assert.match(request.query, /SaveMediaListEntry\s*\(/);
        assert.deepEqual(entry, {
            id: 84,
            status: 'planning',
            rating: null,
            progress: 0,
            startedAt: { year: null, month: null, day: null },
            completedAt: { year: null, month: null, day: null }
        });
    } finally {
        mock.restore();
    }
});

test('deletes an anime list entry by entry ID', async () => {
    const mock = mockAniListResponse({
        DeleteMediaListEntry: { deleted: true }
    });

    try {
        const deleted = await deleteAnimeEntry(42, 'secret-token');
        const request = mock.getRequestBody();

        assert.deepEqual(request.variables, { entryId: 42 });
        assert.match(request.query, /DeleteMediaListEntry\s*\(/);
        assert.equal(deleted, true);
    } finally {
        mock.restore();
    }
});
