import type { NextPage } from "next";
import { Heading } from "../components/Heading";
import { Link } from "../components/Link";
import { Paragraph } from "../components/Paragraph";

const Home: NextPage = (props) => {
  return (
    <div className="mx-auto max-w-6xl">
      <Heading level={1}>Playground</Heading>
      <Paragraph>
        Here&apos;s a bunch of stuff I&apos;ve written using web technologies.
      </Paragraph>
      <ul className="list-disc list-inside">
        <li>
          <Link href="/playgrounds/typewriter">Typewriter Effect</Link>
        </li>

        <li>
          <Link href="/playgrounds/number-guesser">Number Guesser</Link>
        </li>
      </ul>
    </div>
  );
};

export default Home;
