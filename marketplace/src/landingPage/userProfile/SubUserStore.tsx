import { DragEvent, useRef, useState } from "react";

interface ProductImageUploader {
    onImagesChange: (files: File) => void;
}

const RecommendationBox = ({ value }: { value: string }) => {
    return (
        <div className="flex items-center w-full pl-6 py-2 text-white rounded-sm bg-web-purple">
            <span>{value}</span>
        </div>
    );
};

const ProductInput = ({
    tabIndex,
    currentKey,
    value,
    onSetIndex,
}: {
    tabIndex: number;
    currentKey: number;
    value: string;
    onSetIndex: (number: number) => void;
}) => {
    return (
        <div
            onClick={() => onSetIndex(tabIndex)}
            className="flex flex-col text-sm font-jakarta-semibold items-center gap-1 cursor-pointer"
        >
            <span>{value}</span>
            {tabIndex === currentKey && (
                <div className="bg-web-purple h-1 w-full rounded-full"></div>
            )}
        </div>
    );
};

const ProductInformationContentTemplate = ({
    fieldName,
    isNumber,
    onFieldValue,
}: {
    fieldName: string;
    isNumber: boolean;
    onFieldValue: (val: string) => void;
}) => {
    const [value, setValue] = useState<string>("");

    return (
        <div className="grid grid-cols-[1fr_3fr] items-center">
            <span>{fieldName}</span>
            <div className="rounded-sm border border-dark-grey px-3 py-2">
                <input
                    value={value}
                    onChange={(e) => {
                        if (isNumber) {
                            const rawValue = e.target.value.replace(/\D/g, "");

                            onFieldValue(rawValue);
                            if (!rawValue) {
                                setValue("");
                            } else {
                                setValue(Number(rawValue).toLocaleString());
                            }
                        } else {
                            onFieldValue(e.target.value);
                            setValue(e.target.value);
                        }
                    }}
                    className="outline-none hover:outline-none"
                />
            </div>
        </div>
    );
};

const ProductCondition = ({
    value,
    isSelected,
    onSelect,
}: {
    value: string;
    isSelected: boolean;
    onSelect: (val: string) => void;
}) => {
    return (
        <div
            onClick={() => onSelect(value)}
            className="flex gap-1 items-center hover:cursor-pointer"
        >
            {isSelected ? (
                <div className="w-3 h-3 rounded-full border border-black bg-web-purple"></div>
            ) : (
                <div className="w-3 h-3 rounded-full border border-black"></div>
            )}
            <span>{value}</span>
        </div>
    );
};

const ProductImageUploader: React.FC<ProductImageUploader> = ({
    onImagesChange,
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith("image/")) return;

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        const newPreview = URL.createObjectURL(selectedFile);
        setPreview(newPreview);

        if (onImagesChange) {
            onImagesChange(selectedFile);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                        onImagesChange(selectedFile);
                    }
                }}
                className="hidden"
            />
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="grid grid-cols-[1fr_3fr] items-start mt-2"
            >
                <span>Product Image</span>
                <div
                    className={`rounded-sm border border-dashed border-dark-grey px-3 py-2 h-20 flex flex-col items-center justify-center ${
                        isDragging && "bg-web-purple opacity-5"
                    }`}
                >
                    <span className="opacity-50">Upload your image here</span>
                </div>
            </div>
        </div>
    );
};

