import { Routes, Route } from "react-router-dom";
import LoginPage from '@/app/login/page';
import SignUpPage from '@/app/signup/page';
import DashboardPage from "@/app/dashboard/page";
import { ProtectedRoute } from "@/components/sign-in-up/protected-route";
import FileUploadPage from "@/app/dashboard/upload/page";
import DashboardOverview from "@/app/dashboard/overview";

import FolderManagementPage from "@/app/dashboard/folder-management/page";

export function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="file-upload" element={<FileUploadPage />} />
                    <Route path="folder-management" element={<FolderManagementPage />} />
                </Route>
            </Route>


        </Routes>
    );
}
