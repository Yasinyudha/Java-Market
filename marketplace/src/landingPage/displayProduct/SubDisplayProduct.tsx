import { useEffect } from "react";
import { IconDropdown, IconLocation, IconStar } from "../LandingPageIcon";
import { useLandingPage, useLandingPageStore } from "../LandingPageStore";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../App";

export const MainContentProducts = () => {
    const [productData, setProductData] = useLandingPage("productData");

    const setSelectedProduct = useLandingPageStore(
        (state) => state.setSelectedProduct,
    );
    const setIsProductSelected = useLandingPageStore(
        (state) => state.setIsProductSelected,
    );

    const navigate = useNavigate();

    useEffect(() => {
        let createdUrls: string[] = [];

        const fetchProductsAndImages = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8080/api/fetch/products",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            price_low: "0",
                            price_high: "0",
                        }),
                    },
                );
                if (!res.ok) throw new Error("Network response was not ok");
                const products = await res.json();

                setProductData(products);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            }
        };

        fetchProductsAndImages();

        // Cleanup function to prevent memory leaks when the component unmounts
        return () => {
            createdUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <div className="flex flex-col text-xs text-dark-grey flex-1 w-full mx-10">
            <div className="flex justify-between w-full items-end">
                <div className="flex flex-col">
                    <span className="text-sm font-jakarta-bold">Products</span>
                    <span>Showing 7,457 products</span>
                </div>
                <div className="flex gap-2 items-center">
                    <span>Sort by</span>
                    <div className="flex items-center h-fit px-2 bg-very-light-grey border border-dark-grey/50 rounded-sm gap-2 py-1">
                        <span>Review</span>
                        <IconDropdown />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 mt-8 gap-3">
                {productData.map((product, index) => (
                    <div
                        key={index}
                        className="transition-all duration-150 ease-in-out hover:scale-103 hover:cursor-pointer"
                        onClick={() => {
                            setIsProductSelected(true);
                            setSelectedProduct({
                                id: product.id,
                                name: product.name,
                                review_number: product.review_number,
                                city: product.city,
                                province: product.province,
                                price: product.price,
                                filepath: product.filepath,
                                country: product.country,
                                trademark: product.trademark,
                                address: product.address,
                                description: product.description,
                            });
                            navigate(`/product/${createSlug(product.name)}`);
                        }}
                    >
                        <img
                            src={product.filepath}
                            className="w-full rounded-t-md shadow-[0_0_5px_rgba(0,0,0,0.1)]"
                        />
                        <div className="w-full px-5 rounded-md py-4 shadow-[0_0_5px_rgba(0,0,0,0.1)] border border-dark-grey/10">
                            <span className="font-jakarta-bold text-sm">
                                {product.name}
                            </span>
                            <div className="flex gap-1 items-center mt-1">
                                <div className="flex gap-0.5 items-center">
                                    {Array(5)
                                        .fill(null)
                                        .map((_, index) => (
                                            <IconStar key={index} />
                                        ))}
                                </div>
                                <span className="text-xs">
                                    {product.review_number}+ Reviews
                                </span>
                            </div>
                            <div className="flex gap-1 mt-3 items-center">
                                <IconLocation />
                                <span>
                                    {product.city}, {product.province}
                                </span>
                            </div>
                            <div className="mt-5 flex flex-col">
                                <span className="text-xl font-jakarta-bold text-web-purple">
                                    Rp. {product.price.toLocaleString()}
                                </span>
                                <span className="text-xs font-jakarta-medium text-web-purple">
                                    Non-Negotiable
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
