import './Styles/ProfilePageCardItem.css';

function ProfilePageCardItem({ title, tags, stat }) {
    return (
        <div className="rightnow-cc-item">
            <div className="rightnow-cc-item-photo"></div>
            <div className="rightnow-cc-item-info">
                <div className="rightnow-cc-item-title">{title}</div>
                <div className="rightnow-cc-item-tags">
                    {tags.map((tag, index) => (
                        <span key={index} className='rightnow-cc-item-tag'>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="rightnow-cc-item-stat">{stat}</div>
        </div>
    );
}

export default ProfilePageCardItem;