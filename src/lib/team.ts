// Ayushmati's doctors, as published on https://www.ayushmati.org/about1

export type TeamMember = {
  name: string;
  qualifications?: string;
  role: string;
  group: "leadership" | "physicians" | "visiting";
  late?: boolean;
};

export const TEAM: TeamMember[] = [
  { name: "Dr. V. Jayadevan", qualifications: "Rtd. D.M.O.", role: "Founder", group: "leadership", late: true },
  { name: "Dr. J. Geethanand", qualifications: "B.A.M.S.", role: "Chief Physician", group: "leadership" },
  { name: "Dr. Prabha Vijayaraghavan", role: "Consultant", group: "leadership" },
  { name: "Dr. Bhavya G. Anand", qualifications: "B.A.M.S.", role: "Consultant Physician", group: "physicians" },
  { name: "Dr. Silpa B. Panicker", qualifications: "M.B.B.S.", role: "Consultant Physician (modern medicine)", group: "physicians" },
  { name: "Dr. Maya V.", qualifications: "B.H.M.S., M.D.", role: "Homeopathy Practitioner", group: "visiting" },
  { name: "Dr. Ajayakumar V.", qualifications: "M.B.B.S., M.D.", role: "Senior Surgeon", group: "visiting" },
  { name: "Dr. Beena Panicker", qualifications: "M.B.B.S., M.D.", role: "Senior Gynecologist", group: "visiting" },
];

/** "Dr. J. Geethanand" -> "JG" */
export function initials(name: string): string {
  const parts = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/[\s.]+/)
    .filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
}
