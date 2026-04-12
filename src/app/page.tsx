import type { NextPage } from "next";
import { PlaygroundCard } from "./_components/PlaygroundCard";
import { SpirographPreview } from "./playgrounds/spirograph/Preview";
import { NumberGuesserPreview } from "./playgrounds/number-guesser/Preview";
import { RockPaperScissorsPreview } from "./playgrounds/rock-paper-scissors/Preview";
import { HomerPreview } from "./playgrounds/homer/Preview";
import { LightsOutPreview } from "./playgrounds/lights-out/Preview";
import { UnitPricePreview } from "./playgrounds/unit-price/Preview";
import { SubgridCardsPreview } from "./playgrounds/subgrid-cards/Preview";
import { GradientsPreview } from "./playgrounds/gradients/Preview";
import { GraphsPreview } from "./playgrounds/graphs/Preview";
import { PlanetsPreview } from "./playgrounds/planets/Preview";
import { FoodAnalyzerPreview } from "./playgrounds/food-analyzer/Preview";
import { AnimatePreview } from "./playgrounds/animate/Preview";
import { MotionPreview } from "./playgrounds/motion/Preview";
import { TreesPreview } from "./playgrounds/trees/Preview";
import { ConnectFourPreview } from "./playgrounds/connect-four/Preview";

const playgrounds = [
  {
    id: "spirograph",
    title: "Spirograph",
    description:
      "Draw mesmerizing spirograph patterns by rolling circles within circles.",
    href: "/playgrounds/spirograph",
    preview: SpirographPreview,
  },
  {
    id: "number-guesser",
    title: "Number Guesser",
    description:
      "Classic number guessing game with hints. How few guesses does it take?",
    href: "/playgrounds/number-guesser",
    preview: NumberGuesserPreview,
  },
  {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    description: "Play the timeless game against the computer. Best of three!",
    href: "/playgrounds/rock-paper-scissors",
    preview: RockPaperScissorsPreview,
  },
  {
    id: "homer",
    title: "Homer Simpson",
    description: "Homer's eyes follow your cursor around the screen.",
    href: "/playgrounds/homer",
    preview: HomerPreview,
  },
  {
    id: "lights-out",
    title: "Lights Out",
    description: "Toggle lights to clear the grid. Or let the auto-solver handle it.",
    href: "/playgrounds/lights-out",
    preview: LightsOutPreview,
  },
  {
    id: "unit-price",
    title: "Unit Price",
    description:
      "Compare products by unit price. Never overpay at the grocery store again.",
    href: "/playgrounds/unit-price",
    preview: UnitPricePreview,
  },
  {
    id: "subgrid-cards",
    title: "Subgrid Cards",
    description: "Explore CSS subgrid with responsive card layouts.",
    href: "/playgrounds/subgrid-cards",
    preview: SubgridCardsPreview,
  },
  {
    id: "gradients",
    title: "Gradients",
    description: "Experiment with colour gradients and transitions.",
    href: "/playgrounds/gradients",
    preview: GradientsPreview,
  },
  {
    id: "graphs",
    title: "Graphs",
    description: "Interactive graph visualizations using D3.js.",
    href: "/playgrounds/graphs",
    preview: GraphsPreview,
  },
  {
    id: "planets",
    title: "Planets",
    description: "Watch planets orbit in smooth animations using the Motion library.",
    href: "/playgrounds/planets",
    preview: PlanetsPreview,
  },
  {
    id: "food-analyzer",
    title: "Food Analyzer",
    description:
      "AI-powered food analysis. Upload a photo and get instant nutritional insights.",
    href: "/playgrounds/food-analyzer",
    preview: FoodAnalyzerPreview,
  },
  {
    id: "animate",
    title: "Animate",
    description: "React Markdown animation experiments with smooth transitions.",
    href: "/playgrounds/animate",
    preview: AnimatePreview,
  },
  {
    id: "motion",
    title: "Motion",
    description: "Motion library playground. Spring physics and animation primitives.",
    href: "/playgrounds/motion",
    preview: MotionPreview,
  },
  {
    id: "trees",
    title: "Trees",
    description: "Recursive fractal tree generation and visualization.",
    href: "/playgrounds/trees",
    preview: TreesPreview,
  },
  {
    id: "connect-four",
    title: "Connect 4",
    description: "Play Connect 4 against an AlphaZero-style AI trained via self-play.",
    href: "/playgrounds/connect-four",
    preview: ConnectFourPreview,
  },
];

const Home: NextPage = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fffef5",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <header className="mb-16 relative">
          <div className="h-1 bg-black mb-6" />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-black/50 tracking-widest uppercase mb-2">
                lesleh · web experiments
              </p>
              <h1 className="font-roboto-slab font-black text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] text-black tracking-tight">
                Play<br />ground
              </h1>
            </div>

            <div className="hidden sm:flex items-center justify-center rotate-6 shrink-0">
              <div className="border-4 border-black rounded-full w-28 h-28 flex flex-col items-center justify-center text-center p-2">
                <span className="font-mono text-[9px] tracking-widest uppercase text-black leading-tight">
                  {playgrounds.length} demos
                </span>
                <span className="font-roboto-slab font-black text-2xl leading-none text-black">
                  ★
                </span>
                <span className="font-mono text-[9px] tracking-widest uppercase text-black leading-tight">
                  all free
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-1">
            <div className="h-2 bg-black flex-1" />
            <div className="h-2 bg-black w-8" />
            <div className="h-2 bg-black w-2" />
          </div>

          <p className="mt-4 font-mono text-sm text-black/50 max-w-md">
            A scratchpad of web experiments. Click anything that looks interesting.
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {playgrounds.map((playground, i) => (
            <PlaygroundCard
              key={playground.id}
              title={playground.title}
              description={playground.description}
              href={playground.href}
              preview={playground.preview}
              index={i}
            />
          ))}
        </div>

        {/* Footer rule */}
        <div className="mt-20 flex gap-1">
          <div className="h-2 bg-black w-2" />
          <div className="h-2 bg-black w-8" />
          <div className="h-2 bg-black flex-1" />
        </div>
        <p className="mt-4 font-mono text-xs text-black/30 text-right">
          made with curiosity
        </p>
      </div>
    </div>
  );
};

export default Home;
