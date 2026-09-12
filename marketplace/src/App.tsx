import { Route, Routes } from "react-router-dom";
import { MainContentProducts } from "./landingPage/displayProduct/SubDisplayProduct";
import { useSignupStore } from "./signupPage/SignupStore";
import { useEffect } from "react";
import SignupPage from "./signupPage/SignupPage";
import LoginPage from "./signupPage/LoginPage";
import MainLayout from "./landingPage/RootLayout";
import MainContentProductDetails from "./landingPage/productDetail/SubProductDetail";
import ProductLayout from "./landingPage/ProductLayout";
import RootUserLayout from "./landingPage/userProfile/RootUserLayout";
import SubUserProfile from "./landingPage/userProfile/SubUserProfile";
import SubUserSecurity from "./landingPage/userProfile/SubUserSecurity";

export const rootPath = "/";
export const userSignup = "/user/signup";
export const userLogin = "/user/login";
export const productDetail = "/product/:slug";
export const profileEditing = "/user/profile";
export const profileSecurity = "/user/security";

export const createSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Hapus karakter khusus/simbol
        .replace(/[\s_-]+/g, "-") // Ubah spasi & underscore menjadi "-"
        .replace(/^-+|-+$/g, ""); // Hapus tanda "-" di ujung jika ada
};

function App() {
    const setUserAuth = useSignupStore((state) => state.setUserAuth);
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
                        first_name: data.first_name,
                        email: data.email,
                        avatar_path: data.avatar_url,
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
                    <Route path={profileEditing} element={<SubUserProfile />} />
                    <Route
                        path={profileSecurity}
                        element={<SubUserSecurity />}
                    />
                </Route>
                <Route element={<ProductLayout />}>
                    <Route path={rootPath} element={<MainContentProducts />} />
                    <Route
                        path={productDetail}
                        element={<MainContentProductDetails />}
                    />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
