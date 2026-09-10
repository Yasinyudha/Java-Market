import { create } from "zustand";

export interface SignupCredentials {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    password: string | null;
    terms_accepted: boolean | null;
}

export interface AuthCredentials {
    first_name: string | null;
    email: string | null;
    avatar_path: string | null;
}

interface SignupProps {
    // Hold user credential
    userCredentials: SignupCredentials;
    setUserCredentials: (userCredentials: Partial<SignupCredentials>) => void;

    // Hold auth after user signing up
    userAuth: AuthCredentials;
    setUserAuth: (userAuth: Partial<AuthCredentials>) => void;

    // Hold selected terms agreement
    isTermSelected: boolean;
    setIsTermSelected: (isTermSelected: boolean) => void;

    // Hold authentication state
    isAuthenticated: boolean;
    setIsAuthenticated: (isAuthenticated: boolean) => void;

    // Hold reset function
    resetForm: () => void;
}

export const useSignupStore = create<SignupProps>((set) => ({
    userCredentials: {
        first_name: null,
        last_name: null,
        email: null,
        password: null,
        terms_accepted: null,
        avatar_path: null,
    },
    setUserCredentials: (newCredentials) =>
        set((state) => ({
            userCredentials: { ...state.userCredentials, ...newCredentials },
        })),

    userAuth: {
        first_name: null,
        email: null,
        avatar_path: null,
    },
    setUserAuth: (newAuth) =>
        set((state) => ({
            userAuth: { ...state.userAuth, ...newAuth },
        })),

    isTermSelected: false,
    setIsTermSelected: (newValue) => set({ isTermSelected: newValue }),

    isAuthenticated: false,
    setIsAuthenticated: (newVal) => set({ isAuthenticated: newVal }),

    // Helper function
    resetForm: () =>
        set({
            userCredentials: {
                first_name: null,
                last_name: null,
                email: null,
                password: null,
                terms_accepted: null,
            },
            isTermSelected: false,
        }),
}));

export function useSignup<K extends keyof SignupProps & string>(key: K) {
    const setterKey =
        `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof SignupProps;

    const value = useSignupStore((state) => state[key]);
    const setter = useSignupStore((state) => state[setterKey]) as (
        val: SignupProps[K],
    ) => void;

    return [value, setter] as const;
}
