import { Outlet } from "react-router-dom";
import { IconFilter, IconSearchSidebar, IconStar } from "./LandingPageIcon";
import { useLandingPage, useLandingPageStore } from "./LandingPageStore";
import { useEffect } from "react";

const FilterByCategory = () => {
    const [imageUrl, setImageUrl] = useLandingPage("categoryImageUrls");

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8080/api/fetch/category",
                );
                if (response.ok) {
                    const data = await response.json();
                    setImageUrl(data);
                }
            } catch (error) {
                console.error("Failed to fetch category images:", error);
            }
        };

        fetchImages();
    }, []);

    if (!imageUrl) return;

    return (
        <>
            <div className="bg-web-purple px-3 py-2 text-white text-xs">
                <span>Filter by category</span>
            </div>
            <div className="rounded-xs bg-very-light-grey border border-dark-grey/10 flex gap-3 text-xs items-center px-3 py-1.5">
                <IconSearchSidebar />
                <input
                    type="text"
                    className="outline-none hover:outline-none flex-1"
                    placeholder="Search category..."
                />
            </div>
            <div className="text-xs text-dark-grey font-jakarta-semibold">
                <span>Top three categories</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center justify-evenly mt-2">
                {Array(3)
                    .fill(null)
                    .map((_, index) => (
                        <div key={index}>
                            <img
                                src={imageUrl.category_url[index]}
                                alt="image-url"
                                className="w-full rounded-t-md shadow-sm"
                            />
                            <div className="w-full py-1 flex items-center justify-center rounded-b-md bg-web-purple text-white text-xs font-jakarta-medium">
                                <span>
                                    {imageUrl.categories[index]
                                        .charAt(0)
                                        .toUpperCase() +
                                        imageUrl.categories[index].slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
            </div>
        </>
    );
};

const FilterByPrice = () => {
    const [priceInterval, setPriceInterval] = useLandingPage("priceInterval");

    const handlePriceChange = (
        field: keyof typeof priceInterval,
        value: string,
    ) => {
        setPriceInterval({
            ...priceInterval,
            [field]: value,
        });
    };

    return (
        <>
            <div className="bg-web-purple px-3 py-2 text-white text-xs mt-5">
                <span>Filter by price</span>
            </div>
            <div className="grid grid-cols-[3fr_1fr_3fr] text-xs text-dark-grey justify-end-safe">
                <div className="flex flex-col gap-1 font-jakarta-medium">
                    <span>Min price</span>
                    <div className="border border-dark-grey/30 bg-very-light-grey rounded-sm flex gap-1 px-2 py-1">
                        <span>Rp.</span>
                        <input
                            type="number"
                            value={priceInterval.price_low}
                            onChange={(e) =>
                                handlePriceChange(
                                    "price_low",
                                    String(e.target.value),
                                )
                            }
                            className="outline-none hover:outline-none w-full"
                        />
                    </div>
                </div>
                <div className="h-px bg-dark-grey mx-2 self-end mb-3"></div>
                <div className="flex flex-col gap-1 font-jakarta-medium">
                    <span>Max price</span>
                    <div className="border border-dark-grey/30 bg-very-light-grey rounded-sm flex gap-1 px-2 py-1">
                        <span>Rp.</span>
                        <input
                            type="number"
                            value={priceInterval.price_high}
                            onChange={(e) =>
                                handlePriceChange(
                                    "price_high",
                                    String(e.target.value),
                                )
                            }
                            className="outline-none hover:outline-none w-full"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

const FilterByReview = () => {
    const reviewOptions = ["5", ">4", ">3", ">2", ">1"];

    return (
        <>
            <div className="bg-web-purple px-3 py-2 text-white text-xs mt-5">
                <span>Filter by review</span>
            </div>
            <div className="grid grid-cols-5 text-xs gap-2">
                {reviewOptions.map((val, index) => (
                    <div
                        key={index}
                        className="flex gap-1 items-center justify-center bg-very-light-grey border border-dark-grey/50 rounded-full py-1"
                    >
                        <span>{val}</span>
                        <IconStar />
                    </div>
                ))}
            </div>
        </>
    );
};

const MainContentSidebar = () => {
    const setProductData = useLandingPageStore((state) => state.setProductData);
    const priceInterval = useLandingPageStore((state) => state.priceInterval);

    const handleProcessFetchProduct = async (
        e: React.SubmitEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();
        try {
            const res = await fetch(
                "http://localhost:8080/api/fetch/products",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        price_low: priceInterval.price_low,
                        price_high: priceInterval.price_high,
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

    return (
        <form
            onSubmit={handleProcessFetchProduct}
            className="flex flex-col gap-2 shadow-[0_0_5px_rgba(0,0,0,0.1)] rounded-lg px-4 py-4 w-[20%] sticky top-5"
        >
            <div className="flex items-end-safe justify-between border-b border-light-grey pb-2">
                <div className="flex gap-2 items-center font-jakarta-medium text-dark-grey">
                    <IconFilter />
                    <span>Filter by</span>
                </div>
                <span className="text-xs underline font-jakarta-semibold text-dark-grey">
                    Clear all
                </span>
            </div>

            {/* Filter by category */}
            <FilterByCategory />

            {/* Filter by price */}
            <FilterByPrice />

            {/* Filter by review */}
            <FilterByReview />

            {/* Submit button */}
            <button
                type="submit"
                className="w-full rounded-sm py-2 bg-dark-grey text-white flex items-center justify-center mt-5 hover:cursor-pointer text-xs font-jakarta-semibold"
            >
                <span>Filter Now</span>
            </button>
        </form>
    );
};

function ProductLayout() {
    return (
        <div className="flex-1 flex border-t border-light-grey pt-6 items-start">
            <MainContentSidebar />
            <Outlet />
        </div>
    );
}

export default ProductLayout;
