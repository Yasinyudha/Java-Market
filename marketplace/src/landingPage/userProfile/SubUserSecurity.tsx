import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rootPath } from "../../App";

const MainField = ({
    fieldName,
    value,
    onChangePassword,
}: {
    fieldName: string;
    value: string;
    onChangePassword: (value: string) => void;
}) => {
    return (
        <div className="grid grid-cols-[1fr_4fr] gap-4 items-center">
            <span>{fieldName}</span>
            <div className="px-3 py-2 border border-dark-grey">
                <input
                    type="password"
                    value={value}
                    onChange={(e) => {
                        onChangePassword(String(e.target.value));
                    }}
                    className="outline-none hover:outline-none"
                />
            </div>
        </div>
    );
};

function SubUserSecurity() {
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const navigate = useNavigate();
    const handlePassword = () => {
        const handler = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/change-password",
                {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword,
                    }),
                },
            );

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.message);
            }

            // Reset everytime user change a password
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Navigate to landing page
            navigate(rootPath);
        };

        handler();
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
                    value={currentPassword}
                    onChangePassword={(value) => setCurrentPassword(value)}
                />
                <MainField
                    fieldName="New Password"
                    value={newPassword}
                    onChangePassword={(value) => setNewPassword(value)}
                />
                <MainField
                    fieldName="Confirm Password"
                    value={confirmPassword}
                    onChangePassword={(value) => setConfirmPassword(value)}
                />
            </div>
            <div className="flex justify-end mt-10">
                <button
                    onClick={handlePassword}
                    className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all"
                >
                    Change Password
                </button>
            </div>
        </div>
    );
}

export default SubUserSecurity;
