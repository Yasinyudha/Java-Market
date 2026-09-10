import { useNavigate } from "react-router-dom";
import {
    IconCartLarge,
    IconLargeStarts,
    IconMinus,
    IconPlus,
    IconRightArrow,
} from "../LandingPageIcon";
import { useLandingPage, useLandingPageStore } from "../LandingPageStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ProductDetailHeader = () => {
    const selectedProduct = useLandingPageStore(
        (state) => state.selectedProduct,
    );

    const [quantityOfProduct, setQuantityOfProduct] =
        useLandingPage("quantityOfProduct");
    const decreaseQuantityHandler = () => {
        if (quantityOfProduct === 1) {
            return;
        } else {
            const nextValue = quantityOfProduct - 1;
            setQuantityOfProduct(nextValue);
        }
    };
    const increaseQuantityHandler = () => {
        const nextValue = quantityOfProduct + 1;
        setQuantityOfProduct(nextValue);
    };

    return (
        <div className="grid grid-cols-2 mt-8 gap-8 overflow-auto max-h-full">
            <img
                src={selectedProduct.filepath}
                alt="image-product"
                className="w-full h-auto"
            />
            <div className="flex flex-col justify-between">
                <div className="flex flex-col">
                    <h2 className="font-jakarta-bold text-2xl">
                        {selectedProduct.name}
                    </h2>
                    <div className="flex mt-3 items-center gap-2">
                        <span className="font-jakarta-semibold text-xl text-web-purple">
                            4.9
                        </span>
                        <IconLargeStarts />
                        <span>{selectedProduct.review_number}+ Reviews</span>
                    </div>
                    <span className="font-jakarta-bold text-4xl text-web-purple mt-10">
                        Rp. {selectedProduct.price.toLocaleString()}
                    </span>
                    <div className="flex gap-10 items-center mt-5">
                        <span className="font-jakarta-medium text-base">
                            Quantity
                        </span>
                        <div className="flex items-center">
                            <div
                                className="bg-very-light-grey px-3 py-4 rounded-full flex items-center justify-center hover:cursor-pointer"
                                onClick={decreaseQuantityHandler}
                            >
                                <IconMinus />
                            </div>
                            <input
                                type="number"
                                value={quantityOfProduct}
                                className="outline-none active:outline-none w-20 text-center"
                            />
                            <div
                                className="bg-very-light-grey p-3 rounded-full flex items-center justify-center hover:cursor-pointer"
                                onClick={increaseQuantityHandler}
                            >
                                <IconPlus />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-5">
                    <div className="flex gap-5 bg-web-purple/10 border border-web-purple text-base items-center px-10 py-3 font-jakarta-semibold">
                        <IconCartLarge />
                        <span>Add to cart</span>
                    </div>
                    <div className="flex bg-web-purple px-15 py-3 font-jakarta-bold text-white items-center text-base">
                        <span>Buy now</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductSpecification = () => {
    const selectedProduct = useLandingPageStore(
        (state) => state.selectedProduct,
    );

    return (
        <div className="flex flex-col gap-5 mt-10">
            <h3 className="font-jakarta-bold text-xl">Product Specification</h3>
            <div className="flex flex-col gap-3 text-base">
                <ProductSpecificationDetails
                    type="Country"
                    country={selectedProduct.country}
                />
                <ProductSpecificationDetails
                    type="Trademark"
                    country={selectedProduct.trademark}
                />
                <ProductSpecificationDetails
                    type="Address"
                    country={selectedProduct.address}
                />
            </div>
        </div>
    );
};

const ProductSpecificationDetails = ({
    type,
    country,
}: {
    type: string;
    country: string;
}) => (
    <div className="grid grid-cols-[1.5fr_10fr]">
        <span>{type}</span>
        <span className="font-jakarta-semibold">{country}</span>
    </div>
);

const ProductDescription = () => {
    const selectedProduct = useLandingPageStore(
        (state) => state.selectedProduct,
    );

    return (
        <div className="flex flex-col gap-5 mt-10">
            <h3 className="font-jakarta-bold text-xl">Product Description</h3>
            <div className="flex flex-col gap-3 text-base">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => (
                            <h1
                                className="text-lg font-jakarta-bold text-black mt-4 mb-2"
                                {...props}
                            />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2
                                className="text-base font-jakarta-bold text-black mt-4 mb-2 border-b border-light-grey pb-1"
                                {...props}
                            />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3
                                className="text-sm font-jakarta-semibold text-black mt-3 mb-1"
                                {...props}
                            />
                        ),
                        p: ({ node, ...props }) => (
                            <p
                                className="leading-relaxed mb-3 text-dark-grey"
                                {...props}
                            />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul
                                className="list-disc pl-5 my-2 space-y-1"
                                {...props}
                            />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol
                                className="list-decimal pl-5 my-2 space-y-1"
                                {...props}
                            />
                        ),
                        li: ({ node, ...props }) => (
                            <li className="leading-normal" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                            <strong
                                className="font-jakarta-bold text-black"
                                {...props}
                            />
                        ),
                        hr: () => <hr className="my-4 border-light-grey" />,
                    }}
                >
                    {selectedProduct.description}
                </ReactMarkdown>
            </div>
        </div>
    );
};

function MainContentProductDetails() {
    const setIsProductSelected = useLandingPageStore(
        (state) => state.setIsProductSelected,
    );
    const selectedProduct = useLandingPageStore(
        (state) => state.selectedProduct,
    );

    const navigate = useNavigate();

    return (
        <div className="flex flex-col text-xs text-dark-grey flex-1 w-full mx-10">
            <div className="flex items-center w-full">
                <div className="flex gap-3 items-center">
                    <span
                        className="text-sm font-jakarta-bold hover:cursor-pointer hover:underline"
                        onClick={() => {
                            setIsProductSelected(false);
                            navigate("/");
                        }}
                    >
                        Products
                    </span>
                    <IconRightArrow />
                    <span>{selectedProduct.name}</span>
                </div>
            </div>
            <ProductDetailHeader />
            <ProductSpecification />
            <ProductDescription />
        </div>
    );
}

export default MainContentProductDetails;
