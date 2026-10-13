import "./globals.css";
import type {Metadata} from "next";
import {AppShell} from "@/components/AppShell";
export const metadata:Metadata={title:"ULTD TRANS PRO — Business OS",description:"AI-native business operations, intelligence and automation platform"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppShell>{children}</AppShell></body></html>}
