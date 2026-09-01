import './Styles/ProfilePage.css'
import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router";
import LoadingPage from "./LoadingPage";
import AstraBackground from "./AstraBackground";
import ProfilePageCardItem from './ProfilePageCardItem.jsx';
import { AuthContext } from '../App.jsx';

function ProfilePage({ onLogout }) {
    const { handle } = useParams();
    const { user } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [profileStatus, setProfileStatus] = useState('loading');
    useEffect(() => {
        async function fetchProfile() {
            try {
                setProfileStatus('loading');
                const response = await fetch(`http://localhost:3000/api/profile/${handle}`);

                if (response.status === 404) {
                    setProfile(null)
                    setProfileStatus('not_found');
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Profile fetch failed: ${response.status}`);
                }
                const data = await response.json();
                setProfile(data);
                setProfileStatus('loaded');
            } catch (error) {
                console.error("Error fetching profile:", error);
                setProfileStatus('error');
            }
        }

        fetchProfile();
    }, [handle]);

    if (profileStatus === 'loading') {
        return <LoadingPage text="Loading Profile..." />;
    }

    if (profileStatus === 'not_found') {
        return <div>Profile not found.</div>;
    }

    if (profileStatus === 'error') {
        return <div>Error loading profile. Please try again later.</div>;
    }

    const isOwnProfile = user?.handle === profile?.handle;

    return(
        <main className="profile-page">
            <AstraBackground />
            <div className="profile-content">
                <section className="profile-header">
                    <div className="profile-user-avatar-wrapper">
                        <span>{profile.displayName.charAt(0)}</span>
                    </div>
                    <div className="profile-user-info">
                        <h1 className="user-name">{profile.displayName}</h1>
                        <h2 className="user-handle">@{profile.handle}</h2>
                        <p className="user-bio">{profile.bio}</p>
                    </div>
                    { isOwnProfile && (
                        <div className="profile-owner-controls">
                            <button className="profile-edit">Edit Profile</button>
                            <button className="profile-settings">Settings</button>
                        </div>
                    )}
                </section>

                <div className="profile-separator" />
                
                <section className="profile-rightnow">
                    <h2 className="rightnow-title">Right Now</h2>
                    <div className="rightnow-content">
                        <div className="rightnow-card">
                            <div className="rightnow-card-header">
                                <div className="rightnow-card-title" id='ct-anime'>Watching Anime</div>
                                <a className="rightnow-card-list" 
                                    href="#">
                                    Anime List
                                </a>
                            </div>
                            <div className="rightnow-card-content">
                                {/* Item area */}
                                <ProfilePageCardItem 
                                    title="Attack on Titan"
                                    tags={['Action', 'Drama', 'Fantasy']}
                                    stat={`Ep 75`}
                                />
                                <ProfilePageCardItem 
                                    title="Re:Zero - Starting Life in Another World"
                                    tags={['Drama', 'Fantasy', 'Psychological']}
                                    stat={`Ep 25`}
                                />
                                <ProfilePageCardItem 
                                    title="Demon Slayer: Kimetsu no Yaiba"
                                    tags={['Action']}
                                    stat={`Ep 26`}
                                />
                                <ProfilePageCardItem 
                                    title="My Hero Academia"
                                    tags={['Action', 'Comedy', 'Superhero']}
                                    stat={`Ep 88`}
                                />
                            </div>
                        </div>
                        <div className="rightnow-card">
                            <div className="rightnow-card-header">
                                <div className="rightnow-card-title" id='ct-games'>Playing Games</div>
                                <a className="rightnow-card-list" 
                                    href="#">
                                    Game List
                                </a>
                            </div>
                            <div className="rightnow-card-content">
                                {/* Item area */}
                            </div>
                        </div>
                        <div className="rightnow-card">
                            <div className="rightnow-card-header">
                                <div className="rightnow-card-title" id='ct-movies'>Movies & TV</div>
                                <a className="rightnow-card-list" 
                                    href="#">
                                    Watch List
                                </a>
                            </div>
                            <div className="rightnow-card-content">
                                {/* Item area */}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default ProfilePage;