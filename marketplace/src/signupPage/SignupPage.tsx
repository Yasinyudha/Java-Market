import { Link, useNavigate } from "react-router-dom";
import { rootPath } from "../App";
import { IconBackArrow } from "./SignupPageIcon";
import { useSignup, useSignupStore } from "./SignupStore";
import { useEffect, useState } from "react";

interface InputNameTemplateProps {
    placeholder: string;
    isPassword: boolean;
    value: string;
    onDataChange: (data: string) => void;
}

const InputNameTemplate = ({
    placeholder,
    isPassword,
    value,
    onDataChange,
}: InputNameTemplateProps) => {
    return (
        <div className="w-full px-5 py-2 border border-dark-grey/30 rounded-md">
            <input
                type={isPassword ? "password" : "text"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onDataChange(e.target.value)}
                className="w-full outline-none hover:outline-none"
            />
        </div>
    );
};

const MainContent = () => {
    // Read credentials and setter directly from Zustand
    const [userCredentials, setUserCredentials] = useSignup("userCredentials");
    const [isTermSelected, setIsTermSelected] = useSignup("isTermSelected");
    const setUserAuth = useSignupStore((state) => state.setUserAuth);

    // Set authenticated state
    const setIsAuthenticated = useSignupStore(
        (state) => state.setIsAuthenticated,
    );

    // Define hook for navigating to another page
    const navigate = useNavigate();

    // Reset form function
    const resetForm = useSignupStore((state) => state.resetForm);

    // On change handler
    const handleInputChange = (
        field: keyof typeof userCredentials,
        value: string | boolean,
    ) => {
        setUserCredentials({
            ...userCredentials,
            [field]: value,
        });
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:8080/api/user/signup",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userCredentials),
                    credentials: "include",
                },
            );

            if (response.ok) {
                const data = await response.json();

                setUserAuth({
                    avatar_path: data.avatar_path,
                });

                // Reset the form
                resetForm();

                // Set is authenticated to true
                setIsAuthenticated(true);

                // Redirect to dashboard page
                navigate(rootPath);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const [imageUrl, setImageUrl] = useState<string>("");
    const [googleUrl, setGoogleUrl] = useState<string>("");
    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8080/api/fetch/signup-image",
                );
                if (res.ok) {
                    const data = await res.json();
                    setImageUrl(data.filepath);
                }
            } catch (error) {
                console.error("Failed to fetch banner image:", error);
            }
        };

        const fetchGoogleImage = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8080/api/fetch/image",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            filepath: "assets/Google Logo.webp",
                        }),
                    },
                );
                if (res.ok) {
                    const data = await res.json();
                    setGoogleUrl(data.filepath);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchImage();
        fetchGoogleImage();
    }, []);

    return (
        <div className="w-[60%] h-[60%] grid grid-cols-2">
            <div className="relative">
                <img
                    src={imageUrl}
                    alt="image-login"
                    className="w-full h-full rounded-l-2xl shadow-md"
                />
                <Link to={rootPath}>
                    <div className="absolute px-4 py-1 bg-web-purple top-5 left-5 rounded-full text-white text-xs flex gap-2 items-center">
                        <IconBackArrow />
                        <span>Back to home</span>
                    </div>
                </Link>
                <div className="absolute bottom-8 right-0 flex items-center justify-between pl-5 text-white w-full">
                    <span className="font-jakarta-medium whitespace-nowrap text-xl">
                        Shop with ease
                    </span>
                    <div className="bg-white h-1 w-[65%]"></div>
                </div>
            </div>
            <div className="rounded-r-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-dark-grey/20 px-8 py-8 text-dark-grey">
                <h1 className="text-3xl font-jakarta-semibold">
                    Create an account
                </h1>
                <div className="flex gap-1 text-xs px-1 mt-5">
                    <span>Already have an account?</span>
                    <span className="text-web-purple underline">
                        Log in here
                    </span>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-1 mt-10">
                        <InputNameTemplate
                            placeholder="First name..."
                            isPassword={false}
                            value={userCredentials.first_name ?? ""}
                            onDataChange={(value) =>
                                handleInputChange("first_name", value)
                            }
                        />
                        <InputNameTemplate
                            placeholder="Last name..."
                            isPassword={false}
                            value={userCredentials.last_name ?? ""}
                            onDataChange={(value) =>
                                handleInputChange("last_name", value)
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-3 mt-3">
                        <InputNameTemplate
                            placeholder="Email"
                            isPassword={false}
                            value={userCredentials.email ?? ""}
                            onDataChange={(value) =>
                                handleInputChange("email", value)
                            }
                        />
                        <InputNameTemplate
                            placeholder="Input your password"
                            isPassword={true}
                            value={userCredentials.password ?? ""}
                            onDataChange={(value) =>
                                handleInputChange("password", value)
                            }
                        />
                    </div>
                    <div className="flex items-center text-xs mt-3 gap-2">
                        <div
                            className={`w-3 h-3 border-2 border-dark-grey/50 p-1 hover:cursor-pointer ${
                                isTermSelected
                                    ? "bg-dark-grey"
                                    : "bg-transparent"
                            }`}
                            onClick={() => {
                                setIsTermSelected(!isTermSelected);
                                handleInputChange(
                                    "terms_accepted",
                                    !isTermSelected,
                                );
                            }}
                        ></div>
                        <span>
                            I agree with{" "}
                            <span className="text-web-purple underline">
                                terms and conditions
                            </span>
                        </span>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 flex items-center justify-center bg-web-purple rounded-md text-white mt-10 hover:cursor-pointer"
                    >
                        <span>Create account</span>
                    </button>
                </form>
                <div className="grid grid-cols-[2fr_1fr_2fr] items-center gap-3 text-xs mt-3">
                    <div className="w-full border border-dark-grey"></div>
                    <span className="whitespace-nowrap">Or register with</span>
                    <div className="w-full border border-dark-grey"></div>
                </div>
                <div className="rounded-md border border-dark-grey/50 w-full py-3 flex gap-3 items-center justify-center mt-3">
                    <img src={googleUrl} alt="Google Logo" className="w-5" />
                    <span>Google</span>
                </div>
            </div>
        </div>
    );
};

function SignupPage() {
    return (
        <div className="h-screen flex items-center justify-center font-jakarta-regular text-sm">
            <MainContent />
        </div>
    );
}

export default SignupPage;
