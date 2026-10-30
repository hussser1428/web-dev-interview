import Icon from "@/components/icon";
import { getDictionary } from "@/i18n";

export default async function QuestionsIndex() {
  const t = await getDictionary();
  return (
    <div className="grid h-full place-items-center p-10 text-center text-muted max-md:hidden">
      <div className="flex flex-col items-center gap-3">
        <Icon name="book" size={40} className="text-brand" />
        {t.questions.select}
      </div>
    </div>
  );
}
