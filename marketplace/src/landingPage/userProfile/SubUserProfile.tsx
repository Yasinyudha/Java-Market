import { useState } from "react";
import { useSignupStore } from "../../signupPage/SignupStore";

function SubUserProfile() {
    const userAuth = useSignupStore((state) => state.userAuth);

    const usernameField =
        userAuth.first_name && userAuth.last_name
            ? userAuth.first_name + " " + userAuth.last_name
            : "";
    const [username, setUsername] = useState<string>(usernameField);

    const firstNameField = userAuth.first_name ? userAuth.first_name : "";
    const [firstName, setFirstName] = useState<string>(firstNameField);

    const lastNameField = userAuth.last_name ? userAuth.last_name : "";
    const [lastName, setLastName] = useState<string>(lastNameField);

    return (
        <div className="w-full border border-dark-grey shadow-md rounded-xl mx-3 px-7 py-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-base font-jakarta-bold">
                    Profile Credentials
                </h2>
                <span>Change and adjust your credentials</span>
            </div>
            <div className="mt-5 flex flex-col gap-5">
                <div className="grid grid-cols-[1fr_6fr] gap-8 items-center">
                    <span>Username</span>
                    <div className="px-3 py-2 border border-dark-grey">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(String(e.target.value))
                            }
                            className="outline-none hover:outline-none"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-[1fr_6fr] gap-8 items-start">
                    <span>Name</span>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1">
                            <span>First Name</span>
                            <div className="px-3 py-2 border border-dark-grey">
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(String(e.target.value))
                                    }
                                    className="outline-none hover:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>Last Name</span>
                            <div className="px-3 py-2 border border-dark-grey">
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(String(e.target.value))
                                    }
                                    className="outline-none hover:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-[1fr_6fr] gap-8 items-center">
                    <span>Email</span>
                    <div className="flex gap-5 items-center">
                        <span>ya**********@gmail.com</span>
                        <span className="underline text-xs">Change email</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-10">
                <button className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all">
                    Save
                </button>
            </div>
        </div>
    );
}

export default SubUserProfile;
