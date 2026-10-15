import { redirect } from "next/navigation";

// Prices now live together with the other calculator parameters.
export default function PricesRedirect() {
  redirect("/admin/calculator");
}
