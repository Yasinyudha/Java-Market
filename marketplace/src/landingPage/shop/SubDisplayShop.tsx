import { Outlet } from "react-router-dom";
import { IconFilter } from "../LandingPageIcon";
import { useLandingPageStore } from "../LandingPageStore";

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
        </form>
    );
};

export const MainDisplayShop = () => {
    return (
        <div className="flex flex-col text-xs text-dark-grey flex-1 w-full mx-10">
            <div className="flex flex-col">
                <span className="text-sm font-jakarta-bold">Shops</span>
                <span>Showing 7 shops</span>
            </div>
        </div>
    );
};

function SubDisplayShop() {
    return (
        <div className="flex-1 flex border-t border-light-grey pt-6 items-start pl-10">
            <MainContentSidebar />
            <Outlet />
        </div>
    );
}

export default SubDisplayShop;
