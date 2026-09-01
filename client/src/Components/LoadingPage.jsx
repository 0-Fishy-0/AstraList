import AstraBackground from './AstraBackground';
import './Styles/LoadingPage.css';

export default function LoadingPage({ text = "Loading..." }) {
    return (
        <main className="loading-page">
            <AstraBackground />
            <div className="loading-content">
                <div className="loading-logo-container">
                    <div className="loading-ring loading-ring-outer"></div>
                    <div className="loading-ring loading-ring-middle"></div>
                    <div className="loading-ring loading-ring-inner"></div>
                    <div className="loading-core"></div>
                </div>
                <div className="loading-text">
                    <h1>AstraList</h1>
                    <p>{text}</p>
                </div>
            </div>
        </main>
    );
}