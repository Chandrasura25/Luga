import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";


export const RequireToken = ({ children }: { children: JSX.Element }) => {
    console.log("this is token check")
    const { token } = useAuth();  // Get the token from context
    const location = useLocation();

    // If there's no token, redirect the user to the login page
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} />;
    }

    return children;  // Allow access to protected routes if the token exists
};
