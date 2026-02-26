import type { Metadata } from "next";
import { GuideForm } from "../guide-form";

export const metadata: Metadata = {
  title: "New Guide - Admin",
};

export default function NewGuidePage() {
  return <GuideForm />;
}
