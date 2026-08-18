import { revalidatePath } from "next/cache";

export function revalidateApp() {
  revalidatePath("/", "layout");
}
