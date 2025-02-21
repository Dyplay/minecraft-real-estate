"use client";

import { useEffect, useState } from "react";
import UUIDForm from "../components/UUIDForm";
import { account } from "../../../lib/appwrite";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function UUIDPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch {
        toast.error("❌ Failed to fetch user data. Please log in again.");
      }
    }
    checkUser();
  }, [router]);

  return user ? <UUIDForm user={user} /> : null;
}