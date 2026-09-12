import { useState } from "react";
import { useLandingPage } from "../LandingPageStore";

const MainField = ({
    fieldName,
    onChangePassword,
}: {
    fieldName: string;
    onChangePassword: (value: string) => void;
}) => {
    const [value, setValue] = useState<string>("");

    return (
        <div className="grid grid-cols-[1fr_4fr] gap-4 items-center">
            <span>{fieldName}</span>
            <div className="px-3 py-2 border border-dark-grey">
                <input
                    type="password"
                    value={value}
                    onChange={(e) => {
                        onChangePassword(String(e.target.value));
                        setValue(String(e.target.value));
                    }}
                    className="outline-none hover:outline-none"
                />
            </div>
        </div>
    );
};

function SubUserSecurity() {
    const [passwordChangingValue, setPasswordChangingValue] = useLandingPage(
        "passwordChangingValue",
    );
    const handlePasswordChanging = (
        field: keyof typeof passwordChangingValue,
        value: string,
    ) => {
        setPasswordChangingValue({
            ...passwordChangingValue,
            [field]: value,
        });
    };

    return (
        <div className="w-full border border-dark-grey shadow-md rounded-xl mx-3 px-7 py-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-base font-jakarta-bold">Change Password</h2>
                <span>
                    Change your password, be careful not to share your password
                </span>
            </div>
            <div className="mt-5 flex flex-col gap-5">
                <MainField
                    fieldName="Current Password"
                    onChangePassword={(value) =>
                        handlePasswordChanging("current_password", value)
                    }
                />
                <MainField
                    fieldName="New Password"
                    onChangePassword={(value) =>
                        handlePasswordChanging("new_password", value)
                    }
                />
                <MainField
                    fieldName="Confirm Password"
                    onChangePassword={(value) =>
                        handlePasswordChanging("confirm_password", value)
                    }
                />
            </div>
            <div className="flex justify-end mt-10">
                <button className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all">
                    Change Password
                </button>
            </div>
        </div>
    );
}

export default SubUserSecurity;
