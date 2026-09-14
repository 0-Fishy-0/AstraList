// =============================================================================
// ======================== DEVELOPMENT-ONLY ANIME DATA =========================
// =============================================================================
//
// THIS FILE CONTAINS FAKE PROVIDER RESPONSES FOR LOCAL UI DEVELOPMENT ONLY.
// IT MUST NEVER BECOME A PRODUCTION FALLBACK OR BE TREATED AS REAL ANILIST DATA.
//
// Fixture mode is enabled only when BOTH conditions are true:
//   1. NODE_ENV is not "production"
//   2. USE_ANIME_FIXTURES is exactly "true"
//
// Turning fixture mode off must always restore the real AniList request path.
// Keep these objects aligned with AstraList's normalized API response, not with
// AniList's raw GraphQL response. The artificial delay exists so LoadingPage can
// be inspected while working locally.
//
// =============================================================================

export const ANIME_FIXTURE_DELAY_MS = 500;

function createBleachMovieFixture(mediaId, title, totalEpisodes = 1) {
    return {
        mediaId,
        title,
        description: `A development-only synopsis for ${title}.`,
        bannerImage: null,
        coverImage: null,
        genres: ['Action', 'Adventure', 'Supernatural'],
        format: 'MOVIE',
        totalEpisodes,
        airingStatus: 'FINISHED',
        studios: [{ id: 1, name: 'Studio Pierrot' }],
        relations: [
            {
                mediaId: 269,
                relation: 'PARENT',
                title: 'Bleach',
                coverImage: 'https://placehold.co/300x450/4B3A5F/EDE8F5?text=Bleach',
                format: 'TV',
                airingStatus: 'FINISHED'
            }
        ]
    };
}

const ANIME_DETAILS_FIXTURES = {
    269: {
        mediaId: 269,
        title: 'Bleach',
        description: 'Ichigo Kurosaki has always been able to see ghosts, but his life changes when he meets Rukia Kuchiki, a Soul Reaper charged with protecting the living world from dangerous spirits.',
        bannerImage: 'https://placehold.co/1600x600/281E36/EDE8F5?text=Bleach+Banner',
        coverImage: 'https://placehold.co/600x900/4B3A5F/EDE8F5?text=Bleach',
        genres: ['Action', 'Adventure', 'Supernatural'],
        format: 'TV',
        totalEpisodes: 366,
        airingStatus: 'FINISHED',
        studios: [{ id: 1, name: 'Studio Pierrot' }],
        relations: [
            {
                mediaId: 116674,
                relation: 'SEQUEL',
                title: 'Bleach: Thousand-Year Blood War',
                coverImage: 'https://placehold.co/300x450/3A244D/EDE8F5?text=TYBW',
                format: 'TV',
                airingStatus: 'FINISHED'
            },
            {
                mediaId: 1686,
                relation: 'SIDE_STORY',
                title: 'Bleach: Memories of Nobody',
                coverImage: null,
                format: 'MOVIE',
                airingStatus: 'FINISHED'
            },
            {
                mediaId: 2889,
                relation: 'SIDE_STORY',
                title: 'Bleach: The DiamondDust Rebellion',
                coverImage: null,
                format: 'MOVIE',
                airingStatus: 'FINISHED'
            },
            {
                mediaId: 4835,
                relation: 'SIDE_STORY',
                title: 'Bleach: Fade to Black',
                coverImage: null,
                format: 'MOVIE',
                airingStatus: 'FINISHED'
            },
            {
                mediaId: 8247,
                relation: 'SIDE_STORY',
                title: 'Bleach: Hell Verse',
                coverImage: null,
                format: 'MOVIE',
                airingStatus: 'FINISHED'
            }
        ]
    },
    116674: {
        mediaId: 116674,
        title: 'Bleach: Thousand-Year Blood War',
        description: 'The final battle begins as the Soul Society faces an enemy from its buried past.',
        bannerImage: 'https://placehold.co/1600x600/1E1729/E67AB8?text=Thousand-Year+Blood+War',
        coverImage: 'https://placehold.co/600x900/3A244D/EDE8F5?text=Bleach+TYBW',
        genres: ['Action', 'Adventure', 'Supernatural'],
        format: 'TV',
        totalEpisodes: 13,
        airingStatus: 'FINISHED',
        studios: [{ id: 1, name: 'Studio Pierrot' }],
        relations: [
            {
                mediaId: 269,
                relation: 'PREQUEL',
                title: 'Bleach',
                coverImage: 'https://placehold.co/300x450/4B3A5F/EDE8F5?text=Bleach',
                format: 'TV',
                airingStatus: 'FINISHED'
            },
            {
                mediaId: 159322,
                relation: 'SEQUEL',
                title: 'Bleach: Thousand-Year Blood War - The Separation',
                coverImage: null,
                format: 'TV',
                airingStatus: 'FINISHED'
            }
        ]
    },
    159322: {
        mediaId: 159322,
        title: 'Bleach: Thousand-Year Blood War - The Separation',
        description: null,
        bannerImage: null,
        coverImage: null,
        genres: ['Action', 'Adventure'],
        format: 'TV',
        totalEpisodes: null,
        airingStatus: 'FINISHED',
        studios: [],
        relations: [
            {
                mediaId: 116674,
                relation: 'PREQUEL',
                title: 'Bleach: Thousand-Year Blood War',
                coverImage: 'https://placehold.co/300x450/3A244D/EDE8F5?text=TYBW',
                format: 'TV',
                airingStatus: 'FINISHED'
            }
        ]
    },
    1686: createBleachMovieFixture(1686, 'Bleach: Memories of Nobody'),
    2889: createBleachMovieFixture(2889, 'Bleach: The DiamondDust Rebellion'),
    4835: createBleachMovieFixture(4835, 'Bleach: Fade to Black'),
    8247: createBleachMovieFixture(8247, 'Bleach: Hell Verse')
};

export function getAnimeDetailsFixture(mediaId) {
    return ANIME_DETAILS_FIXTURES[mediaId] ?? null;
}
