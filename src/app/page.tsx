import type { NextPage } from "next";
import { Heading } from "../components/Heading";
import { Paragraph } from "../components/Paragraph";
import { PlaygroundCard } from "./_components/PlaygroundCard";
import {
  SpirographPreview,
  HomerPreview,
  LightsOutPreview,
  RockPaperScissorsPreview,
  NumberGuesserPreview,
  UnitPricePreview,
  GradientsPreview,
  GraphsPreview,
  PlanetsPreview,
  FoodAnalyzerPreview,
  SubgridCardsPreview,
  AnimatePreview,
  MotionPreview,
  TreesPreview,
} from "./_components/PlaygroundPreviews";

const playgrounds = [
  {
    id: "spirograph",
    title: "Spirograph",
    description:
      "Draw mesmerizing spirograph patterns by rolling circles within circles. Adjust parameters and watch mathematical art come to life.",
    href: "/playgrounds/spirograph",
    preview: SpirographPreview,
  },
  {
    id: "number-guesser",
    title: "Number Guesser",
    description:
      "Classic number guessing game with hints. Try to guess the secret number with as few attempts as possible.",
    href: "/playgrounds/number-guesser",
    preview: NumberGuesserPreview,
  },
  {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    description:
      "Play the timeless game against the computer. Best of three wins!",
    href: "/playgrounds/rock-paper-scissors",
    preview: RockPaperScissorsPreview,
  },
  {
    id: "homer",
    title: "Homer Simpson",
    description:
      "Homer's eyes follow your cursor around the screen. A fun interactive demo with smooth animations.",
    href: "/playgrounds/homer",
    preview: HomerPreview,
  },
  {
    id: "lights-out",
    title: "Lights Out",
    description:
      "Puzzle game where clicking lights toggles them and their neighbors. Clear the grid or let the auto-solver do it!",
    href: "/playgrounds/lights-out",
    preview: LightsOutPreview,
  },
  {
    id: "unit-price",
    title: "Unit Price Calculator",
    description:
      "Compare products by calculating their unit prices. Never overpay at the grocery store again.",
    href: "/playgrounds/unit-price",
    preview: UnitPricePreview,
  },
  {
    id: "subgrid-cards",
    title: "Subgrid Cards",
    description:
      "Explore CSS subgrid with responsive card layouts. See how modern CSS makes complex layouts simple.",
    href: "/playgrounds/subgrid-cards",
    preview: SubgridCardsPreview,
  },
  {
    id: "gradients",
    title: "Gradients",
    description:
      "Experiment with color gradients and transitions. Create beautiful color combinations dynamically.",
    href: "/playgrounds/gradients",
    preview: GradientsPreview,
  },
  {
    id: "graphs",
    title: "Graphs",
    description:
      "Interactive graph visualizations using D3.js. Explore nodes, connections, and data relationships.",
    href: "/playgrounds/graphs",
    preview: GraphsPreview,
  },
  {
    id: "planets",
    title: "Planets",
    description:
      "Watch planets orbit in smooth animations. Built with Motion for buttery-smooth performance.",
    href: "/playgrounds/planets",
    preview: PlanetsPreview,
  },
  {
    id: "food-analyzer",
    title: "Food Analyzer",
    description:
      "AI-powered food analysis and nutritional insights. Upload food photos and get instant analysis.",
    href: "/playgrounds/food-analyzer",
    preview: FoodAnalyzerPreview,
  },
  {
    id: "animate",
    title: "Animate",
    description:
      "React Markdown animation experiments. Watch text and content come alive with smooth transitions.",
    href: "/playgrounds/animate",
    preview: AnimatePreview,
  },
  {
    id: "motion",
    title: "Motion",
    description:
      "Motion library playground. Explore animation primitives and spring physics.",
    href: "/playgrounds/motion",
    preview: MotionPreview,
  },
  {
    id: "trees",
    title: "Trees",
    description:
      "Recursive tree generation and visualization. Watch fractal trees grow algorithmically.",
    href: "/playgrounds/trees",
    preview: TreesPreview,
  },
];

const Home: NextPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-12 text-center">
        <Heading level={1} className="mb-4">
          Playground
        </Heading>
        <Paragraph className="text-xl text-gray-600">
          Interactive experiments with web technologies
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {playgrounds.map((playground) => (
          <PlaygroundCard
            key={playground.id}
            title={playground.title}
            description={playground.description}
            href={playground.href}
            preview={playground.preview}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
