import './Styles/AL_RowItem.css';

function AL_RowItem({ 
    anime, handleIncrement, setRatingTargetId, isPromptTarget, handleOpenAdvanceEdit
 }) {

    const hasKnownTotal = anime.totalEpisodes != null;
    const hasReachedTotal = hasKnownTotal && anime.progress >= anime.totalEpisodes;

    return (
        <div className="al-row-item" data-status={anime.status}>
            <div className="al-row-item-photo">
                {anime.coverImage && (
                    <img 
                        src={anime.coverImage} 
                        alt=""
                        loading='lazy'
                        onError={event => event.currentTarget.hidden = true}    
                    />
                )}
            </div>
            <div className="al-row-item-info">
                <div className="al-row-item-title">{anime.title}</div>
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
                            disabled={hasReachedTotal}
                            onClick={() => handleIncrement(anime)}
                            data-prompt-anchor={isPromptTarget || undefined}
                        >
                            {hasReachedTotal ? '✓' : '+'}
                        </button>
                    </div>
                </div>
                <div className="al-row-item-edit">
                    <button onClick={() => handleOpenAdvanceEdit(anime)}></button>
                </div>
            </div>
        </div>
    );
}

export default AL_RowItem;
