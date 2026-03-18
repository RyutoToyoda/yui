import { redirect } from "next/navigation";

export default function HomePage() {
  // マイページは廃止されたため、予定ページ（メイン画面）へリダイレクト
  redirect("/schedule");
}
