function LoginDialog(props) {
    const {
        selectedLogin,
        loginDialogRef, 
        isClosing, 
        closeLoginPanel, 
        handleAnimationEnd, 
        preventEscProblem,
        handleDialogButtonClick
    } = props;

    const loginTitles = {
        anime: 'Anime',
        games: 'Games',
        movies: 'Movies / TV'
    };

    return (
        <dialog 
            ref={loginDialogRef}
            className={`login-panel ${isClosing ? 'closing' : ''}`}
            onCancel={preventEscProblem}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className="login-header">
                <div className="login-kicker">AstraList access</div>
                <h2 className="login-title">
                    {loginTitles[selectedLogin] || ''} Login
                     </h2>
                <div className="login-title-underline"></div>
                <button 
                    className="login-panel-close"
                    onClick={closeLoginPanel}
                > ×
                </button>
            </div>
            <p className="login-subtitle">Choose the service you want AstraList to connect with.</p>
            <div className="button-container">
                <button className="login-button" onClick={() => handleDialogButtonClick('anilist')}>
                    <div className="login-btn-left">
                        <div className="login-btn-text">
                            <h3 className="login-btn-title">Login with AniList</h3>
                            <p className="login-btn-subtitle">Primary anime provider</p>
                        </div>
                        <div className="login-btn-bottom-text">Continue with AniList</div>
                    </div>
                    <div className="login-btn-right">
                        <div className="provider-logo-wrapper anilist-logo"></div>
                        <div className="login-btn-arrow">→</div>
                    </div>

                </button>
                <button className="login-button" disabled onClick={() => handleDialogButtonClick('myanimelist')}>
                    <div className="login-btn-left">
                        <div className="login-btn-text">
                            <h3 className="login-btn-title">Login with MyAnimeList</h3>
                            <p className="login-btn-subtitle">Alternative provider</p>
                        </div>
                        <div className="login-btn-bottom-text">Coming Soon</div>
                    </div>
                    <div className="login-btn-right">
                        <div className="provider-logo-wrapper">
                            MAL
                        </div>
                        <div className="login-btn-arrow">→</div>
                    </div>

                </button>
            </div>
        </dialog>
    )
}

export default LoginDialog;