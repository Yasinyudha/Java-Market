import { Link, useNavigate } from "react-router-dom";
import { rootPath } from "../App";
import { useEffect, useState, useRef } from "react";
import { IconBackArrow } from "../signupPage/SignupPageIcon";
import { IconUpload } from "./SignupIcon";

interface InputNameTemplateProps {
    placeholder: string;
    isPassword?: boolean;
    value: string;
    onDataChange: (data: string) => void;
}

interface TextareaTemplateProps {
    placeholder: string;
    value: string;
    minRows?: number;
    onDataChange: (data: string) => void;
}

const InputNameTemplate = ({
    placeholder,
    isPassword = false,
    value,
    onDataChange,
}: InputNameTemplateProps) => {
    return (
        <div className="w-full px-5 py-2 border border-dark-grey/30 rounded-md text-sm">
            <input
                type={isPassword ? "password" : "text"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onDataChange(e.target.value)}
                className="w-full outline-none hover:outline-none bg-transparent"
            />
        </div>
    );
};

const TextareaTemplate = ({
    placeholder,
    value,
    minRows = 2,
    onDataChange,
}: TextareaTemplateProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div className="w-full px-5 py-2 border border-dark-grey/30 rounded-md text-sm">
            <textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                rows={minRows}
                onChange={(e) => onDataChange(e.target.value)}
                className="w-full outline-none hover:outline-none resize-none bg-transparent overflow-hidden"
            />
        </div>
    );
};

const MainContent = () => {
    const [storeCredentials, setStoreCredentials] = useState({
        name: "",
        slug: "",
        phone_number: "",
        description: "",
        address: "",
        terms_accepted: false,
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [isTermSelected, setIsTermSelected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false); // 1. Tambah state isLoading

    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-");
    };

    const handleInputChange = (
        field: keyof typeof storeCredentials,
        value: string | boolean,
    ) => {
        if (field === "name" && typeof value === "string") {
            const slug = generateSlug(value);
            setStoreCredentials((prev) => ({
                ...prev,
                name: value,
                slug: slug,
            }));
        } else {
            setStoreCredentials((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            setLogoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isTermSelected) {
            alert("Please accept the terms and conditions");
            return;
        }

        setIsLoading(true); // 2. Aktifkan status loading saat mulai request

        const formData = new FormData();
        formData.append("name", storeCredentials.name);
        formData.append("slug", storeCredentials.slug);
        formData.append("phone_number", storeCredentials.phone_number);
        formData.append("description", storeCredentials.description);
        formData.append("address", storeCredentials.address);
        formData.append("terms_accepted", String(isTermSelected));

        if (logoFile) {
            formData.append("logo", logoFile);
        }

        try {
            const response = await fetch(
                "http://localhost:8080/api/user/register-store",
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                },
            );

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Store created successfully!");
                navigate(rootPath);
            } else {
                alert(data.message || "Failed to register store");
            }
        } catch (error) {
            console.error("Failed to register store:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false); // 3. Matikan status loading saat proses selesai
        }
    };

    return (
        <div className="w-[60%] h-[65%] grid grid-cols-2">
            {/* Panel Kiri: Image Uploader */}
            <div
                className="relative bg-very-light-grey rounded-l-2xl border-y border-l border-dark-grey/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-colors hover:bg-dark-grey/5"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleFileSelect(e.target.files[0]);
                        }
                    }}
                />

                {logoPreview ? (
                    <>
                        <img
                            src={logoPreview}
                            alt="Store Logo Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-jakarta-medium text-sm">
                            Click or drag to replace logo
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-6 text-center text-dark-grey/70">
                        <div className="w-12 h-12 rounded-full bg-web-purple/10 flex items-center justify-center text-web-purple">
                            <IconUpload />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-jakarta-semibold text-dark-grey text-base">
                                Upload Store Logo
                            </span>
                            <span className="text-xs text-dark-grey/60">
                                Drag and drop or click to browse image
                            </span>
                        </div>
                    </div>
                )}

                <Link to={rootPath} onClick={(e) => e.stopPropagation()}>
                    <div className="absolute px-4 py-1 bg-web-purple top-5 left-5 rounded-full text-white text-xs flex gap-2 items-center z-10 hover:opacity-90">
                        <IconBackArrow />
                        <span>Back to home</span>
                    </div>
                </Link>
            </div>

            {/* Panel Kanan: Form Data Toko */}
            <div className="rounded-r-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-dark-grey/20 px-8 py-6 text-dark-grey flex flex-col justify-between h-full overflow-hidden bg-white">
                <div>
                    <h1 className="text-3xl font-jakarta-semibold">
                        Open your store
                    </h1>
                    <div className="flex gap-1 text-xs px-1 mt-1">
                        <span>
                            Ready to sell products? Fill in your store details.
                        </span>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 flex flex-col justify-between min-h-0 mt-8"
                >
                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <InputNameTemplate
                                placeholder="Store name"
                                value={storeCredentials.name}
                                onDataChange={(value) =>
                                    handleInputChange("name", value)
                                }
                            />
                            <InputNameTemplate
                                placeholder="Store username"
                                value={storeCredentials.slug}
                                onDataChange={(value) =>
                                    handleInputChange("slug", value)
                                }
                            />
                        </div>

                        <InputNameTemplate
                            placeholder="Whatsapp phone number"
                            value={storeCredentials.phone_number}
                            onDataChange={(value) =>
                                handleInputChange("phone_number", value)
                            }
                        />

                        <TextareaTemplate
                            placeholder="Store Description"
                            minRows={4}
                            value={storeCredentials.description}
                            onDataChange={(value) =>
                                handleInputChange("description", value)
                            }
                        />

                        <TextareaTemplate
                            placeholder="Full address"
                            minRows={2}
                            value={storeCredentials.address}
                            onDataChange={(value) =>
                                handleInputChange("address", value)
                            }
                        />
                    </div>

                    <div className="shrink-0 pt-4 flex flex-col gap-3">
                        <div className="flex items-center text-xs gap-2">
                            <div
                                className={`w-3 h-3 border-2 border-dark-grey/50 p-1 ${
                                    isLoading
                                        ? "cursor-not-allowed opacity-50"
                                        : "hover:cursor-pointer"
                                } ${
                                    isTermSelected
                                        ? "bg-dark-grey"
                                        : "bg-transparent"
                                }`}
                                onClick={() => {
                                    if (isLoading) return; // Cegah interaksi checkbox saat loading
                                    const nextState = !isTermSelected;
                                    setIsTermSelected(nextState);
                                    handleInputChange(
                                        "terms_accepted",
                                        nextState,
                                    );
                                }}
                            ></div>
                            <span>
                                I agree with{" "}
                                <span className="text-web-purple underline">
                                    seller terms and conditions
                                </span>
                            </span>
                        </div>

                        {/* 4. Implementasi UI Tombol Loading */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 flex items-center justify-center rounded-md text-white font-jakarta-semibold transition-colors ${
                                isLoading
                                    ? "bg-web-purple/70 cursor-not-allowed"
                                    : "bg-web-purple hover:cursor-pointer"
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    {/* Simple Spinner SVG */}
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span>Registering...</span>
                                </div>
                            ) : (
                                <span>Register Store</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function SignupStore() {
    return (
        <div className="h-screen flex items-center justify-center font-jakarta-regular text-sm">
            <MainContent />
        </div>
    );
}

export default SignupStore;
