const ANILIST_API_URL = 'https://graphql.anilist.co';

export async function requestAniList(query, variables, accessToken) {
    const response = await fetch(ANILIST_API_URL, {
        method: 'POST',

        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },

        body: JSON.stringify({
            query,
            variables
        })
    });

    const result = await response.json();

    if (!response.ok || result.errors?.length) {
        const message =
            result.errors?.map((error) => error.message).join(', ') ||
            `AniList request failed with status ${response.status}`;

        throw new Error(message);
    }

    return result.data;
}

const ANIME_LIST_QUERY = `
    query AnimeList($userId: Int!) {
        MediaListCollection(
            userId: $userId
            type: ANIME
        ) {
            lists {
                status
                entries {
                    id
                    status
                    score(format: POINT_10)
                    progress

                    startedAt {
                        year
                        month
                        day
                    }

                    completedAt {
                        year
                        month
                        day
                    }

                    media {
                        id

                        title {
                            userPreferred
                        }

                        coverImage {
                            medium
                        }

                        genres
                        format
                        episodes
                    }
                }
            }
        }
    }
`;
const UPDATE_ANIME_ENTRY_MUTATION = `
    mutation UpdateAnimeEntry(
        $entryId: Int!
        $status: MediaListStatus
        $scoreRaw: Int
        $progress: Int
        $startedAt: FuzzyDateInput
        $completedAt: FuzzyDateInput
    ) {
        SaveMediaListEntry(
            id: $entryId
            status: $status
            scoreRaw: $scoreRaw
            progress: $progress
            startedAt: $startedAt
            completedAt: $completedAt
        ) {
            id
            status
            score(format: POINT_10)
            progress

            startedAt {
                year
                month
                day
            }

            completedAt {
                year
                month
                day
            }
        }
    }
`;

const ANILIST_STATUS_MAP = {
    CURRENT: 'watching',
    COMPLETED: 'completed',
    PAUSED: 'on-hold',
    DROPPED: 'dropped',
    PLANNING: 'planning',
    REPEATING: 'watching'
};
const ASTRALIST_STATUS_MAP = {
    watching: 'CURRENT',
    completed: 'COMPLETED',
    'on-hold': 'PAUSED',
    dropped: 'DROPPED',
    planning: 'PLANNING'
};

export async function getAnimeList(userId, accessToken) {

    const data = await requestAniList(
        ANIME_LIST_QUERY,
        { userId },
        accessToken
    );

    const lists = data?.MediaListCollection?.lists ?? [];

    return (
        lists
        .filter(list => (ANILIST_STATUS_MAP[list?.status]))
        .flatMap(list => 
            (list.entries ?? []).filter(entry => entry?.media)
            .map(entry => ({
                id: entry.id,
                mediaId: entry.media.id,
                title: entry.media.title.userPreferred,
                coverImage: entry.media.coverImage?.medium ?? null,
                tags: entry.media.genres ?? [],
                format: entry.media.format,
                status: ANILIST_STATUS_MAP[entry.status],
                rating: entry.score === 0 ? null : entry.score,
                progress: entry.progress,
                totalEpisodes: entry.media.episodes,
                startedAt: entry.startedAt,
                completedAt: entry.completedAt
            }))
        )
    );
}

export async function updateAnimeEntry(entryId, updates, accessToken) {
    const variables = { entryId };

    if (Object.hasOwn(updates, 'status')) {
        variables.status = ASTRALIST_STATUS_MAP[updates.status];
    }
    if (Object.hasOwn(updates, 'rating')) {
        variables.scoreRaw = updates.rating === null ? 0 : updates.rating * 10;
    }
    if (Object.hasOwn(updates, 'progress')) {
        variables.progress = updates.progress;
    }
    if (Object.hasOwn(updates, 'startedAt')) {
        variables.startedAt = updates.startedAt;
    }
    if (Object.hasOwn(updates, 'completedAt')) {
        variables.completedAt = updates.completedAt;
    }

    const data = await requestAniList(
        UPDATE_ANIME_ENTRY_MUTATION,
        variables,
        accessToken
    );

    const entry = data.SaveMediaListEntry;

    if (!entry) return null;

    return {
        id: entry.id,
        status: ANILIST_STATUS_MAP[entry.status],
        rating: entry.score === 0 ? null : entry.score,
        progress: entry.progress,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt
    };
}
