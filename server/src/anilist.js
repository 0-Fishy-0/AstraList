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

const ANILIST_STATUS_MAP = {
    CURRENT: 'watching',
    COMPLETED: 'completed',
    PAUSED: 'on-hold',
    DROPPED: 'dropped',
    PLANNING: 'planning',
    REPEATING: 'watching'
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