import { Routes, Route } from "react-router-dom";
import HomePage from '@/app/home/page';
import LoginPage from '@/app/login/page';
import SignUpPage from '@/app/signup/page';
import DashboardPage from "@/app/dashboard/page";
import { ProtectedRoute } from "@/components/sign-in-up/protected-route";
import FileUploadPage from "@/app/dashboard/upload/page";
import DashboardOverview from "@/app/dashboard/overview";
import ViewGalleryPage from "@/app/dashboard/view-gallery/page";
import EditGalleryPage from "@/app/dashboard/edit-gallery/page";
import FolderManagementPage from "@/app/dashboard/folder-management/page";

export function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="upload/:modelType" element={<FileUploadPage />} />
                    <Route path="view-gallery" element={<ViewGalleryPage />} />
                    <Route path="edit-gallery" element={<EditGalleryPage />} />
                    <Route path="folder-management" element={<FolderManagementPage />} />
                </Route>
            </Route>


        </Routes>
    );
}
