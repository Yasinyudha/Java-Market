import { useEffect, useState } from "react";
import { IconMinus, IconPlus } from "../LandingPageIcon";
import { useLandingPage, useLandingPageStore } from "../LandingPageStore";

interface ProductProps {
    idProduct: number;
    quantity: number;
    name: string;
    price: number;
    filepath: string;
}

const Product = ({
    idProduct,
    quantity,
    name,
    price,
    filepath,
}: ProductProps) => {
    const [isSelected, setIsSelected] = useState<boolean>(false);
    const [selectedCheckout, setSelectedCheckout] =
        useLandingPage("selectedCheckout");
    const [totalPriceArr, setTotalPriceArr] = useLandingPage("totalPriceArr");

    const itemTotal = price * quantity;

    const handleSelectedCheckout = () => {
        if (!isSelected) {
            setSelectedCheckout(selectedCheckout + 1);
            setTotalPriceArr([...totalPriceArr, itemTotal]);
        } else {
            setSelectedCheckout(selectedCheckout - 1);

            const index = totalPriceArr.indexOf(itemTotal);
            if (index > -1) {
                const newArray = [...totalPriceArr];
                newArray.splice(index, 1);
                setTotalPriceArr(newArray);
            }
        }
    };

    return (
        <div
            key={idProduct}
            className="grid grid-cols-[1fr_3fr] gap-5 h-fit"
            style={{ opacity: isSelected ? "50%" : "100%" }}
        >
            <img src={filepath} alt="product" className="w-full" />
            <div className="flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-jakarta-bold text-dark-grey">
                        {name}
                    </h3>
                    <div className="grid grid-cols-3 gap-1 mt-5 text-base font-jakarta-medium text-dark-grey">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <span>Unit price</span>
                            <span>Rp. {price.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-3">
                            <span>Quantity</span>
                            <div className="flex items-center justify-evenly w-full">
                                <IconMinus />
                                <span>{quantity}</span>
                                <IconPlus />
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-3">
                            <span>Total price</span>
                            <span className="font-jakarta-bold text-web-purple">
                                Rp. {(price * quantity).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 self-end-safe text-sm">
                    <button
                        onClick={() => {
                            setIsSelected(!isSelected);
                            handleSelectedCheckout();
                        }}
                        className="bg-web-purple rounded-sm text-white font-jakarta-medium px-5 py-1.5 hover:cursor-pointer"
                    >
                        <span>Select</span>
                    </button>
                    <div className="bg-web-purple rounded-sm text-white font-jakarta-medium px-5 py-1.5">
                        <span>Delete</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

function OrderDetails() {
    const [checkouts, setCheckouts] = useState<ProductProps[]>();
    const selectedCheckout = useLandingPageStore(
        (state) => state.selectedCheckout,
    );
    const totalPriceArr = useLandingPageStore((state) => state.totalPriceArr);

    useEffect(() => {
        const handler = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8080/api/fetch/checkout",
                    { method: "GET", credentials: "include" },
                );
                if (response.ok) {
                    const data = await response.json();
                    setCheckouts(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        handler();
    }, []);
    return (
        <div className="flex-1 flex flex-col border-t border-light-grey pt-6 items-center h-full min-h-0">
            <div className="flex flex-col overflow-hidden max-w-7xl h-full min-h-0 gap-10">
                <div className="flex flex-col gap-10 overflow-y-auto flex-1 min-h-0">
                    {checkouts?.map((checkout, index) => (
                        <Product
                            key={index}
                            idProduct={checkout.idProduct}
                            quantity={checkout.quantity}
                            name={checkout.name}
                            price={checkout.price}
                            filepath={checkout.filepath}
                        />
                    ))}
                </div>
                <div className="bg-web-purple shrink-0 bottom-0 w-[60%] z-10 self-end-safe text-white px-8 pt-5 pb-2 flex flex-col">
                    <div className="flex flex-col gap-4">
                        <p className="font-jakarta-bold border-b border-white text-lg pb-2">
                            {selectedCheckout} products are selected
                        </p>
                        <span className="font-jakarta-bold text-2xl">
                            Total price: Rp.{" "}
                            {totalPriceArr
                                .reduce(
                                    (accumulator, currentValue) =>
                                        accumulator + currentValue,
                                    0,
                                )
                                .toLocaleString()}
                        </span>
                    </div>
                    <div className="bg-white px-5 py-2 rounded-sm w-fit self-end-safe">
                        <span className="font-jakarta-semibold text-sm text-black">
                            Checkout
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetails;
