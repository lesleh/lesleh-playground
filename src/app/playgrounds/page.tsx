import Link from "next/link";

export default function PlaygroundsPage() {
  return (
    <>
      <ul className="list-disc list-inside">
        <li>
          <Link href="/playgrounds/number-guesser">Number Guesser</Link>
        </li>

        <li>
          <Link href="/playgrounds/rock-paper-scissors">
            Rock Paper Scissors
          </Link>
        </li>

        <li>
          <Link href="/playgrounds/homer">Homer Simpson</Link>
        </li>

        <li>
          <Link href="/playgrounds/lights-out">Lights Out</Link>
        </li>

        <li>
          <Link href="/playgrounds/unit-price">Unit Price Calculator</Link>
        </li>

        <li>
          <Link href="/playgrounds/subgrid-cards">Subgrid Cards</Link>
        </li>

        <li>
          <Link href="/playgrounds/gradients">Gradients</Link>
        </li>

        <li>
          <Link href="/playgrounds/spirograph">Spirograph</Link>
        </li>
      </ul>
    </>
  );
}
