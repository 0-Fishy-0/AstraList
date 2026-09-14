import './Styles/AnimeListPage.css';
import { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from '../App.jsx';
import AL_RowItem from './AL_RowItem.jsx';
import LoadingPage from './LoadingPage.jsx';

const CATEGORIES = [
    { key: 'all', label: 'All Anime' },
    { key: 'watching', label: 'Watching' },
    { key: 'completed', label: 'Completed' },
    { key: 'on-hold', label: 'On Hold' },
    { key: 'dropped', label: 'Dropped' },
    { key: 'planning', label: 'Planning' }
]
const SEARCH_DEBOUNCE_MS = 200;

function doesTitleMatchSearch(title, query) {
    const titleWords = title.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const queryWords = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    let titleIndex = 0;

    for (const [queryIndex, queryWord] of queryWords.entries()) {
        const isFinalQueryWord = queryIndex === queryWords.length - 1;
        const matchingIndex = titleWords.findIndex((titleWord, index) =>
            index >= titleIndex &&
            (isFinalQueryWord
                ? titleWord.startsWith(queryWord)
                : titleWord === queryWord)
        );

        if (matchingIndex === -1) return false;
        titleIndex = matchingIndex + 1;
    }

    return true;
}

function fuzzyDateToInputValue(date) {
    if (!date?.year || !date.month || !date.day) return '';
    const year = String(date.year).padStart(4, '0');
    const month = String(date.month).padStart(2, '0');
    const day = String(date.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function inputValueToFuzzyDate(value) {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
}
function hasFuzzyDateValue(date) {
    return Boolean(date && [date.year, date.month, date.day].some(Number.isInteger));
}
function formatFuzzyDate(date) {
    if (!date?.year) return '';

    const month = date.month ? String(date.month).padStart(2, '0') : '??';
    const day = date.day ? String(date.day).padStart(2, '0') : '??';
    return `${date.year}-${month}-${day}`;
}
function buildAnimeEntryUpdates(editTarget, editDraft, dirtyFields) {
    if (!editTarget || !editDraft) return {};

    const updates = {};
    const rating = editDraft.rating === '' ? null : Number(editDraft.rating);
    const progress = Number(editDraft.progress);
    const originalStartedAt = fuzzyDateToInputValue(editTarget.startedAt);
    const originalCompletedAt = fuzzyDateToInputValue(editTarget.completedAt);

    if (editDraft.status !== editTarget.status) updates.status = editDraft.status;
    if (rating !== editTarget.rating) updates.rating = rating;
    if (progress !== editTarget.progress) updates.progress = progress;
    const startedAtWasPartial = !originalStartedAt && hasFuzzyDateValue(editTarget.startedAt);
    const completedAtWasPartial = !originalCompletedAt && hasFuzzyDateValue(editTarget.completedAt);

    if (
        editDraft.startedAt !== originalStartedAt ||
        (startedAtWasPartial && dirtyFields.has('startedAt'))
    ) {
        updates.startedAt = inputValueToFuzzyDate(editDraft.startedAt);
    }
    if (
        editDraft.completedAt !== originalCompletedAt ||
        (completedAtWasPartial && dirtyFields.has('completedAt'))
    ) {
        updates.completedAt = inputValueToFuzzyDate(editDraft.completedAt);
    }

    return updates;
}

function AnimeListPage() {

    const { user, setUser, setAuthStatus } = useContext(AuthContext);
    const [animeList, setAnimeList] = useState([]);
    const [listStatus, setListStatus] = useState('loading');
    const [activeCategory, setActiveCategory] = useState('all');
    const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [ratingTargetId, setRatingTargetId] = useState(null);
    const [isRatingUpdating, setIsRatingUpdating] = useState(false);
    const [ratingUpdateError, setRatingUpdateError] = useState(null);
    const [progressUpdatingIds, setProgressUpdatingIds] = useState(() => new Set());
    const [listMutationError, setListMutationError] = useState(null);
    const [statusUpdatingEntryId, setStatusUpdatingEntryId] = useState(null);
    const [statusUpdateError, setStatusUpdateError] = useState(null);
    const [statusChangeObj, setStatusChangeObj] = useState({
        animeId: null,
        nextStatus: null,
        message: '', 
        accept: ''
    });
    const statusPromptRef = useRef(null);
    const statusPromptCancelRef = useRef(null);
    const categoriesRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchToggleRef = useRef(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [editDirtyFields, setEditDirtyFields] = useState(() => new Set());
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [editSaveError, setEditSaveError] = useState(null);
    const advanceEditDialogRef = useRef(null);

    const categoryAnime = animeList.filter((anime) =>
        activeCategory === 'all'
            ? true
            : anime.status === activeCategory
    );
    const visibleAnime = categoryAnime.filter((anime) =>
        doesTitleMatchSearch(anime.title, debouncedSearchQuery)
    );
    const editUpdates = buildAnimeEntryUpdates(editTarget, editDraft, editDirtyFields);
    const hasEditChanges = Object.keys(editUpdates).length > 0;
    const isStatusUpdating = statusUpdatingEntryId !== null;
    const areEntryMutationsLocked =
        progressUpdatingIds.size > 0 ||
        isRatingUpdating ||
        isStatusUpdating ||
        isEditSaving ||
        statusChangeObj.animeId !== null;

    function closeSearch() {
        setIsSearchOpen(false);
        setSearchInput('');
        setDebouncedSearchQuery('');
    }

    function handleSearchToggle() {
        if (isSearchOpen) {
            closeSearch();
            return;
        }

        setIsSearchOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
    }

    async function requestAnimeEntryUpdate(entryId, updates) {
        const response = await fetch(
            `http://localhost:3000/api/list/anime/${entryId}`,
            {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            }
        );

        if (response.status === 401) {
            setUser(null);
            setAuthStatus('unauthenticated');
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to update anime entry: ${response.status}`);
        }

        const data = await response.json();

        if (data.entry?.id !== entryId) {
            throw new Error('Invalid anime entry update response');
        }

        return data.entry;
    }

    function mergeConfirmedEntry(updatedEntry, updatedFields) {
        const confirmedUpdates = Object.fromEntries(
            updatedFields
                .filter((field) => Object.hasOwn(updatedEntry, field))
                .map((field) => [field, updatedEntry[field]])
        );

        setAnimeList((currentList) =>
            currentList.map((anime) =>
                anime.id === updatedEntry.id
                    ? { ...anime, ...confirmedUpdates }
                    : anime
            )
        );
    }

    function handleOpenRating(entryId) {
        if (areEntryMutationsLocked) return;

        setRatingTargetId(entryId);
        setRatingUpdateError(null);
    }

    async function handleRating(rating) {
        if (!ratingTargetId || isRatingUpdating) return;

        const entryId = ratingTargetId;
        setIsRatingUpdating(true);
        setRatingUpdateError(null);
        setListMutationError(null);

        try {
            const updatedEntry = await requestAnimeEntryUpdate(entryId, { rating });
            if (!updatedEntry) return;

            mergeConfirmedEntry(updatedEntry, ['rating']);
            document.getElementById('al-rating-popover')?.hidePopover();
        } catch (error) {
            console.error('Error updating anime rating:', error);
            setRatingUpdateError('Unable to update rating.');
            setListMutationError('Unable to update anime rating.');
        } finally {
            setIsRatingUpdating(false);
        }
    }

    async function handleIncrement(anime) {
        if (
            areEntryMutationsLocked ||
            anime.totalEpisodes != null &&
            anime.progress >= anime.totalEpisodes
        ) return;

        const nextProgress = anime.progress + 1;

        setListMutationError(null);
        setProgressUpdatingIds((currentIds) => {
            const nextIds = new Set(currentIds);
            nextIds.add(anime.id);
            return nextIds;
        });

        try {
            const updatedEntry = await requestAnimeEntryUpdate(
                anime.id,
                { progress: nextProgress }
            );
            if (!updatedEntry) return;

            if (!Number.isInteger(updatedEntry.progress)) {
                throw new Error('Invalid progress update response');
            }

            const confirmedProgress = updatedEntry.progress;
            mergeConfirmedEntry(updatedEntry, ['progress']);

            let nextStatus = null;

            if (
                (anime.status === 'planning' && confirmedProgress === 1) ||
                anime.status === 'on-hold' ||
                anime.status === 'dropped'
            ) {
                nextStatus = 'watching';
            }

            if (
                anime.totalEpisodes != null &&
                anime.status !== 'completed' &&
                confirmedProgress === anime.totalEpisodes
            ) {
                nextStatus = 'completed';
            }

            if (nextStatus) {
                setStatusUpdateError(null);
                setStatusChangeObj({
                    animeId: anime.id,
                    nextStatus,
                    message: nextStatus === 'completed'
                        ? 'Mark this anime as completed?'
                        : 'Move this anime to watching?',
                    accept: nextStatus === 'completed'
                        ? 'Mark as completed'
                        : 'Set as watching'
                });

                requestAnimationFrame(() => {
                    statusPromptRef.current?.showPopover();
                    statusPromptCancelRef.current?.focus();
                });
            }
        } catch (error) {
            console.error('Error updating anime progress:', error);
            setListMutationError(`Unable to update progress for ${anime.title}.`);
        } finally {
            setProgressUpdatingIds((currentIds) => {
                const nextIds = new Set(currentIds);
                nextIds.delete(anime.id);
                return nextIds;
            });
        }
    }

    async function handleStatusChangeOnIncrement() {
        if (!statusChangeObj.animeId || !statusChangeObj.nextStatus || isStatusUpdating) {
            return;
        }

        const entryId = statusChangeObj.animeId;
        const nextStatus = statusChangeObj.nextStatus;

        setStatusUpdatingEntryId(entryId);
        setStatusUpdateError(null);
        setListMutationError(null);

        try {
            const updatedEntry = await requestAnimeEntryUpdate(
                entryId,
                { status: nextStatus }
            );
            if (!updatedEntry) return;

            statusPromptRef.current?.hidePopover();
            resetStatusChangePrompt();
            mergeConfirmedEntry(updatedEntry, ['status']);
        } catch (error) {
            console.error('Error updating anime status:', error);
            setStatusUpdateError('Unable to update status. Try again.');
            setListMutationError('Unable to update anime status.');
        } finally {
            setStatusUpdatingEntryId(null);
        }
    }

    function resetStatusChangePrompt() {
        setStatusChangeObj({
            animeId: null,
            nextStatus: null,
            message: '',
            accept: ''
        });
        setStatusUpdateError(null);
    }

    function handleStatusPromptToggle(event) {
        if (event.newState === 'closed') {
            resetStatusChangePrompt();
        }
    }

    function handleOpenAdvanceEdit(anime) {
        if (areEntryMutationsLocked) return;

        setEditTarget(anime);
        setEditSaveError(null);
        setEditDirtyFields(new Set());

        setEditDraft({
            status: anime.status,
            rating: anime.rating ?? '',
            progress: anime.progress,
            startedAt: fuzzyDateToInputValue(anime.startedAt),
            completedAt: fuzzyDateToInputValue(anime.completedAt)
        });

        advanceEditDialogRef.current?.showModal();
    }
    function handleCloseAdvanceEdit() {
        if (isEditSaving) return;
        advanceEditDialogRef.current?.close();
    }

    function handleAdvanceEditClosed() {
        setEditTarget(null);
        setEditDraft(null);
        setEditDirtyFields(new Set());
        setEditSaveError(null);
    }

    function handleAdvanceEditCancel(event) {
        if (isEditSaving) event.preventDefault();
    }

    function handleEditFieldChange(event) {
        const { name, value } = event.target;

        setEditDirtyFields((currentFields) => {
            const nextFields = new Set(currentFields);
            nextFields.add(name);
            return nextFields;
        });

        setEditDraft((currentDraft) => ({
            ...currentDraft,
            [name]: value,
            ...(name === 'status' &&
                value === 'completed' &&
                editTarget?.totalEpisodes != null
                ? { progress: String(editTarget.totalEpisodes)}
                : {}
            )
        }));
    }

    function handleClearEditDate(field) {
        setEditDirtyFields((currentFields) => {
            const nextFields = new Set(currentFields);
            nextFields.add(field);
            return nextFields;
        });
        setEditDraft((currentDraft) => ({
            ...currentDraft,
            [field]: ''
        }));
    }
    async function handleSaveAdvanceEdit(event) {
        event.preventDefault();

        if (!editTarget || !editDraft || isEditSaving) return;

        const updates = buildAnimeEntryUpdates(editTarget, editDraft, editDirtyFields);

        if (Object.keys(updates).length === 0) {
            advanceEditDialogRef.current?.close();
            return;
        }

        setIsEditSaving(true);
        setEditSaveError(null);

        try {
            const updatedEntry = await requestAnimeEntryUpdate(editTarget.id, updates);
            if (!updatedEntry) return;

            advanceEditDialogRef.current?.close();
            mergeConfirmedEntry(updatedEntry, Object.keys(updates));
        } catch (error) {
            console.error('Error saving anime entry:', error);
            setEditSaveError('Unable to save these changes. Try again.');
        } finally {
            setIsEditSaving(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchQuery(searchInput);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        if (!isSearchOpen) return;

        function handleSearchEscape(event) {
            if (event.key !== 'Escape') return;

            setIsSearchOpen(false);
            setSearchInput('');
            setDebouncedSearchQuery('');
            requestAnimationFrame(() => searchToggleRef.current?.focus());
        }

        document.addEventListener('keydown', handleSearchEscape);
        return () => document.removeEventListener('keydown', handleSearchEscape);
    }, [isSearchOpen]);

    useEffect(() => {
        async function fetchAnimeList() {
            try {
                const response = await fetch(
                    'http://localhost:3000/api/list/anime', {
                    credentials: 'include'
                    }
                )
                if (response.status === 401) {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Failed to fetch anime list: ${response.status}`);
                }
                const data = await response.json();
                if (!Array.isArray(data.entries)) {
                    throw new Error('Invalid response format: entries is not an array');
                }
                setAnimeList(data.entries);
                setListStatus('success');
            }
            catch (error) {
                console.error('Error fetching anime list:', error);
                setListStatus('error');
            }
        }

        fetchAnimeList();
    }, [setUser, setAuthStatus]);

    useEffect(() => {
        if (listStatus !== 'success') return;

        const categories = categoriesRef.current;
        if (!categories) return;

        function updateCategoryOverflow() {
            const remainingScroll =
                categories.scrollWidth - categories.clientWidth - categories.scrollLeft;

            setCanScrollCategoriesRight(remainingScroll > 1);
        }

        updateCategoryOverflow();

        const resizeObserver = new ResizeObserver(updateCategoryOverflow);
        resizeObserver.observe(categories);
        categories.addEventListener('scroll', updateCategoryOverflow, { passive: true });

        return () => {
            resizeObserver.disconnect();
            categories.removeEventListener('scroll', updateCategoryOverflow);
        };
    }, [listStatus]);

    if (listStatus === 'loading') {
        return <LoadingPage text='Loading Anime List...'/>;
    }
    if (listStatus === 'error') {
        return ( // FOR AGENTS:- CHANGE THIS TO ERROR PAGE WHEN IMPLEMENTED.
            <main className="anime-list-page"> {/* Placeholder */}
                <p className="al-list-state" role="alert">
                    Unable to load your anime list.
                </p>
            </main>
        )
    }

    return (
        <main className='anime-list-page'>
            <section className="al-banner"></section>
            <section className="al-all-content">
                <section className="al-category-bar">
                    <div className="al-avatar-wrapper">
                        <span>{user.displayName.charAt(0).toUpperCase()}</span>
                        {/* Insert Image Later */}
                    </div>
                        <div className="al-categories-scroll-wrapper">
                            <div
                                ref={categoriesRef}
                                className="al-categories"
                                data-active-category={activeCategory}
                            >
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category.key}
                                        data-category={category.key}
                                        aria-pressed={activeCategory === category.key}
                                        className={`al-category ${
                                            activeCategory === category.key ? 'active' : ''
                                        }`}
                                        onClick={() => setActiveCategory(category.key)}
                                    >
                                        <span>{category.label}</span>
                                    </button>
                                ))}
                            </div>
                            {canScrollCategoriesRight && (
                                <span className="al-categories-overflow-indicator" aria-hidden="true">
                                    &gt;
                                </span>
                            )}
                        </div>
                        <div
                            className="al-search"
                            data-open={isSearchOpen}
                            role="search"
                        >
                            <input
                                ref={searchInputRef}
                                id="al-anime-search"
                                type="search"
                                value={searchInput}
                                placeholder="Search current category"
                                autoComplete="off"
                                spellCheck="false"
                                disabled={!isSearchOpen}
                                aria-label="Search anime in the current category"
                                onChange={(event) => setSearchInput(event.target.value)}
                            />
                            <button
                                ref={searchToggleRef}
                                type="button"
                                aria-controls="al-anime-search"
                                aria-expanded={isSearchOpen}
                                aria-label={isSearchOpen ? 'Close anime search' : 'Open anime search'}
                                onClick={handleSearchToggle}
                            >
                                <img src="/src/assets/search-icon.svg" alt="" />
                            </button>
                        </div>
                </section>
                <section className="al-toolbar">
                    <button className="al-toolbar-item" disabled>T</button>
                    <button className="al-toolbar-item" disabled>E</button>
                    <button className="al-toolbar-item" disabled>M</button>
                    <button className="al-toolbar-item" disabled>P</button>
                    <button className="al-toolbar-item" disabled>R</button>
                </section>
                {listMutationError && (
                    <p className="al-progress-update-error" role="alert">
                        {listMutationError}
                    </p>
                )}
                <section className="al-content" data-category={activeCategory}>
                    {animeList.length === 0 ? (
                        <p className="al-list-state">
                            Your anime list is empty.
                        </p>
                    ) : categoryAnime.length === 0 ? (
                        <p className="al-list-state">
                            No anime in this category.
                        </p>
                    ) : visibleAnime.length === 0 ? (
                        <p className="al-list-state" role="status">
                            No anime match &ldquo;{debouncedSearchQuery.trim()}&rdquo;.
                        </p>
                    ) : (
                        visibleAnime.map((anime) => (
                            <AL_RowItem
                                key={anime.id}
                                anime={anime}
                                handleIncrement={handleIncrement}
                                setRatingTargetId={handleOpenRating}
                                isEntryUpdating={areEntryMutationsLocked}
                                isProgressUpdating={progressUpdatingIds.has(anime.id)}
                                isPromptTarget={statusChangeObj.animeId === anime.id}
                                handleOpenAdvanceEdit={handleOpenAdvanceEdit}
                            />
                        ))
                    )}
                </section>
                <div 
                    id="al-rating-popover"
                    popover='auto'
                    aria-busy={isRatingUpdating}
                >
                    <div className="al-rating-choices">
                        <button
                            className="al-rating-choice"
                            onClick={() => handleRating(null)}
                            disabled={isRatingUpdating}
                        >
                            -
                        </button>
                        {Array.from({ length: 10 }, (_, index) => index+1)
                            .map((rating) =>(
                                <button
                                    key={rating}
                                    className='al-rating-choice'
                                    onClick={() => handleRating(rating)}
                                    disabled={isRatingUpdating}
                                >
                                    {rating}
                                </button>
                            )) 
                        }
                    </div>
                    {ratingUpdateError && (
                        <p className="al-mutation-error" role="alert">
                            {ratingUpdateError}
                        </p>
                    )}
                </div>
                <div
                    ref={statusPromptRef}
                    id="al-status-change-prompt"
                    popover='auto'
                    role="dialog"
                    aria-labelledby="al-status-change-message"
                    aria-busy={isStatusUpdating}
                    onToggle={handleStatusPromptToggle}
                >
                    <span id="al-status-change-message">{statusChangeObj.message}</span>
                    <div className="al-status-change-options">
                        <button 
                            ref={statusPromptCancelRef}
                            className='al-status-change-deny'
                            popoverTarget='al-status-change-prompt'
                            popoverTargetAction='hide'
                            disabled={isStatusUpdating}
                        >
                            Cancel
                        </button>
                        <button 
                            className='al-status-change-accept'
                            disabled={isStatusUpdating}
                            onClick={handleStatusChangeOnIncrement}
                        >
                            {isStatusUpdating ? 'Saving...' : statusChangeObj.accept}
                        </button>
                    </div>
                    {statusUpdateError && (
                        <p className="al-mutation-error" role="alert">
                            {statusUpdateError}
                        </p>
                    )}
                </div>
                <dialog 
                    ref={advanceEditDialogRef}
                    className="al-advance-edit-menu"
                    aria-labelledby="al-advance-edit-title"
                    aria-busy={isEditSaving}
                    onClose={handleAdvanceEditClosed}
                    onCancel={handleAdvanceEditCancel}
                    closedby={isEditSaving ? 'none' : 'any'}
                >
                    <div className="al-advance-edit-header">
                        <div className="al-advance-edit-cover">
                            {editTarget?.coverImage && (
                                <img 
                                    key={editTarget.coverImage}
                                    src={editTarget.coverImage} 
                                    alt="" 
                                    onError={event => event.currentTarget.hidden = true}
                                />
                            )}
                        </div>
                        <div className="al-advance-edit-header-info">
                            <span>Edit Anime Entry</span>
                            <h2 id="al-advance-edit-title">{editTarget?.title ?? ''}</h2>
                            <div className="al-advance-edit-header-sub-info">
                                <span>{editTarget?.format ?? ''}</span>
                                <span>
                                    {editTarget?.totalEpisodes != null
                                        ? `${editTarget.totalEpisodes} episodes`
                                        : '? episodes'
                                    }
                                </span>
                            </div>
                        </div>
                        <button
                            aria-label="Close edit dialog"
                            disabled={isEditSaving}
                            onClick={handleCloseAdvanceEdit}
                        >
                            &times;
                        </button>
                    </div>
                    <div className="al-advance-edit-separator"></div>
                    <form 
                        id="al-advance-edit-form"
                        className="al-advance-edit-content"
                        onSubmit={handleSaveAdvanceEdit}
                    >
                        <label className="al-edit-field" id='al-edit-status'>
                            <span>Status</span>
                            <select 
                                name="status" 
                                value={editDraft?.status ?? ''}
                                disabled={isEditSaving}
                                onChange={handleEditFieldChange}
                            >
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="dropped">Dropped</option>
                                <option value="planning">Planning</option>
                            </select>
                        </label>
                        <label className="al-edit-field" id='al-edit-score'>
                            <span>Score</span>
                            <select 
                                name="rating" 
                                value={editDraft?.rating ?? ''}
                                disabled={isEditSaving}
                                onChange={handleEditFieldChange}
                            >
                                <option value="">-</option>
                                {Array.from({ length: 10 }, (_, index) => index+1)
                                    .map((rating) =>(
                                        <option key={rating} value={rating}>
                                            {rating}
                                            </option>
                                    ))}
                            </select>
                        </label>
                        <label className="al-edit-field" id='al-edit-progress'>
                            <span>Progress</span>

                            <span className="al-edit-progress-input">
                                <input
                                    type="number"
                                    name="progress"
                                    min="0"
                                    max={editTarget?.totalEpisodes ?? undefined}
                                    step="1"
                                    required
                                    value={editDraft?.progress ?? ''}
                                    disabled={isEditSaving}
                                    onChange={handleEditFieldChange}
                                    />

                                <span>/</span>
                                <span>
                                    {editTarget?.totalEpisodes != null
                                        ? `${editTarget.totalEpisodes} episodes`
                                        : '? episodes'
                                    }
                                </span>
                            </span>
                        </label>
                        <div className="al-edit-field" id='al-edit-start-date'>
                            <label htmlFor="al-edit-start-date-input">Start date</label>
                            <span className="al-edit-date-control">
                                <input
                                    id="al-edit-start-date-input"
                                    type="date"
                                    value={editDraft?.startedAt ?? ''}
                                    name="startedAt"
                                    disabled={isEditSaving}
                                    onChange={handleEditFieldChange}
                                    onClick={(event) => event.currentTarget.showPicker()}
                                />
                                <button
                                    type="button"
                                    disabled={
                                        isEditSaving ||
                                        (!editDraft?.startedAt && !hasFuzzyDateValue(editTarget?.startedAt))
                                    }
                                    onClick={() => handleClearEditDate('startedAt')}
                                >
                                    Clear
                                </button>
                            </span>
                            {!fuzzyDateToInputValue(editTarget?.startedAt) &&
                                hasFuzzyDateValue(editTarget?.startedAt) &&
                                !editDirtyFields.has('startedAt') && (
                                    <small>
                                        Partial AniList date: {formatFuzzyDate(editTarget.startedAt)}
                                    </small>
                                )}
                        </div>
                        <div className="al-edit-field" id='al-edit-end-date'>
                            <label htmlFor="al-edit-end-date-input">End date</label>
                            <span className="al-edit-date-control">
                                <input
                                    id="al-edit-end-date-input"
                                    type="date"
                                    value={editDraft?.completedAt ?? ''}
                                    name="completedAt"
                                    disabled={isEditSaving}
                                    onChange={handleEditFieldChange}
                                    onClick={(event) => event.currentTarget.showPicker()}
                                />
                                <button
                                    type="button"
                                    disabled={
                                        isEditSaving ||
                                        (!editDraft?.completedAt && !hasFuzzyDateValue(editTarget?.completedAt))
                                    }
                                    onClick={() => handleClearEditDate('completedAt')}
                                >
                                    Clear
                                </button>
                            </span>
                            {!fuzzyDateToInputValue(editTarget?.completedAt) &&
                                hasFuzzyDateValue(editTarget?.completedAt) &&
                                !editDirtyFields.has('completedAt') && (
                                    <small>
                                        Partial AniList date: {formatFuzzyDate(editTarget.completedAt)}
                                    </small>
                                )}
                        </div>
                    </form>
                    <div className="al-advance-edit-separator"></div>
                    <div className="al-advance-edit-options">
                        {editSaveError && (
                            <p className="al-mutation-error" role="alert">
                                {editSaveError}
                            </p>
                        )}
                        <button
                            type="button"
                            disabled={isEditSaving}
                            onClick={handleCloseAdvanceEdit}
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            form='al-advance-edit-form'
                            disabled={!hasEditChanges || isEditSaving}
                        >
                            {isEditSaving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </dialog>
            </section>
        </main>
    );
}

export default AnimeListPage;
