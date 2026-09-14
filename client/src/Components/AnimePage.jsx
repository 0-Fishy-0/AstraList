import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AuthContext } from '../App.jsx';
import AstraBackground from './AstraBackground.jsx';
import LoadingPage from './LoadingPage.jsx';
import './Styles/AnimePage.css';

const ANIME_LIST_STATUSES = [
    { value: 'watching', label: 'Watching' },
    { value: 'planning', label: 'Planning' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On hold' },
    { value: 'dropped', label: 'Dropped' }
];

function formatAnimeValue(value) {
    if (!value) return 'Unknown';

    return value
        .split('_')
        .map((word) =>
            ['TV', 'OVA', 'ONA'].includes(word)
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
}

function AnimeRelationLink({ relation }) {
    const coverRef = useRef(null);
    const [tooltipSide, setTooltipSide] = useState('right');

    function updateTooltipSide() {
        const cover = coverRef.current;

        if (!cover) return;

        const coverBounds = cover.getBoundingClientRect();
        const preferredWidth = 13 * parseFloat(getComputedStyle(document.documentElement).fontSize);
        const availableLeftSpace = coverBounds.left;
        const availableRightSpace = document.documentElement.clientWidth - coverBounds.right;
        const opensRight =
            availableRightSpace >= preferredWidth ||
            availableRightSpace >= availableLeftSpace;

        setTooltipSide(opensRight ? 'right' : 'left');
    }

    useEffect(() => {
        window.addEventListener('resize', updateTooltipSide);
        return () => window.removeEventListener('resize', updateTooltipSide);
    });

    return (
        <Link
            className="anime-relation"
            to={`/anime/${relation.mediaId}`}
            aria-label={`${formatAnimeValue(relation.relation)}: ${relation.title}`}
            data-tooltip-side={tooltipSide}
            onMouseEnter={updateTooltipSide}
            onFocus={updateTooltipSide}
        >
            <div ref={coverRef} className="anime-relation-cover">
                {relation.coverImage && (
                    <img src={relation.coverImage} alt="" loading="lazy" />
                )}
                <span className="anime-relation-type">
                    {formatAnimeValue(relation.relation)}
                </span>
            </div>
            <div className="anime-relation-details" aria-hidden="true">
                <div className="anime-relation-details-surface">
                    <h3>{relation.title}</h3>
                    <p>
                        {formatAnimeValue(relation.format)} ·{' '}
                        {formatAnimeValue(relation.airingStatus)}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function AnimePage() {
    const { mediaId } = useParams();
    const navigate = useNavigate();
    const { user, authStatus, setUser, setAuthStatus } = useContext(AuthContext);
    const [anime, setAnime] = useState(null);
    const [animeStatus, setAnimeStatus] = useState('loading');
    const [listEntry, setListEntry] = useState(null);
    const [listEntryStatus, setListEntryStatus] = useState('idle');
    const [listMutationStatus, setListMutationStatus] = useState('idle');
    const [listError, setListError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAnime() {
            try {
                setAnime(null);
                setAnimeStatus('loading');

                const response = await fetch(
                    `http://localhost:3000/api/anime/${mediaId}`,
                    { signal: controller.signal }
                );

                if (response.status === 404) {
                    setAnimeStatus('not_found');
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Anime fetch failed: ${response.status}`);
                }

                const data = await response.json();
                if (!data.anime) {
                    throw new Error('Invalid anime response');
                }

                setAnime(data.anime);
                setAnimeStatus('success');
            } catch (error) {
                if (error.name === 'AbortError') return;

                console.error('Error fetching anime details:', error);
                setAnimeStatus('error');
            }
        }

        fetchAnime();
        return () => controller.abort();
    }, [mediaId]);

    useEffect(() => {
        if (authStatus !== 'authenticated' || !user) {
            return;
        }

        const controller = new AbortController();

        async function fetchListEntry() {
            try {
                setListEntry(null);
                setListEntryStatus('loading');
                setListError(null);

                const response = await fetch(
                    `http://localhost:3000/api/list/anime/media/${mediaId}`,
                    {
                        credentials: 'include',
                        signal: controller.signal
                    }
                );

                if (response.status === 401) {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Anime list entry fetch failed: ${response.status}`);
                }

                const data = await response.json();
                const entry = data.entry;

                if (
                    entry !== null &&
                    (!Number.isInteger(entry?.id) ||
                        !ANIME_LIST_STATUSES.some(({ value }) => value === entry.status))
                ) {
                    throw new Error('Invalid anime list entry response');
                }

                setListEntry(entry);
                setListEntryStatus('ready');
            } catch (error) {
                if (error.name === 'AbortError') return;

                console.error('Error fetching anime list entry:', error);
                setListEntryStatus('error');
                setListError('Unable to load your list status.');
            }
        }

        fetchListEntry();
        return () => controller.abort();
    }, [authStatus, mediaId, setAuthStatus, setUser, user]);

    async function saveListStatus(nextStatus) {
        if (listMutationStatus !== 'idle' || listEntryStatus !== 'ready') return;

        if (listEntry?.status === nextStatus) {
            document.getElementById('anime-list-status-menu')?.hidePopover();
            return;
        }

        try {
            setListMutationStatus('saving');
            setListError(null);

            const response = await fetch(
                listEntry
                    ? `http://localhost:3000/api/list/anime/${listEntry.id}`
                    : 'http://localhost:3000/api/list/anime',
                {
                    method: listEntry ? 'PATCH' : 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(
                        listEntry
                            ? { status: nextStatus }
                            : { mediaId: Number(mediaId), status: nextStatus }
                    )
                }
            );

            if (response.status === 401) {
                setUser(null);
                setAuthStatus('unauthenticated');
                navigate('/');
                return;
            }
            if (!response.ok) {
                throw new Error(`Anime list entry save failed: ${response.status}`);
            }

            const data = await response.json();

            if (
                !Number.isInteger(data.entry?.id) ||
                !ANIME_LIST_STATUSES.some(({ value }) => value === data.entry.status)
            ) {
                throw new Error('Invalid anime list entry save response');
            }

            setListEntry(data.entry);
            document.getElementById('anime-list-status-menu')?.hidePopover();
        } catch (error) {
            console.error('Error saving anime list entry:', error);
            setListError('Unable to update your list. Try again.');
        } finally {
            setListMutationStatus('idle');
        }
    }

    async function removeListEntry() {
        if (!listEntry || listMutationStatus !== 'idle') return;

        try {
            setListMutationStatus('removing');
            setListError(null);

            const response = await fetch(
                `http://localhost:3000/api/list/anime/${listEntry.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            if (response.status === 401) {
                setUser(null);
                setAuthStatus('unauthenticated');
                navigate('/');
                return;
            }
            if (!response.ok) {
                throw new Error(`Anime list entry removal failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.deleted !== true) {
                throw new Error('Invalid anime list entry removal response');
            }

            document.getElementById('anime-list-remove-confirmation')?.hidePopover();
            setListEntry(null);
        } catch (error) {
            console.error('Error removing anime list entry:', error);
            setListError('Unable to remove this anime. Try again.');
        } finally {
            setListMutationStatus('idle');
        }
    }

    const isAuthenticated = authStatus === 'authenticated' && user;
    const isListBusy = listEntryStatus === 'loading' || listMutationStatus !== 'idle';
    const currentListLabel = ANIME_LIST_STATUSES.find(
        ({ value }) => value === listEntry?.status
    )?.label;

    if (animeStatus === 'loading') {
        return <LoadingPage text="Loading Anime Details..." />;
    }

    if (animeStatus === 'not_found') {
        return ( // FOR AGENTS:- CHANGE THIS TO NOT-FOUND PAGE WHEN IMPLEMENTED.
            <main className="anime-page anime-page-state">
                <AstraBackground />
                <p>Anime not found.</p>
            </main>
        );
    }

    if (animeStatus === 'error') {
        return ( // FOR AGENTS:- CHANGE THIS TO ERROR PAGE WHEN IMPLEMENTED.
            <main className="anime-page anime-page-state">
                <AstraBackground />
                <p role="alert">Unable to load this anime. Please try again later.</p>
            </main>
        );
    }

    return (
        <main className="anime-page">
            <AstraBackground />
            {anime.bannerImage && (
                <div className="anime-page-banner" aria-hidden="true">
                    {/* <img src={anime.bannerImage} alt="" /> */}
                    <img src="/src/assets/temp-banner.jpg" alt="" /> {/* Agent- use this for now. Center it in css */}
                </div>
            )}

            <div className="anime-page-content">
                <header className="anime-page-overview">
                    <div className="anime-page-cover">
                        {anime.coverImage && (
                            <img src={anime.coverImage} alt={`${anime.title} cover`} />
                        )}
                    </div>

                    <div className="anime-page-intro">
                        <div className="anime-page-title">
                            <p className="anime-page-eyebrow">ASTRALIST ANIME</p>
                            <h1>{anime.title}</h1>
                        </div>

                        <div
                            className="anime-page-list-control"
                            data-listed={Boolean(listEntry)}
                        >
                            {!isAuthenticated ? (
                                <button
                                    className="anime-page-list-button anime-page-list-button-single"
                                    type="button"
                                    onClick={() => navigate('/')}
                                >
                                    Add to list
                                </button>
                            ) : listEntry ? (
                                <div className="anime-page-list-active">
                                    <button
                                        className="anime-page-list-button anime-page-list-button-single"
                                        type="button"
                                        popoverTarget="anime-list-status-menu"
                                        disabled={isListBusy || listEntryStatus === 'error'}
                                    >
                                        <span>{listMutationStatus === 'saving' ? 'Saving...' : currentListLabel}</span>
                                        <span className="anime-page-list-chevron" aria-hidden="true">&gt;</span>
                                    </button>
                                    <button
                                        className="anime-page-list-button anime-page-list-remove-toggle"
                                        type="button"
                                        aria-label="Remove from list"
                                        popoverTarget="anime-list-remove-confirmation"
                                        disabled={isListBusy}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="anime-page-list-split">
                                    <button
                                        className="anime-page-list-button anime-page-list-primary"
                                        type="button"
                                        disabled={isListBusy || listEntryStatus === 'error'}
                                        onClick={() => saveListStatus('planning')}
                                    >
                                        {listMutationStatus === 'saving' ? 'Adding...' : 'Add to list'}
                                    </button>
                                    <button
                                        className="anime-page-list-button anime-page-list-menu-toggle"
                                        type="button"
                                        aria-label="Choose initial list category"
                                        popoverTarget="anime-list-status-menu"
                                        disabled={isListBusy || listEntryStatus === 'error'}
                                    >
                                        <span className="anime-page-list-chevron" aria-hidden="true">&gt;</span>
                                    </button>
                                </div>
                            )}

                            {isAuthenticated && (
                                <div
                                    id="anime-list-status-menu"
                                    className="anime-page-list-menu"
                                    popover="auto"
                                    aria-label="Choose list category"
                                >
                                    {ANIME_LIST_STATUSES.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={listEntry?.status === value}
                                            disabled={listMutationStatus !== 'idle'}
                                            onClick={() => saveListStatus(value)}
                                        >
                                            <span>{label}</span>
                                            {listEntry?.status === value && (
                                                <span aria-hidden="true">Current</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isAuthenticated && listEntry && (
                                <div
                                    id="anime-list-remove-confirmation"
                                    className="anime-page-list-remove-confirmation"
                                    popover="auto"
                                    aria-label="Confirm removal"
                                >
                                    <p>Remove from list?</p>
                                    <div>
                                        <button
                                            type="button"
                                            popoverTarget="anime-list-remove-confirmation"
                                            popoverTargetAction="hide"
                                            disabled={listMutationStatus === 'removing'}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={listMutationStatus === 'removing'}
                                            onClick={removeListEntry}
                                        >
                                            {listMutationStatus === 'removing' ? 'Removing...' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isAuthenticated && listError && <p role="alert">{listError}</p>}
                        </div>

                        <dl className="anime-page-facts">
                            <div>
                                <dt>Format</dt>
                                <dd>{formatAnimeValue(anime.format)}</dd>
                            </div>
                            <div>
                                <dt>Episodes</dt>
                                <dd>{anime.totalEpisodes ?? 'Unknown'}</dd>
                            </div>
                            <div>
                                <dt>Airing status</dt>
                                <dd>{formatAnimeValue(anime.airingStatus)}</dd>
                            </div>
                            <div>
                                <dt>Studio</dt>
                                <dd>
                                    {anime.studios.length > 0
                                        ? anime.studios.map((studio) => studio.name).join(', ')
                                        : 'Unknown'}
                                </dd>
                            </div>
                        </dl>

                        {anime.genres.length > 0 && (
                            <div className="anime-page-genres" aria-label="Genres">
                                {anime.genres.map((genre) => (
                                    <span key={genre}>{genre}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </header>
                <section className="anime-page-section">
                    {anime.relations.length > 0 && (
                        <div className='anime-page-subsection'>
                        <h2>Relations</h2>
                        <div
                            className="anime-relation-preview"
                            aria-label="Related anime preview"
                        >
                            {anime.relations.map((relation) => (
                                <AnimeRelationLink
                                    key={`${relation.relation}-${relation.mediaId}`}
                                    relation={relation}
                                />
                            ))}
                        </div>
                        </div>
                    )}
                    
                    <div className='anime-page-subsection'>
                        <h2>Synopsis</h2>
                        <p className="anime-page-description">
                            {anime.description || 'No synopsis is available for this anime.'}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default AnimePage;
