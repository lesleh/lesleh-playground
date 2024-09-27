import { Card } from "./_components/Card";

export default function SubgridCardsPage() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 m-4 auto-rows-auto">
      {Array.from({ length: 10 }).map((_, index) => (
        <Card key={index} />
      ))}
    </div>
  );
}
