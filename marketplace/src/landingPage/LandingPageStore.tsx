import { create } from "zustand";

interface ProductProps {
    id: number;
    name: string;
    review_number: number;
    city: string;
    province: string;
    price: number;
    filepath: string;
    country: string;
    trademark: string;
    address: string;
    description: string;
}

interface CategoryImageUrl {
    categories: string[];
    category_url: string[];
}

interface Price {
    price_low: string;
    price_high: string;
}

interface LandingPageStoreProps {
    // Hold category image urls
    categoryImageUrls: CategoryImageUrl | null;
    setCategoryImageUrls: (categoryImageUrls: CategoryImageUrl | null) => void;

    // Hold product image urls
    productImageUrls: string[];
    setProductImageUrls: (productImageUrls: string[]) => void;

    // Hold product data
    productData: ProductProps[];
    setProductData: (productData: ProductProps[]) => void;

    // Hold price intervals
    priceInterval: Price;
    setPriceInterval: (priceInterval: Partial<Price>) => void;

    // Hold the selected image state
    isProductSelected: boolean;
    setIsProductSelected: (isProductSelected: boolean) => void;

    // Hold selected image
    selectedProduct: ProductProps;
    setSelectedProduct: (selectedProduct: ProductProps) => void;

    // Hold quantity value of product
    quantityOfProduct: number;
    setQuantityOfProduct: (quantityOfProduct: number) => void;
}

export const useLandingPageStore = create<LandingPageStoreProps>((set) => ({
    categoryImageUrls: null,
    setCategoryImageUrls: (newImageUrls) =>
        set({ categoryImageUrls: newImageUrls }),

    productImageUrls: [],
    setProductImageUrls: (newProductImageUrls) =>
        set({ productImageUrls: newProductImageUrls }),

    productData: [],
    setProductData: (newProductData) => set({ productData: newProductData }),

    priceInterval: { price_high: "0", price_low: "0" },
    setPriceInterval: (newValue) =>
        set((state) => ({
            priceInterval: { ...state.priceInterval, ...newValue },
        })),

    isProductSelected: false,
    setIsProductSelected: (newVal) => set({ isProductSelected: newVal }),

    selectedProduct: {
        id: 0,
        name: "",
        review_number: 0,
        city: "",
        province: "",
        price: 0,
        filepath: "",
        country: "",
        trademark: "",
        address: "",
        description: "",
    },
    setSelectedProduct: (newVal) =>
        set((state) => ({
            selectedProduct: { ...state.selectedProduct, ...newVal },
        })),

    quantityOfProduct: 1,
    setQuantityOfProduct: (newVal) => set({ quantityOfProduct: newVal }),
}));

export function useLandingPage<K extends keyof LandingPageStoreProps & string>(
    key: K,
) {
    const setterKey =
        `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof LandingPageStoreProps;

    const value = useLandingPageStore((state) => state[key]);
    const setter = useLandingPageStore((state) => state[setterKey]) as (
        val: LandingPageStoreProps[K],
    ) => void;

    return [value, setter] as const;
}
