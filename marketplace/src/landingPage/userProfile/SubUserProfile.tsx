import { useEffect, useState } from "react";
import { useSignup, useSignupStore } from "../../signupPage/SignupStore";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { profileEditingEmail, profileEditingOtp, rootPath } from "../../App";

interface OtpTimerProps {
    initialSeconds?: number; // e.g., 300 for 5 minutes
    onExpire?: () => void;
}

function OtpTimer({ initialSeconds = 300, onExpire }: OtpTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onExpire) onExpire();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    return (
        <span className="font-semibold text-web-purple">
            {timeLeft > 0
                ? formatTime(timeLeft)
                : "00:00 (please request your OTP again)"}
        </span>
    );
}

export const RequestOTPCode = () => {
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [timerKey, setTimerKey] = useState<number>(0);
    const [value, setValue] = useState<string>("");
    const userAuth = useSignupStore((state) => state.userAuth);

    const navigate = useNavigate();

    // If the page is refreshed, then request OTP code
    useEffect(() => {
        if (userAuth.email == null) return;
        setIsLoading(true);

        const handler = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/generate-otp",
                {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        email: userAuth.email,
                    }),
                },
            );

            if (response.ok) {
                setIsExpired(false);
                setTimerKey((prev) => prev + 1);

                // Set isLoading false
                setIsLoading(false);
            }
        };

        handler();
    }, [userAuth.email]);

    const handleResendOtp = () => {
        // If user click request OTP code, refresh page and request OTP again
        setIsLoading(true);

        const handler = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/generate-otp",
                {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        email: userAuth.email,
                    }),
                },
            );

            if (response.ok) {
                setIsExpired(false);
                setTimerKey((prev) => prev + 1);

                // Set isLoading false
                setIsLoading(false);
            }
        };

        handler();
    };

    const handleSendOTP = () => {
        const handler = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/verify-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: userAuth.email,
                        otp: value,
                    }),
                },
            );

            if (response.ok) {
                navigate(profileEditingEmail);
            }
        };

        handler();
    };

    return (
        <>
            <div className="flex flex-col gap-1">
                <h2 className="text-base font-jakarta-bold">
                    Verify Your OTP Credential
                </h2>
                <span>
                    Please input your OTP here that we've sent to your current
                    email. Remaining time before OTP expired is{" "}
                    <OtpTimer
                        key={timerKey}
                        initialSeconds={300}
                        onExpire={() => setIsExpired(true)}
                    />
                </span>
            </div>
            <div className="grid grid-cols-[1fr_6fr] gap-8 items-center mt-5">
                <span>OTP</span>
                <div className="px-3 py-2 border border-dark-grey">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(String(e.target.value))}
                        className="outline-none hover:outline-none w-full"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-10">
                <button
                    onClick={
                        isLoading || !isExpired
                            ? handleSendOTP
                            : handleResendOtp
                    }
                    disabled={isLoading}
                    className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all disabled:opacity-50"
                >
                    {isLoading
                        ? "Processing..."
                        : !isExpired
                          ? "Verify OTP Code"
                          : "Request OTP Code"}
                </button>
            </div>
        </>
    );
};

export const ProfileEditingEmail = () => {
    const [email, setEmail] = useState<string>("");
    const [userAuth, setUserAuth] = useSignup("userAuth");

    const navigate = useNavigate();

    const handleChangeEmail = () => {
        const handler = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/update-email",
                {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        email: email,
                    }),
                },
            );

            if (response.ok) {
                setUserAuth({
                    ...userAuth,
                    email: email,
                });
                navigate(rootPath);
            }
        };

        handler();
    };

    return (
        <>
            <div className="flex flex-col gap-1">
                <h2 className="text-base font-jakarta-bold">
                    Change Your Email
                </h2>
                <span>
                    Please change your email. Be aware of your new email.
                </span>
            </div>
            <div className="grid grid-cols-[1.2fr_6fr] gap-8 items-center mt-5">
                <span>Change Email</span>
                <div className="px-3 py-2 border border-dark-grey">
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="outline-none hover:outline-none w-full"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-10">
                <button
                    onClick={handleChangeEmail}
                    className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all disabled:opacity-50"
                >
                    Change Email
                </button>
            </div>
        </>
    );
};

export const ProfileCredentials = () => {
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

    useEffect(() => {
        const handleGetAuth = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/get-auth",
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            if (response.ok) {
                const data = await response.json();

                setUsername(data.first_name + " " + data.last_name);
                setFirstName(data.first_name);
                setLastName(data.last_name);
            }
        };

        handleGetAuth();
    }, [userAuth]);

    const handleSaveCredentials = () => {
        const changeCredentials = async () => {
            const response = await fetch(
                "http://localhost:8080/api/user/change-credentials",
                {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email: userAuth.email,
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();

                setUsername(data.user.first_name + " " + data.user.last_name);
                setFirstName(data.user.first_name);
                setLastName(data.user.last_name);
            }
        };

        changeCredentials();
    };

    return (
        <>
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
                        <span>
                            {userAuth.email
                                ? (() => {
                                      const [username, domain] =
                                          userAuth.email.split("@");
                                      return `${username.slice(0, 2)}${"*".repeat(10)}@${domain}`;
                                  })()
                                : ""}
                        </span>
                        <Link to={profileEditingOtp}>
                            <span className="underline text-xs">
                                Change email
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-10">
                <button
                    onClick={handleSaveCredentials}
                    className="bg-web-purple text-white px-6 py-2 font-jakarta-semibold rounded-md hover:cursor-pointer hover:bg-web-purple/90 transition-all"
                >
                    Save
                </button>
            </div>
        </>
    );
};

function SubUserProfile() {
    return (
        <div className="w-full border border-dark-grey shadow-md rounded-xl mx-3 px-7 py-8 h-fit">
            <Outlet />
        </div>
    );
}

export default SubUserProfile;
