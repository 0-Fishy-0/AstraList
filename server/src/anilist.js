const ANILIST_API_URL = 'https://graphql.anilist.co';

export async function requestAniList(query, variables, accessToken) {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers,
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
        const error = new Error(message);

        error.status = result.errors?.[0]?.status ?? response.status;
        throw error;
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
const ANIME_DETAILS_QUERY = `
    query AnimeDetails($mediaId: Int!) {
        Media(id: $mediaId, type: ANIME) {
            id
            title {
                userPreferred
            }
            description(asHtml: false)
            bannerImage
            coverImage {
                extraLarge
            }
            genres
            format
            episodes
            status
            studios(isMain: true) {
                nodes {
                    id
                    name
                }
            }
            relations {
                edges {
                    relationType(version: 2)
                    node {
                        id
                        type
                        title {
                            userPreferred
                        }
                        coverImage {
                            medium
                        }
                        format
                        status
                    }
                }
            }
        }
    }
`;
const ANIME_LIST_ENTRY_QUERY = `
    query AnimeListEntry($mediaId: Int!, $userId: Int!) {
        MediaList(mediaId: $mediaId, userId: $userId, type: ANIME) {
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
const CREATE_ANIME_ENTRY_MUTATION = `
    mutation CreateAnimeEntry($mediaId: Int!, $status: MediaListStatus!) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status) {
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
const DELETE_ANIME_ENTRY_MUTATION = `
    mutation DeleteAnimeEntry($entryId: Int!) {
        DeleteMediaListEntry(id: $entryId) {
            deleted
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

function normalizeAnimeEntry(entry) {
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

export async function getAnimeDetails(mediaId) {
    const data = await requestAniList(
        ANIME_DETAILS_QUERY,
        { mediaId }
    );
    const media = data?.Media;

    if (!media) return null;

    return {
        mediaId: media.id,
        title: media.title.userPreferred,
        description: media.description ?? null,
        bannerImage: media.bannerImage ?? null,
        coverImage: media.coverImage?.extraLarge ?? null,
        genres: media.genres ?? [],
        format: media.format ?? null,
        totalEpisodes: media.episodes ?? null,
        airingStatus: media.status ?? null,
        studios: (media.studios?.nodes ?? []).map((studio) => ({
            id: studio.id,
            name: studio.name
        })),
        relations: (media.relations?.edges ?? [])
            .filter((edge) => edge?.node?.type === 'ANIME')
            .map((edge) => ({
                mediaId: edge.node.id,
                relation: edge.relationType,
                title: edge.node.title.userPreferred,
                coverImage: edge.node.coverImage?.medium ?? null,
                format: edge.node.format ?? null,
                airingStatus: edge.node.status ?? null
            }))
    };
}

export async function getAnimeListEntry(mediaId, userId, accessToken) {
    try {
        const data = await requestAniList(
            ANIME_LIST_ENTRY_QUERY,
            { mediaId, userId },
            accessToken
        );

        return normalizeAnimeEntry(data?.MediaList);
    } catch (error) {
        if (error.status === 404) return null;

        throw error;
    }
}

export async function createAnimeEntry(mediaId, status, accessToken) {
    const data = await requestAniList(
        CREATE_ANIME_ENTRY_MUTATION,
        {
            mediaId,
            status: ASTRALIST_STATUS_MAP[status]
        },
        accessToken
    );

    return normalizeAnimeEntry(data?.SaveMediaListEntry);
}

export async function deleteAnimeEntry(entryId, accessToken) {
    const data = await requestAniList(
        DELETE_ANIME_ENTRY_MUTATION,
        { entryId },
        accessToken
    );

    return data?.DeleteMediaListEntry?.deleted === true;
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

    return normalizeAnimeEntry(data?.SaveMediaListEntry);
}
