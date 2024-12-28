import type { NextPage } from "next";
import { Heading } from "../components/Heading";
import { Link } from "../components/Link";
import { Paragraph } from "../components/Paragraph";

const Home: NextPage = (props) => {
  return (
    <div className="mx-auto max-w-6xl">
      <Heading level={1}>Playground</Heading>
      <p>
        <a href="https://ridomovies.tv/movies/spirited-away-watch-online-2001-rd11-rd13">
          Cassie click here for Spirited Away
        </a>
      </p>
      <Paragraph>
        Here&apos;s a bunch of stuff I&apos;ve written using web technologies.
      </Paragraph>
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
      </ul>
    </div>
  );
};

export default Home;
