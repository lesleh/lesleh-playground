"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface Planet {
  id: number;
  name: string;
  radius: number;
  distance: number;
  color: string;
  speed: number;
}

export default function PlanetsPage() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const computedStyle = getComputedStyle(svgRef.current!);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);
    const centerX = width / 2;
    const centerY = height / 2;

    // Define planets
    const planets: Planet[] = [
      {
        id: 1,
        name: "Mercury",
        radius: 4,
        distance: 50,
        color: "#A0522D",
        speed: 0.002, // reduced from 0.02
      },
      {
        id: 2,
        name: "Venus",
        radius: 8,
        distance: 80,
        color: "#DEB887",
        speed: 0.0015, // reduced from 0.015
      },
      {
        id: 3,
        name: "Earth",
        radius: 9,
        distance: 110,
        color: "#4169E1",
        speed: 0.001, // reduced from 0.01
      },
      {
        id: 4,
        name: "Mars",
        radius: 5,
        distance: 140,
        color: "#CD5C5C",
        speed: 0.0008, // reduced from 0.008
      },
    ];

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add the sun
    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", 20)
      .attr("fill", "yellow")
      .attr("filter", "blur(2px)");

    // Add orbit paths
    planets.forEach((planet) => {
      svg
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", planet.distance)
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .style("opacity", 0.3);
    });

    // Add planets
    const planetGroups = svg
      .selectAll("g.planet")
      .data(planets)
      .enter()
      .append("g")
      .attr("class", "planet");

    planetGroups
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.color);

    // Animation
    function animate() {
      planetGroups.each(function (d) {
        const time = Date.now() * d.speed;
        const x = centerX + d.distance * Math.cos(time);
        const y = centerY + d.distance * Math.sin(time);
        d3.select(this).attr("transform", `translate(${x},${y})`);
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId); // Cleanup the animation frame
    };
  }, []);

  return <svg className="h-full w-full bg-black" ref={svgRef}></svg>;
}
