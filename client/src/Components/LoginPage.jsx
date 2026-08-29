import './Styles/LoginPage.css'
import LoginCard from './LoginCard.jsx'
import AstraRings from "./AstraRings.jsx";
import LoginDialog from './LoginDialog.jsx';
import { useState, useRef, useEffect } from 'react';

function LoginPage() {
    const tempImgUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo51RaSL38xlksvpHe9OoUJhg5oB5vlyKqJm5fjqdgkA&s=10"
    
    const [selectedLogin, setSelectedLogin] = useState('none');
    const [isClosing, setIsClosing] = useState(false);
    const loginDialogRef = useRef(null);

    
    function handleClick(id) {
        setSelectedLogin(id);
    }

    function closeLoginPanel() {
        setIsClosing(true);
    }

    async function handleDialogButtonClick(service) {
        console.log(`Login with ${service} clicked`);
        window.location.href = 'http://localhost:3000/auth/anilist';
    }

    function handleAnimationEnd(event) {
        if (event.animationName !== 'panel-close') return;
        
        loginDialogRef.current?.close();
        setSelectedLogin('none');
        setIsClosing(false);
    }
    function preventEscProblem(event) {
        event.preventDefault();
        closeLoginPanel();
    }
    
    useEffect(() => {
        if (selectedLogin === 'none') return;

        loginDialogRef.current?.showModal();

    }, [selectedLogin]);
    
    return(
        <>
        <main className="main-page">
            <div className="background-detail" />
             <div className="gradient-bg">
                <div className="mesh-light mesh-dark" />
                <div className="mesh-light mesh-purple-core" />
                <div className="mesh-light mesh-purple-glow" />
                <div className="mesh-light mesh-pink-soft" />
            </div>
            
            <section className={`content ${selectedLogin !== 'none' ? 'login-open' : ''}`}>
                
                <div className="logo-wrapper">
                    <img className='logo' src={tempImgUrl} alt="Logo" />
                </div>
                <div className='main-text'>
                <div className="eyebrow">Unified Media Tracking</div>
                    <h2 className='name'>Astra<span>List</span></h2>
                    <span className='tagline'>One place for everything you watch, play, and follow.</span>
                </div>

                <div className="login-cards">
                <LoginCard 
                    id="anime"
                    title="Anime"
                    subtitle="Track your library through AniList" 
                    onAction={handleClick}
                />
                <LoginCard 
                    id="games"
                    title="Games" 
                    subtitle="Coming soon" disabled={true} 
                    onAction={handleClick}
                />
                <LoginCard 
                    id="movies"
                    title="Movies / TV" 
                    subtitle="Coming soon" 
                    onAction={handleClick}
                    disabled={true} 
                />
                </div>

            </section>

            <section className="visual">
                <AstraRings isBackground={selectedLogin !== 'none'} />
            </section>
        </main>
        <LoginDialog 
            selectedLogin={selectedLogin}
            loginDialogRef={loginDialogRef} 
            isClosing={isClosing}
            closeLoginPanel={closeLoginPanel}
            handleAnimationEnd={handleAnimationEnd}
            preventEscProblem={preventEscProblem}
            handleDialogButtonClick={handleDialogButtonClick}
        />
        </>
    )
}
export default LoginPage;