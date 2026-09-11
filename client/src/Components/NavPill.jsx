import './Styles/NavPill.css';
import AstraMini from './AstraMini.jsx';
import { NavLink } from 'react-router';
import { AuthContext } from '../App.jsx';
import { useContext } from 'react';

function NavPill() {
    const { user } = useContext(AuthContext);

    return (
        <main>
        <nav className="nav-pill-vert">
            <ul className="nav-pill-list">
                <li className='nav-pill-item' id='nav-pill-brand'>
                    <AstraMini />
                </li>
                <li className="nav-pill-item">
                    <button id='nav-pill-button-list'
                        popoverTarget='nav-submenu-popup'
                    >
                        <div className="nav-pill-svg-wrapper">
                            <img src="/src/assets/list-icon.svg" alt="Lists" id='nav-pill-list-icon' />
                        </div>
                    </button>
                </li>
                <li className="nav-pill-item">
                    <NavLink 
                        to={user ? `/profile/${user.handle}` : '/'}
                        className={({ isActive }) => `nav-pill-link ${user && isActive ? 'active' : ''}`}
                        >
                        <div className="nav-pill-svg-wrapper">
                            <img src="/src/assets/profile-icon.svg" alt="Profile" id='nav-pill-profile-icon' />
                        </div>
                    </NavLink>
                </li>
            </ul>
        </nav>
        <nav className='nav-submenu'
            id='nav-submenu-popup' 
            popover='auto'
            autoFocus
        >
            <ul className="nav-submenu-list">
                <li className="nav-submenu-item">
                    <NavLink
                        to={user ? '/list/anime' : '/'}
                        className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                    >
                        <span>Anime</span>
                    </NavLink>
                </li>
                <li className='nav-submenu-item'>
                    <NavLink
                        to={user ? '/list/games' : '/'}
                        className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                    >
                        <span>Games</span>
                    </NavLink>
                </li>
                <li className="nav-submenu-item">
                    <NavLink
                        to={user ? '/list/movies' : '/'}
                        className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                    >
                        <span>Movies & TV</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
        </main>
    );
}

export default NavPill;