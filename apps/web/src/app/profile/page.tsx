import type { Metadata } from "next";
import { ProfilePage } from "@/components/ProfilePage";

export const metadata: Metadata = { title: "마이페이지 | PSI Studio" };

export default function MyProfilePage() {
  return <ProfilePage />;
}
