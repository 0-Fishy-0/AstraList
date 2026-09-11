import LoadingPage from './Components/LoadingPage.jsx'
import ProfilePage from "./Components/ProfilePage.jsx"
import LoginPage from "./Components/LoginPage.jsx"
import { useState, useEffect, createContext } from "react"
import { Routes, Route, Navigate } from 'react-router'
import AppLayout from './Components/AppLayout.jsx'
import AnimeListPage from './Components/AnimeListPage.jsx'

export const AuthContext = createContext(null);
function App() {

  	const [user, setUser] = useState(null);
	const [authStatus, setAuthStatus] = useState('loading');

	async function handleLogout() {
		try {
			const response = await fetch('http://localhost:3000/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});
			if (!response.ok) {
				throw new Error(`Logout failed: ${response.status}`);
			}

			const data = await response.json();
			if (data.loggedOut) {
				setAuthStatus('unauthenticated');
				setUser(null);
			} else {
				throw new Error("Logout failed: Server did not confirm logout.");
			}
		} catch (error) {
			console.error("Error during logout:", error);
		}
		
	}

	useEffect(() => {
  		async function checkAuthStatus() {
			  try {
				const response = await fetch('http://localhost:3000/api/me', {
					credentials: 'include'
				});
				
				if (!response.ok) {
					throw new Error(`Auth Check Failed: ${response.status}`);
				}
				
				const data = await response.json();

				if (!data.loggedIn) {
					setUser(null);
					setAuthStatus('unauthenticated');
					return;
				}

				setUser({
					handle: data.user.handle,
					displayName: data.user.displayName,
					profileSetupComplete: data.user.profileSetupComplete
				});
				setAuthStatus('authenticated');

			} catch (error) {
				console.error("Error checking auth status:", error);
				setUser(null);
				setAuthStatus('error');
			}
  		}
		checkAuthStatus();
	}, []);

    return (
		<AuthContext.Provider value={{ user, setUser, authStatus, setAuthStatus }}>
		<Routes>
			<Route 
				path="/"
				element={
					authStatus === 'loading'
					? <LoadingPage text='Checking Authorization Status...' />
					: authStatus === 'error'
					? (<p>Insert Error Page here later</p>)
					: authStatus === 'authenticated'
					? <Navigate to={`/profile/${user.handle}`} replace />
					: <LoginPage />
				} />
			<Route element={ <AppLayout /> }>
					<Route
						path="/profile/:handle"
					element={<ProfilePage onLogout={handleLogout} />}
				/>
				<Route
					path="/list/anime"
					element={
						authStatus === 'loading'
						? <LoadingPage text='Loading Anime List...' />
						: authStatus === 'authenticated'
						? <AnimeListPage />
						: <Navigate to="/" replace />
					}
				/>
			</Route>
		</Routes>
		</AuthContext.Provider>
	)
}

export default App