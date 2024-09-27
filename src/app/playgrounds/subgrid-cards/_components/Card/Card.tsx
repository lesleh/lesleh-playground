import { faker } from "@faker-js/faker";
import { randomBetween } from "../../../../../lib/randomBetween";

export function Card() {
  const imageUrl = faker.image.url({
    width: 252,
    height: 189,
  });

  return (
    <div className="bg-gray-100 p-4 grid grid-rows-subgrid row-span-4">
      <h1 className="text-xl font-bold">
        {faker.lorem.words(randomBetween(3, 12))}
      </h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Random" className="w-full h-auto" />
      <p>{faker.lorem.sentences()}</p>
      <cite className="text-sm text-right italic text-gray-500">
        {faker.person.fullName()}
      </cite>
    </div>
  );
}
