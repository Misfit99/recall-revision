/*
 * The library. To add a new subject:
 *   1. Put its unit files in content/<subject-id>/ (each calls Revision.addUnit).
 *   2. Add an entry below listing those units in reading order.
 * The site loads the files listed here automatically.
 */

Revision.addSubject({
  id: "core-java",
  title: "Core Java",
  tagline: "SDE2 interview revision — OOP to the JVM, in seven days.",
  accent: "#ff8a5b",
  glyph: "J",
  units: [
    { id: "day-1", file: "content/core-java/day-1.js" },
    { id: "day-2", file: "content/core-java/day-2.js" },
    { id: "day-3", file: "content/core-java/day-3.js" },
    { id: "day-4a", file: "content/core-java/day-4a.js" },
    { id: "day-4b", file: "content/core-java/day-4b.js" },
    { id: "day-5", file: "content/core-java/day-5.js" },
    { id: "day-6", file: "content/core-java/day-6.js" },
  ],
});
