import './Styles/AppLayout.css';
import { Outlet } from "react-router";
import NavPill from "./NavPill";

function AppLayout() {
    return (
        <main className="app-layout">
            <NavPill />

            <div className="app-content">
                <Outlet />
            </div>
        </main>
    );
}

export default AppLayout;