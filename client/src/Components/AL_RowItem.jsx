import './Styles/AL_RowItem.css';
import { Link } from 'react-router';

function AL_RowItem({ 
    anime,
    handleIncrement,
    setRatingTargetId,
    isEntryUpdating,
    isProgressUpdating,
    isPromptTarget,
    handleOpenAdvanceEdit
 }) {

    const hasKnownTotal = anime.totalEpisodes != null;
    const hasReachedTotal = hasKnownTotal && anime.progress >= anime.totalEpisodes;
    const isProgressDisabled = hasReachedTotal || isEntryUpdating;

    return (
        <div className="al-row-item" data-status={anime.status}>
            <Link
                className="al-row-item-photo"
                to={`/anime/${anime.mediaId}`}
                aria-label={`View details for ${anime.title}`}
            >
                {anime.coverImage && (
                    <img 
                        src={anime.coverImage} 
                        alt=""
                        loading='lazy'
                        decoding='async'
                        onError={event => event.currentTarget.hidden = true}    
                    />
                )}
            </Link>
            <div className="al-row-item-info">
                <Link
                    className="al-row-item-title"
                    to={`/anime/${anime.mediaId}`}
                >
                    {anime.title}
                </Link>
                <div className="al-row-item-tags">
                    {anime.tags.slice(0, 3).map((tag) => (
                        <span 
                            key={tag} 
                            className='al-row-item-tag'
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="al-row-item-options">
                <div className="al-row-item-rating">
                    <button 
                        data-rated={anime.rating !== null}
                        popoverTarget='al-rating-popover'
                        disabled={isEntryUpdating}
                        aria-label={`Rate ${anime.title}. Current rating: ${
                            anime.rating ?? 'unrated'
                        }`}
                        onClick={() => setRatingTargetId(anime.id)}
                    >
                        {anime.rating ?? '-'}
                    </button>
                </div>
                <div className="al-row-item-progress">
                    <span className="al-row-item-progress-label">Progress:</span>
                    <div className="al-row-item-progress-info">
                        <span className='al-ri-progress-start'>{anime.progress}</span>
                        <span className='al-ri-progress-separator'>/</span>
                        <span className='al-ri-progress-end'>{anime.totalEpisodes ?? '?'}</span>
                        <button 
                            className="al-ri-progress-plus"
                            disabled={isProgressDisabled}
                            aria-busy={isProgressUpdating}
                            aria-label={
                                isProgressUpdating
                                    ? `Updating progress for ${anime.title}`
                                    : hasReachedTotal
                                    ? `${anime.title} has reached its episode total`
                                    : `Increment progress for ${anime.title}`
                            }
                            onClick={() => handleIncrement(anime)}
                            data-prompt-anchor={isPromptTarget || undefined}
                        >
                            {isProgressUpdating ? '...' : hasReachedTotal ? '✓' : '+'}
                        </button>
                    </div>
                </div>
                <div className="al-row-item-edit">
                    <button
                        aria-label={`Edit ${anime.title}`}
                        disabled={isEntryUpdating}
                        onClick={() => handleOpenAdvanceEdit(anime)}
                    ></button>
                </div>
            </div>
        </div>
    );
}

export default AL_RowItem;
