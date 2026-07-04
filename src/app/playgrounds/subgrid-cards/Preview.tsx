"use client";

// The demo uses CSS subgrid so every card's image / title / body rows line up
// across the grid regardless of content length. Preview four cards whose bands
// align into shared rows, with different title widths to make the point.
const CARDS = [
  { hue: "#c7d2fe", title: "w-3/4" },
  { hue: "#fbcfe8", title: "w-1/2" },
  { hue: "#bbf7d0", title: "w-2/3" },
  { hue: "#fed7aa", title: "w-5/6" },
];

export function SubgridCardsPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 p-3">
      <div className="grid w-full max-w-[240px] grid-cols-2 gap-2">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded border border-black/10 bg-gray-100 p-1.5"
          >
            <div
              className="h-7 w-full rounded"
              style={{ backgroundColor: card.hue }}
            />
            <div className={`h-2 ${card.title} rounded bg-black/70`} />
            <div className="h-1.5 w-full rounded bg-black/15" />
            <div className="h-1.5 w-5/6 rounded bg-black/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
