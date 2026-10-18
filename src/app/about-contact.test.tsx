import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import { enquiryMailto } from "@/components/contact/ContactForm";
import { Footer } from "@/components/site/Footer";
import { CONTACT } from "@/lib/site";
import { TEAM, initials } from "@/lib/team";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...props }: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("About page", () => {
  it("tells Ayushmati's story and lists every doctor with their role", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: /get to know us/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /our legacy of ayurveda/i })).toBeInTheDocument();
    const team = screen.getByRole("heading", { name: /our doctors/i }).closest("section")!;
    for (const m of TEAM) {
      expect(within(team).getByText(m.name)).toBeInTheDocument();
    }
    expect(within(team).getByText("Chief Physician")).toBeInTheDocument();
  });

  it("makes initials from doctors' names", () => {
    expect(initials("Dr. J. Geethanand")).toBe("JG");
    expect(initials("Dr. Maya V.")).toBe("MV");
  });
});

describe("Contact page", () => {
  it("shows phone, email, address, hours and WhatsApp", () => {
    render(<ContactPage />);
    expect(screen.getByRole("link", { name: CONTACT.phone })).toHaveAttribute("href", CONTACT.phoneHref);
    expect(screen.getByRole("link", { name: CONTACT.email })).toHaveAttribute("href", `mailto:${CONTACT.email}`);
    expect(screen.getByText(/Kollam, Kerala 691001/)).toBeInTheDocument();
    expect(screen.getByText("Monday – Friday")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", CONTACT.whatsappHref);
  });

  it("requires every form field", async () => {
    render(<ContactPage />);
    for (const label of [/full name/i, /your email/i, /mobile number/i, /message/i]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    await userEvent.type(screen.getByLabelText(/full name/i), "Asha");
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Asha");
  });

  it("builds an email to Ayushmati with the enquiry details", () => {
    const href = enquiryMailto({ name: "Asha K", email: "asha@example.com", mobile: "9876543210", message: "Hello & thanks" });
    const url = new URL(href);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(CONTACT.email);
    expect(url.searchParams.get("subject")).toBe("Website enquiry from Asha K");
    const body = url.searchParams.get("body")!;
    expect(body).toContain("Hello & thanks");
    expect(body).toContain("asha@example.com");
    expect(body).toContain("9876543210");
  });
});

describe("Footer contact details", () => {
  it("links to About, Contact, phone and email, with the organisation name", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: CONTACT.phone })).toBeInTheDocument();
    expect(screen.getByText(/Ayushmati\. All rights reserved\./)).toBeInTheDocument();
  });
});
