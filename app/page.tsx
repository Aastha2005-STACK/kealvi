import PollSection from "./components/PollSection";
import QuestionsList from "./questions-list";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const result = await getQuestionsPage(0, PAGE_SIZE);

  const questions = Array.isArray(result?.questions)
    ? result.questions
    : [];

  const hasMore = result?.hasMore ?? false;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-medium">Live Q&amp;A</h1>

      <PollSection />

      <QuestionsList
        initialQuestions={questions}
        initialHasMore={hasMore}
      />
    </main>
  );
}
