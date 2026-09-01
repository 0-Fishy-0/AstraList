import { useContext } from "react";
import { AuthContext } from "../App";

function AnimeListPage() {
    const { user } = useContext(AuthContext);
    return (
        <div>
            Anime List page
        </div>
    );
}

export default AnimeListPage;