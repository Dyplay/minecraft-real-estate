"use client";

import { useEffect, useState } from "react";
import UUIDForm from "../components/UUIDForm";
import { account } from "../../../lib/appwrite";
import { useRouter } from "next/navigation";

export default function UUIDPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch {
        router.push("/login"); // Redirect if not logged in
      }
    }
    checkUser();
  }, [router]);

  return user ? <UUIDForm user={user} /> : null;
}