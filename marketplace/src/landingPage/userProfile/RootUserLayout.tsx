import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSignupStore } from "../../signupPage/SignupStore";
import { IconKey, IconProfile } from "../LandingPageIcon";
import { profileEditing, profileSecurity } from "../../App";

const MenuOptions = ({
    Icon,
    name,
    navigateTo,
    isActive,
}: {
    Icon: React.JSX.Element;
    name: string;
    navigateTo: string;
    isActive: boolean;
}) => {
    const navigate = useNavigate();

    return (
        <div
            className={`flex gap-2 items-center px-4 py-2 hover:cursor-pointer ${
                isActive && "border border-dark-grey hover:cursor-auto"
            }`}
            onClick={() => navigate(navigateTo)}
        >
            {Icon}
            <span className="font-jakarta-bold">{name}</span>
        </div>
    );
};

function RootUserLayout() {
    const userAuth = useSignupStore((state) => state.userAuth);
    const avatarPath = userAuth.avatar_path;

    const location = useLocation();

    return (
        <div className="flex flex-col text-xs text-dark-grey flex-1 w-full mx-10 border-t border-light-grey self-center px-10 pt-10">
            <div className="max-w-5xl self-center w-full grid grid-cols-[1.3fr_2fr] py-5">
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-[1fr_2fr] gap-8">
                        {avatarPath && (
                            <img
                                src={avatarPath}
                                alt="avatar-path"
                                className="w-full rounded-full"
                            />
                        )}
                        <div className="flex flex-col justify-end-safe gap-3 w-fit">
                            <div className="bg-dark-grey/10 border border-dark-grey px-6 py-2 text-sm">
                                <span>Choose your profile image</span>
                            </div>
                            <div className="flex flex-col">
                                <span>The image must be below 1MB</span>
                                <span>Supported format: .JPEG, .JPG, .PNG</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] gap-8">
                        <div className="w-full"></div>
                        <div className="flex flex-col gap-3 w-fit text-sm">
                            <MenuOptions
                                Icon={<IconProfile />}
                                name="My Profile"
                                navigateTo={profileEditing}
                                isActive={location.pathname === profileEditing}
                            />
                            <MenuOptions
                                Icon={<IconKey />}
                                name="Account Security"
                                navigateTo={profileSecurity}
                                isActive={location.pathname === profileSecurity}
                            />
                        </div>
                    </div>
                </div>
                <Outlet />
            </div>
        </div>
    );
}

export default RootUserLayout;
