import { Route, Routes } from "react-router-dom";
import { MainContentProducts } from "./landingPage/displayProduct/SubDisplayProduct";
import { useSignup, useSignupStore } from "./signupPage/SignupStore";
import { useEffect } from "react";
import SignupPage from "./signupPage/SignupPage";
import LoginPage from "./signupPage/LoginPage";
import MainLayout from "./landingPage/RootLayout";
import MainContentProductDetails from "./landingPage/productDetail/SubProductDetail";
import ProductLayout from "./landingPage/ProductLayout";
import RootUserLayout from "./landingPage/userProfile/RootUserLayout";
import SubUserProfile, {
    RequestOTPCode,
    ProfileCredentials,
    ProfileEditingEmail,
} from "./landingPage/userProfile/SubUserProfile";
import SubUserSecurity from "./landingPage/userProfile/SubUserSecurity";
import SubUserChangeImage from "./landingPage/userProfile/SubUserChangeImage";
import OrderDetails from "./landingPage/orderDetails/OrderDetails";
import SubDisplayShop, {
    MainDisplayShop,
} from "./landingPage/shop/SubDisplayShop";
import LoginStore from "./signupStore/LoginShop";
import SignupStore from "./signupStore/SignupShop";
import SubUserStore from "./landingPage/userProfile/SubUserStore";

export const rootPath = "/";
export const userSignup = "/user/signup";
export const userLogin = "/user/login";
export const productDetail = "/product/:id/:slug";
export const profileEditing = "/user/profile";
export const profileEditingImage = "/user/profile/change-image";
export const profileEditingEmail = "/user/profile/change-email";
export const profileEditingOtp = "/user/profile/change-email/otp";
export const profileSecurity = "/user/security";
export const profileStore = "/user/store";
export const orderDetails = "/product/:user/orders";
export const shop = "/shop";
export const loginStore = "/shop/login";
export const signupStore = "/shop/signup";

export const createSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Hapus karakter khusus/simbol
        .replace(/[\s_-]+/g, "-") // Ubah spasi & underscore menjadi "-"
        .replace(/^-+|-+$/g, ""); // Hapus tanda "-" di ujung jika ada
};

function App() {
    const [userAuth, setUserAuth] = useSignup("userAuth");
    const setIsAuthenticated = useSignupStore(
        (state) => state.setIsAuthenticated,
    );

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8080/api/user/profile",
                    {
                        method: "GET",
                        credentials: "include",
                    },
                );

                if (response.ok) {
                    const data = await response.json();

                    setUserAuth({
                        ...userAuth,
                        first_name: data.first_name,
                        email: data.email,
                        avatar_path: data.avatar_url,
                        is_seller: data.is_seller,
                        logo_filepath: data.logo_filepath,
                        store_name: data.store_name,
                    });

                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Session restored failed:", error);
            }
        };

        fetchUserProfile();
    }, [setUserAuth, setIsAuthenticated]);

    return (
        <Routes>
            <Route path={userSignup} element={<SignupPage />} />
            <Route path={userLogin} element={<LoginPage />} />
            <Route element={<MainLayout />}>
                <Route element={<RootUserLayout />}>
                    <Route element={<SubUserProfile />}>
                        <Route
                            path={profileEditing}
                            element={<ProfileCredentials />}
                        />
                        <Route
                            path={profileEditingOtp}
                            element={<RequestOTPCode />}
                        />
                        <Route
                            path={profileEditingEmail}
                            element={<ProfileEditingEmail />}
                        />
                        <Route path={profileStore} element={<SubUserStore />} />
                    </Route>
                    <Route
                        path={profileSecurity}
                        element={<SubUserSecurity />}
                    />
                    <Route
                        path={profileEditingImage}
                        element={<SubUserChangeImage />}
                    />
                </Route>
                <Route element={<ProductLayout />}>
                    <Route path={rootPath} element={<MainContentProducts />} />
                    <Route
                        path={productDetail}
                        element={<MainContentProductDetails />}
                    />
                </Route>
                <Route element={<SubDisplayShop />}>
                    <Route path={shop} element={<MainDisplayShop />} />
                </Route>
                <Route path={orderDetails} element={<OrderDetails />} />
            </Route>
            <Route path={loginStore} element={<LoginStore />} />
            <Route path={signupStore} element={<SignupStore />} />
        </Routes>
    );
}

export default App;
