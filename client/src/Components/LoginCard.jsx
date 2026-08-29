import './Styles/LoginCard.css'
function LoginCard(props) {

    const {onAction} = props;

    return(
        <button 
            className='card-container'
            disabled={props.disabled}
            onClick={() => onAction(props.id)}
        >
            <span className="left">
                <span className="title">{props.title}</span>
                <span className="subtitle">{props.subtitle}</span>
            </span>
            <span className="right">
                <span className="connect">Connect</span>
                <span className="arrow">→</span>
            </span>
        </button>
    )
}
export default LoginCard;