const ProductInformationContent = () => {
    const productConditionValues = ["New", "Used by someone"];
    const [selectedVal, setSelectedVal] = useState<string>("");
    const [characters, setCharacters] = useState<number>(0);

    // File state
    const [file, setFile] = useState<File | null>(null);

    // Payload state
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [trademark, setTrademark] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("Indonesia");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            alert("Harap pilih foto produk terlebih dahulu");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("price", price);
        formData.append("trademark", trademark);
        formData.append("city", city);
        formData.append("province", province);
        formData.append("country", country);
        formData.append("address", address);
        formData.append("description", description);
        formData.append("photo", file);

        try {
            const response = await fetch(
                "http://localhost:8080/api/add-products",
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                },
            );

            const result = await response.json();
            if (response.ok) {
                alert("Produk berhasil dibuat");
            } else {
                alert("Gagal: " + result.message);
            }
        } catch (error) {
            console.error("Error submitting product: ", error);
        }
    };

    return (
        <div className="mt-8 flex flex-col gap-3">
            <ProductInformationContentTemplate
                fieldName="Product Name"
                isNumber={false}
                onFieldValue={(productName) => setName(productName)}
            />
            <ProductInformationContentTemplate
                fieldName="Product Brand"
                isNumber={false}
                onFieldValue={(productBrand) => setTrademark(productBrand)}
            />
            <ProductInformationContentTemplate
                fieldName="Price"
                isNumber={true}
                onFieldValue={(price) => setPrice(price)}
            />
            <div className="grid grid-cols-[1fr_3fr] items-center">
                <span>Product Condition</span>
                <div className="flex gap-3 items-center">
                    {productConditionValues.map((val, index) => (
                        <ProductCondition
                            key={index}
                            value={val}
                            isSelected={selectedVal === val}
                            onSelect={(val) => setSelectedVal(val)}
                        />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-[1fr_3fr] items-start mt-2">
                <span>Description</span>
                <div className="rounded-sm border border-dark-grey px-3 py-2 h-30 flex flex-col">
                    <textarea
                        className="outline-none hover:outline-none w-full h-full resize-none bg-transparent flex-1"
                        onChange={(e) => {
                            const value = e.target.value;

                            setCharacters(value.length);
                            setDescription(value);
                        }}
                    />
                    <div className="flex justify-end">
                        <span>{characters}/300 characters</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-[1fr_3fr] items-start">
                <span>General Location</span>
                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1">
                        <span>City</span>
                        <div className="rounded-sm border border-dark-grey px-3 py-2">
                            <input
                                onChange={(e) => setCity(e.target.value)}
                                className="outline-none hover:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Province</span>
                        <div className="rounded-sm border border-dark-grey px-3 py-2">
                            <input
                                onChange={(e) => setProvince(e.target.value)}
                                className="outline-none hover:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ProductInformationContentTemplate
                fieldName="Country"
                isNumber={false}
                onFieldValue={(country) => setCountry(country)}
            />
            <div className="grid grid-cols-[1fr_3fr] items-start mt-2">
                <span>Address</span>
                <div className="rounded-sm border border-dark-grey px-3 py-2 h-20 flex flex-col">
                    <textarea
                        className="outline-none hover:outline-none w-full h-full resize-none bg-transparent flex-1"
                        onChange={(e) => {
                            const value = e.target.value;

                            setCharacters(value.length);
                            setAddress(value);
                        }}
                    />
                </div>
            </div>
            <ProductImageUploader onImagesChange={(file) => setFile(file)} />
            <form onSubmit={handleSubmit} className="self-end">
                <button className="px-7 py-2 text-white bg-web-purple rounded-sm w-fit font-jakarta-semibold hover:cursor-pointer">
                    <span>Save</span>
                </button>
            </form>
        </div>
    );
};

function SubUserStore() {
    const [currentKey, setCurrentKey] = useState<number>(0);

    return (
        <div className="overflow-y-auto">
            <div className="h-150 pr-3">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-jakarta-bold">
                        Add Your New Product
                    </h2>
                    <span>
                        Recommendation to your new product to boost your
                        visibility
                    </span>
                </div>
                <div className="flex flex-col mt-3 gap-1">
                    <RecommendationBox value="1. Upload with minimum 3 product photos" />
                    <RecommendationBox value="2. Add video" />
                    <RecommendationBox value="3. Add description with minimum 150-300 characters" />
                </div>
                <div className="flex gap-6 mt-8">
                    <ProductInput
                        tabIndex={0}
                        currentKey={currentKey}
                        value="Product Information"
                        onSetIndex={(val) => setCurrentKey(val)}
                    />
                    <ProductInput
                        tabIndex={1}
                        currentKey={currentKey}
                        value="Sell Information"
                        onSetIndex={(val) => setCurrentKey(val)}
                    />
                </div>
                <ProductInformationContent />
            </div>
        </div>
    );
}

export default SubUserStore;
