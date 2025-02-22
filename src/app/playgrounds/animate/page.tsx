import * as motion from "motion/react-client";

const items = Array.from({ length: 200 }, (_, i) => `Item ${i + 1}`);

export default function AnimatePage() {
  return (
    <div className="mx-auto max-w-6xl p-4 prose">
      {items.map((text, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
            transition: { duration: 0.5, delay: 0.1 },
          }}
          viewport={{ once: true }}
        >
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ex dolores
          reprehenderit nesciunt minus consectetur. Laborum aperiam nihil sed ea
          enim a quaerat, omnis, voluptate magni aliquam id quae veniam
          quibusdam.
        </motion.p>
      ))}
    </div>
  );
}
