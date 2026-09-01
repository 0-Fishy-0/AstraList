import './Styles/AstraBackground.css';

function AstraBackground({ showDetails = false }) {
    return (
        <div
            className={`astra-background ${showDetails ? '' : 'no-details'}`}
            aria-hidden="true"
        />
    );
}

export default AstraBackground;