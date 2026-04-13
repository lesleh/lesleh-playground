"use client";

import { motion } from "motion/react";
import { ComponentProps } from "react";

function Para(props: ComponentProps<typeof motion.p>) {
  return (
    <motion.p
      style={{ height: 100 }}
      initial={{
        opacity: 0,
        transform: "translateX(-10%)",
      }}
      whileInView={{
        opacity: 1,
        transform: "translateX(0%)",
        transition: { duration: 0.5 },
      }}
      viewport={{ once: true }}
      {...props}
    />
  );
}

export default function MotionPage() {
  return (
    <div className="p-10">
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
      <Para>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum
        reprehenderit cupiditate ut facere, fugit aliquid. Eaque ex illum
        delectus libero deleniti corrupti, quidem dolor veniam atque accusantium
        esse unde quaerat.
      </Para>
    </div>
  );
}
