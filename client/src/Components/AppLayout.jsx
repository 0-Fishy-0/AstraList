import './Styles/AppLayout.css';
import { Outlet } from "react-router";
import NavPill from "./NavPill";

function AppLayout() {
    return (
        <div className="app-layout">
            <NavPill />

            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}

export default AppLayout;
