import { getDictionary } from "@/i18n";

export default async function QuestionsIndex() {
  const t = await getDictionary();
  return (
    <div className="grid h-full place-items-center p-10 text-center text-muted max-md:hidden">
      <div>
        <div className="mb-3 text-4xl">☰</div>
        {t.questions.select}
      </div>
    </div>
  );
}
