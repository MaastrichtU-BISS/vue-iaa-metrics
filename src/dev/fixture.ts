// Synthetic demo data — a small span-level task with two annotators.
export type FixtureAnnotation = {
  start: number;
  end: number;
  label: string;
  text: string;
  confidence: number;
  metadata?: string;
};

export type FixtureAssignment = {
  annotator: string;
  difficulty_rating: number;
  annotations: FixtureAnnotation[];
};

export type FixtureDocument = {
  id: string;
  name: string;
  full_text: string;
  assignments: FixtureAssignment[];
};

export const labelset = [
  { name: "Actors", color: "#71c345" },
  { name: "Acts", color: "#4435ba" },
];

export const documents: FixtureDocument[] = [
  {
    id: "1",
    name: "doc_001.txt",
    full_text:
      "The participation of Denmark in the adoption of measures constituting a development of the Schengen acquis shall be governed by the relevant provisions of the Protocol.",
    assignments: [
      {
        annotator: "alice@example.com",
        difficulty_rating: 4,
        annotations: [
          { start: 4, end: 26, label: "Actors", text: "participation of Denmark", confidence: 4 },
          {
            start: 34,
            end: 61,
            label: "Acts",
            text: "adoption of measures constituting",
            confidence: 3,
            metadata: "core obligation",
          },
        ],
      },
      {
        annotator: "bob@example.com",
        difficulty_rating: 3,
        annotations: [
          { start: 0, end: 26, label: "Actors", text: "The participation of Denmark", confidence: 5 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "doc_002.txt",
    full_text:
      "Where the Court is of the opinion that the consideration of preparatory inquiries in cases before it so require, it shall propose the appointment of Assistant Rapporteurs.",
    assignments: [
      {
        annotator: "alice@example.com",
        difficulty_rating: 2,
        annotations: [{ start: 10, end: 15, label: "Actors", text: "Court", confidence: 4 }],
      },
      {
        annotator: "bob@example.com",
        difficulty_rating: 2,
        annotations: [],
      },
    ],
  },
];
