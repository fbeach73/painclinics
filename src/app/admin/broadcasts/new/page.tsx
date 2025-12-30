import { BroadcastForm } from "@/components/admin/broadcasts";

export const metadata = {
  title: "New Broadcast - Admin",
  description: "Create a new email broadcast",
};

export default function NewBroadcastPage() {
  return <BroadcastForm />;
}
