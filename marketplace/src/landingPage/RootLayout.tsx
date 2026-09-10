import { Link, Outlet, useNavigate } from "react-router-dom";
import {
    IconCart,
    IconDropdown,
    IconInformation,
    IconNotification,
    IconSearchHeader,
    IconSettings,
} from "./LandingPageIcon";
import { useSignupStore } from "../signupPage/SignupStore";
import { profileEditing, userLogin, userSignup } from "../App";

const MainContentHeader = () => {
    const isAuthenticated = useSignupStore((state) => state.isAuthenticated);
    const userAuth = useSignupStore((state) => state.userAuth);

    return (
        <div className="relative flex items-center justify-center">
            <div className="w-[30%] h-10 rounded-md bg-very-light-grey border border-dark-grey/10 flex items-center px-4 gap-4">
                <IconSearchHeader />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="outline-none hover:outline-none text-dark-grey flex-1 font-jakarta-medium"
                />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 font-jakarta-medium text-dark-grey">
                <div
                    className={`flex border-r-2 border-dark-grey pr-5 items-center ${
                        isAuthenticated ? "gap-4" : "gap-8"
                    }`}
                >
                    {isAuthenticated ? (
                        <>
                            <IconNotification />
                            <span>Hello, {userAuth.first_name}</span>
                        </>
                    ) : (
                        <>
                            <span>Help</span>
                            <Link to={userSignup}>
                                <span>Sign Up</span>
                            </Link>
                            <Link to={userLogin}>
                                <span>Log In</span>
                            </Link>
                        </>
                    )}
                </div>
                <div className="flex gap-3 pl-3 items-center">
                    <span>EN</span>
                    <IconDropdown />
                </div>
            </div>
        </div>
    );
};

const SidebarIcons = () => {
    return (
        <div className="py-2 bg-web-purple w-full flex items-center justify-center">
            <IconCart />
        </div>
    );
};

const SidebarProfile = () => {
    const userAuth = useSignupStore((state) => state.userAuth);
    const avatarPath = userAuth.avatar_path;

    const navigate = useNavigate();

    return (
        <div className="py-2 w-full flex items-center justify-center">
            <div className="flex flex-col gap-5 items-center">
                <IconInformation />
                <IconSettings />
                {avatarPath && (
                    <img
                        src={avatarPath}
                        alt="avatar-image"
                        className="w-8 h-8 rounded-full object-cover hover:cursor-pointer"
                        onClick={() => navigate(profileEditing)}
                    />
                )}
            </div>
        </div>
    );
};

const Sidebar = () => {
    const isAuthenticated = useSignupStore((state) => state.isAuthenticated);

    return (
        <div className="flex flex-col items-center justify-between bg-white py-5 sticky top-0 h-screen self-start">
            <SidebarIcons />
            {isAuthenticated && <SidebarProfile />}
        </div>
    );
};

function MainLayout() {
    return (
        <div className="w-full grid grid-cols-[1fr_25fr] bg-light-grey justify-center text-sm gap-3 font-jakarta-regular">
            <Sidebar />
            <div className="flex-1 rounded-xl shadow-xl p-5 flex flex-col my-2 bg-white mr-3 gap-5">
                <MainContentHeader />
                <Outlet />
            </div>
        </div>
    );
}

export default MainLayout;
