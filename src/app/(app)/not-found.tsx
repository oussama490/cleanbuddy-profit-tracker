import Link from "next/link";

export default function NotFound() {
  return (
    <div className="cb-card max-w-lg">
      <p className="cb-kicker">404</p>
      <h1 className="cb-page-title mt-2">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-muted">عد إلى لوحة التحكم وتابع من هناك.</p>
      <Link href="/" className="cb-btn mt-5 inline-flex items-center px-5">
        الرئيسية
      </Link>
    </div>
  );
}
