import './Styles/AnimeListPage.css';
import { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from '../App.jsx';
import AL_RowItem from './AL_RowItem.jsx';

const CATEGORIES = [
    { key: 'all', label: 'All Anime' },
    { key: 'watching', label: 'Watching' },
    { key: 'completed', label: 'Completed' },
    { key: 'on-hold', label: 'On Hold' },
    { key: 'dropped', label: 'Dropped' },
    { key: 'planning', label: 'Planning' }
]

function AnimeListPage() {

    const { user } = useContext(AuthContext);
    const [animeList, setAnimeList] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [ratingTargetId, setRatingTargetId] = useState(null);
    const [statusChangeObj, setStatusChangeObj] = useState({
        animeId: null,
        nextStatus: null,
        message: '', 
        accept: ''
    });
    const statusPromptRef = useRef(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const advanceEditDialogRef = useRef(null);

    // Show only anime that matches the active category, or all if 'all' is selected
    const visibleAnime = animeList.filter((anime) => 
        activeCategory === 'all'
        ? true 
        : anime.status === activeCategory
    );

    function handleRating(rating) {
        setAnimeList((currentList) =>
            currentList.map((anime) =>
                anime.id === ratingTargetId
                ? {...anime, rating}
                : anime
            )
        );
    }

    function handleIncrement(anime) {
        if (
            anime.totalEpisodes != null &&
            anime.progress >= anime.totalEpisodes
        ) return;

        const nextProgress = anime.progress + 1;
        
        setAnimeList((currentList) =>
            currentList.map((item) =>
                item.id === anime.id
                ? {...item, progress: nextProgress}
                : item
            )
        )
        let nextStatus = null;
        if (
            (anime.status === 'planning' && nextProgress === 1) || 
            anime.status === 'on-hold' || 
            anime.status === 'dropped'
        ) {
            nextStatus = 'watching';
        }
        if (anime.totalEpisodes != null && anime.status !== 'completed' && nextProgress === anime.totalEpisodes) {
            nextStatus = 'completed';
        }
        if (nextStatus) {
            setStatusChangeObj({
                animeId: anime.id,
                nextStatus,
                message: nextStatus === 'completed'
                    ? 'Mark this anime as completed?'
                    : 'Move this anime to watching?',
                accept: nextStatus === 'completed'
                    ? 'Mark as completed'
                    : 'Set as watching'
            })
            statusPromptRef.current?.showPopover();
        }
    }

    function handleStatusChangeOnIncrement() {
        setAnimeList((currentList) =>
            currentList.map((anime) =>
                anime.id === statusChangeObj.animeId
                ? {...anime, status: statusChangeObj.nextStatus}
                : anime
            )
        );
    }

    function handleOpenAdvanceEdit(anime) {
        setEditTarget(anime);

        setEditDraft({
            status: anime.status,
            rating: anime.rating ?? '',
            progress: anime.progress,
            startedAt: anime.startedAt ?? '',
            completedAt: anime.completedAt ?? ''
        });

        advanceEditDialogRef.current?.showModal();
    }
    function handleCloseAdvanceEdit(anime) {
        setEditTarget(anime);
        advanceEditDialogRef.current?.close();
    }

    function handleEditFieldChange(event) {
        const { name, value } = event.target;
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
    function handleSaveAdvanceEdit(event) {
        event.preventDefault();

        if (!editTarget || !editDraft) return;

        const updatedEntry = {
            status: editDraft.status,
            rating: editDraft.rating === '' ? null : Number(editDraft.rating),
            progress: Number(editDraft.progress),
            startedAt: editDraft.startedAt === '' ? null : editDraft.startedAt,
            completedAt: editDraft.completedAt === '' ? null : editDraft.completedAt
        }
         setAnimeList((currentList) =>
            currentList.map((anime) =>
                anime.id === editTarget.id
                    ? { ...anime, ...updatedEntry }
                    : anime
            )
        );
        advanceEditDialogRef.current?.close();
    }

    useEffect(() => {
        async function fetchAnimeList() {
            try {
                const response = await fetch(
                    'http://localhost:3000/api/list/anime', {
                    credentials: 'include'
                    }
                )
                if (!response.ok) {
                    throw new Error(`Failed to fetch anime list: ${response.status}`);
                }
                const data = await response.json();
                setAnimeList(data.entries);
            }
            catch (error) {
                console.error('Error fetching anime list:', error);
            }
        }

        fetchAnimeList();
    }, []);

    return (
        <main className='anime-list-page'>
            <section className="al-banner"></section>
            <section className="al-all-content">
                <section className="al-category-bar">
                    <div className="al-avatar-wrapper">
                        <span>{user.displayName.charAt(0).toUpperCase()}</span>
                        {/* Insert Image Later */}
                    </div>
                        <div className="al-categories" data-active-category={activeCategory}>
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category.key}
                                    data-category={category.key}
                                    className={`al-category ${
                                        activeCategory === category.key ? 'active' : ''
                                    }`}
                                    onClick={() => setActiveCategory(category.key)}
                                >
                                    <span>{category.label}</span>                                    
                                </button>
                            ))}
                        </div>
                        <div className="al-search">
                            <img src="/src/assets/search-icon.svg" alt="Search" />
                        </div>
                </section>
                <section className="al-toolbar">
                    <button className="al-toolbar-item">T</button>
                    <button className="al-toolbar-item">E</button>
                    <button className="al-toolbar-item">M</button>
                    <button className="al-toolbar-item">P</button>
                    <button className="al-toolbar-item">R</button>
                </section>
                <section className="al-content" data-category={activeCategory}>
                    {visibleAnime.map((anime) => (
                        <AL_RowItem
                            key={anime.id}
                            anime={anime}
                            handleIncrement={handleIncrement}
                            setRatingTargetId={setRatingTargetId}
                            isPromptTarget={statusChangeObj.animeId === anime.id}
                            handleOpenAdvanceEdit={handleOpenAdvanceEdit}
                        />
                    ))}
                </section>
                <div 
                    id="al-rating-popover"
                    popover='auto'
                >
                    <div className="al-rating-choices">
                        <button
                            className="al-rating-choice"
                            onClick={() => handleRating(null)}
                            popoverTarget="al-rating-popover"
                            popoverTargetAction="hide"
                        >
                            -
                        </button>
                        {Array.from({ length: 10 }, (_, index) => index+1)
                            .map((rating) =>(
                                <button
                                    key={rating}
                                    className='al-rating-choice'
                                    onClick={() => handleRating(rating)}
                                    popoverTarget='al-rating-popover'
                                    popoverTargetAction='hide'
                                >
                                    {rating}
                                </button>
                            )) 
                        }
                    </div>
                </div>
                <div ref={statusPromptRef} id="al-status-change-prompt" popover='auto'>
                    <span>{statusChangeObj.message}</span>
                    <div className="al-status-change-options">
                        <button 
                            className='al-status-change-deny'
                            popoverTarget='al-status-change-prompt'
                            popoverTargetAction='hide'
                        >
                            Cancel
                        </button>
                        <button 
                            className='al-status-change-accept'
                            popoverTarget='al-status-change-prompt'
                            popoverTargetAction='hide'
                            onClick={handleStatusChangeOnIncrement}
                        >
                            {statusChangeObj.accept}
                        </button>
                    </div>
                </div>
                <dialog 
                    ref={advanceEditDialogRef}
                    className="al-advance-edit-menu"
                    onClose={() => setEditTarget(null)}
                    closedby='any'
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
                            <h2>{editTarget?.title ?? ''}</h2>
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
                        <button onClick={handleCloseAdvanceEdit}>
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

                            <div className="al-edit-progress-input">
                                <input
                                    type="number"
                                    name="progress"
                                    min="0"
                                    max={editTarget?.totalEpisodes ?? undefined}
                                    step="1"
                                    required
                                    value={editDraft?.progress ?? ''}
                                    onChange={handleEditFieldChange}
                                    />

                                <span>/</span>
                                <span>
                                    {editTarget?.totalEpisodes != null
                                        ? `${editTarget.totalEpisodes} episodes`
                                        : '? episodes'
                                    }
                                </span>
                            </div>
                        </label>
                        <label className="al-edit-field" id='al-edit-start-date'>
                            <span>Start date</span>
                            <input
                                type="date"
                                name="startedAt"
                                onChange={handleEditFieldChange}
                                onClick={(event) => event.currentTarget.showPicker()}
                                />
                        </label>
                        <label className="al-edit-field" id='al-edit-end-date'>
                            <span>End date</span>
                            <input
                                type="date"
                                name="completedAt"
                                onChange={handleEditFieldChange}
                                onClick={(event) => event.currentTarget.showPicker()}
                                />
                        </label>
                    </form>
                    <div className="al-advance-edit-separator"></div>
                    <div className="al-advance-edit-options">
                        <button type="button" onClick={handleCloseAdvanceEdit}>Cancel</button>
                        <button type='submit' form='al-advance-edit-form'>Save changes</button>
                    </div>
                </dialog>
            </section>
        </main>
    );
}

export default AnimeListPage;
