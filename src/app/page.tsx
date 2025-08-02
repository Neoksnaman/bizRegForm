import { BizRegForm } from "@/components/biz-reg-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary tracking-tight">
            Business Registration Form
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Please fill out the form below to provide the necessary information for your business registration.
          </p>
        </header>
        <BizRegForm />
      </div>
    </main>
  );
}
