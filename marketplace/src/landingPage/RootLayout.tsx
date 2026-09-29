import { generatePath, Link, Outlet, useLocation } from "react-router-dom";
import {
    IconCart,
    IconCartGray,
    IconCartSmall,
    IconDropdown,
    IconInformation,
    IconNotification,
    IconSearchHeader,
    IconSettings,
    IconShop,
    IconShopGray,
} from "./LandingPageIcon";
import { useSignupStore } from "../signupPage/SignupStore";
import {
    loginStore,
    orderDetails,
    profileEditing,
    rootPath,
    shop,
    signupStore,
    userLogin,
    userSignup,
} from "../App";
import React, { useEffect } from "react";
import { useLandingPage } from "./LandingPageStore";

const MainContentHeader = () => {
    const isAuthenticated = useSignupStore((state) => state.isAuthenticated);
    const userAuth = useSignupStore((state) => state.userAuth);

    const [numCheckout, setNumCheckout] = useLandingPage("numCheckout");
    useEffect(() => {
        const handler = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8080/api/fetch/checkout",
                    { method: "GET", credentials: "include" },
                );
                if (response.ok) {
                    const data = await response.json();
                    setNumCheckout(data.length);
                }
            } catch (error) {
                console.error(error);
            }
        };

        handler();
    }, []);

    return (
        <div className="relative flex items-center justify-center overflow-hidden">
            <div className="absolute left-10 top-1/2 -translate-y-1/2 flex gap-5 font-jakarta-medium text-dark-grey">
                {userAuth.is_seller ? (
                    <div className="flex gap-3 items-center">
                        <img
                            src={userAuth.logo_filepath ?? ""}
                            alt="image"
                            className="rounded-full w-7"
                        />
                        <span className="font-jakarta-semibold text-sm">
                            {userAuth.store_name}
                        </span>
                    </div>
                ) : (
                    <>
                        <Link to={signupStore}>
                            <span>Register as seller</span>
                        </Link>
                        <Link to={loginStore}>
                            <span>Log in as seller</span>
                        </Link>
                    </>
                )}
            </div>
            <div className="w-[30%] h-10 rounded-md bg-very-light-grey border border-dark-grey/10 flex items-center px-4 gap-4">
                <IconSearchHeader />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="outline-none hover:outline-none text-dark-grey flex-1 font-jakarta-medium"
                />
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-2 font-jakarta-medium text-dark-grey">
                <div
                    className={`flex border-r-2 border-dark-grey pr-5 items-center ${
                        isAuthenticated ? "gap-4" : "gap-8"
                    }`}
                >
                    {isAuthenticated && userAuth.first_name ? (
                        <>
                            <Link
                                to={generatePath(orderDetails, {
                                    user: userAuth.first_name.toLowerCase(),
                                })}
                            >
                                <div className="relative">
                                    {numCheckout === 0 ? null : (
                                        <div
                                            className={`absolute rounded-full w-2.5 h-2.5 -top-1 -right-1 bg-web-purple text-[0.5em] text-white flex items-center justify-center`}
                                        >
                                            {numCheckout}
                                        </div>
                                    )}
                                    <IconCartSmall />
                                </div>
                            </Link>
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

const Logic = ({
    loc,
    linkTo,
    NormalElement,
    GrayElement,
}: {
    loc: string;
    linkTo: string;
    NormalElement: () => React.JSX.Element;
    GrayElement: () => React.JSX.Element;
}) => {
    const location = useLocation();
    return (
        <Link to={linkTo}>
            <div
                className={`py-2 w-full flex items-center justify-center ${location.pathname !== loc ? "bg-transparent" : "bg-web-purple"}`}
            >
                {location.pathname !== loc ? (
                    <GrayElement />
                ) : (
                    <NormalElement />
                )}
            </div>
        </Link>
    );
};

const SidebarIcons = () => {
    return (
        <div className={`py-2 w-full flex flex-col gap-2`}>
            <Logic
                loc={rootPath}
                linkTo={rootPath}
                NormalElement={IconCart}
                GrayElement={IconCartGray}
            />
            <Logic
                loc={shop}
                linkTo={shop}
                NormalElement={IconShop}
                GrayElement={IconShopGray}
            />
        </div>
    );
};

const SidebarProfile = () => {
    const userAuth = useSignupStore((state) => state.userAuth);
    const avatarPath = userAuth.avatar_path;

    return (
        <div className="py-2 w-full flex items-center justify-center">
            <div className="flex flex-col gap-5 items-center">
                <IconInformation />
                <Link to={profileEditing}>
                    <IconSettings />
                </Link>
                {avatarPath && (
                    <img
                        src={avatarPath}
                        alt="avatar-image"
                        className="w-8 h-8 rounded-full object-cover"
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
        <div className="w-full grid grid-cols-[1.1fr_25fr] bg-light-grey justify-center text-sm gap-3 font-jakarta-regular h-screen">
            <Sidebar />
            <div className="flex-1 rounded-xl shadow-xl pt-5 flex flex-col my-2 bg-white mr-3 gap-5 h-[calc(100vh-1rem)] min-h-0    ">
                <MainContentHeader />
                <Outlet />
            </div>
        </div>
    );
}

export default MainLayout;
