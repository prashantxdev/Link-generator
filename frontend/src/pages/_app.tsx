import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useAuth } from "@/stores/auth";

export default function App({ Component, pageProps }: AppProps) {
  const { getProfile } = useAuth();

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  return <Component {...pageProps} />;
}
