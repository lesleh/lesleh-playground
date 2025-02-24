import * as motion from "motion/react-client";
import Markdown from "react-markdown";

const items = Array.from({ length: 200 }, (_, i) => `Item ${i + 1}`);

const markdown = `
# Is Magenta a Real Colour? 🤔 Let's Investigate!

Imagine you have a box of crayons 🖍️. You have red, blue, yellow, green, and lots of other colours! When we see colours, it's because light is bouncing off things and going into our eyes 👀.

*   **Red** light makes us see red.
*   **Blue** light makes us see blue.
*   **Green** light makes us see green.
    ...and so on!

But what happens when we see **magenta**?

Well, here's the secret: Your brain is a bit of a trickster! 🤪

See, the light that makes us see magenta **isn't a single colour** like red or blue. Instead, your brain is getting a mix of **red light AND blue light** at the same time! 🤯

Think of it like this:

1.  Your eyes see the red light.
2.  Your eyes see the blue light.
3.  Your brain says, "Hmm, there's red AND blue... I know! I'll make up a new colour and call it **magenta**!" 🎉

So, magenta is kind of a **phantom colour**. It doesn't exist on its own in the rainbow 🌈 like the others. Your brain just invents it when it sees red and blue together! It's like mixing red and blue paint and your brain saying "Ooh, I like this one!" without really needing the paint to be mixed.

It's a **special effect** your brain does! Pretty cool, huh? 😎
`;

// eslint-disable-next-line react/display-name
const withMotion = (Component: any) => (props: any) =>
  (
    <Component
      initial={{ opacity: 0 }}
      whileInView={{
        opacity: 1,
        transition: { duration: 0.5, delay: 0.1 },
      }}
      viewport={{ once: true }}
      {...props}
    />
  );

const components = {
  h1: withMotion(motion.h1),
  h2: withMotion(motion.h2),
  h3: withMotion(motion.h3),
  h4: withMotion(motion.h4),
  h5: withMotion(motion.h5),
  h6: withMotion(motion.h6),
  p: withMotion(motion.p),
  li: withMotion(motion.li),
};

export default function AnimatePage() {
  return (
    // <div className="mx-auto max-w-6xl p-4 prose">
    //   {items.map((text, index) => (
    //     <motion.p
    // key={index}
    // initial={{ opacity: 0 }}
    // whileInView={{
    //   opacity: 1,
    //   transition: { duration: 0.5, delay: 0.1 },
    // }}
    // viewport={{ once: true }}
    //     >
    //       Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ex dolores
    //       reprehenderit nesciunt minus consectetur. Laborum aperiam nihil sed ea
    //       enim a quaerat, omnis, voluptate magni aliquam id quae veniam
    //       quibusdam.
    //     </motion.p>
    //   ))}
    // </div>
    <div className="prose max-w-prose mx-auto p-4 pb-8">
      <Markdown components={components}>{markdown}</Markdown>
    </div>
  );
}
