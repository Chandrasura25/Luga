import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import ChatbotPage from "./components/ChatbotPage";
import AboutPage from "./components/AboutPage";
import LoginPage from "./components/LoginPage";
import CancelPage from "./components/CancelPage";
import SuccessPage from "./components/SuccessPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPassword from "./components/ForgotPassword";
import ResetCode from "./components/ResetCode";

import "./App.css";
import PasswordReset from "./components/PasswordReset";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/demo" element={<ChatbotPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-code" element={<ResetCode />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}

export default App;
