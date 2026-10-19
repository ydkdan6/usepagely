import { Literata, Montserrat } from "next/font/google";

// Literata: a serif designed for long-form reading, used for headings.
// Montserrat: matches the geometric letterforms in the UsePagely wordmark, used for UI text.
export const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});
