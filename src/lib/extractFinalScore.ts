import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedBitsatData {
  candidateName: string | null;
  applicationNumber: string | null;
  session2Shift: string | null;   // extracted from PDF (only S2 date is printed)
  center: string | null;
  session1Score: number | null;
  session2Score: number | null;
  finalScore: number | null;
  rawText: string;
}

export async function extractBitsatData(file: File): Promise<ExtractedBitsatData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  const cleaned = fullText.replace(/\s+/g, " ").trim();
  console.log("cleaned:", cleaned);

  const scoreBlockMatch = cleaned.match(/(\d{3})\s+(\d{3})\s+(\d{3})\s+(\d{3})\s*$/);
  console.log("scoreBlockMatch:", scoreBlockMatch);

  const extract = (regex: RegExp): string | null => {
    const match = cleaned.match(regex);
    return match?.[1]?.trim() ?? null;
  };

  const candidateName = extract(
    /([A-Z]{2,}(?:\s+[A-Z]{2,})+)\s+\d{8}/
  );
  const applicationNumber = extract(/\b(\d{8})\b/);
  // The PDF only prints the Session 2 shift date (e.g. "25May2026_S2")
  const session2Shift = extract(/\d{8}\s+([A-Za-z0-9_]+)/i);
  const center = extract(/[A-Za-z0-9_]+\s+(iON.+?)\s+\d+\s+Two/i);

  const session1Score = scoreBlockMatch ? parseInt(scoreBlockMatch[1], 10) : null;
  const session2Score = scoreBlockMatch ? parseInt(scoreBlockMatch[2], 10) : null;
  const finalScore    = scoreBlockMatch ? parseInt(scoreBlockMatch[4], 10) : null;

  // Validate that this looks like a real BITSAT scorecard
  const isBitsatDoc =
    /BITSAT/i.test(cleaned) &&
    /BITS\s*Pilani|Birla\s*Institute/i.test(cleaned);

  if (!isBitsatDoc) {
    throw new Error(
      "This doesn't look like a BITSAT scorecard. Please upload the official PDF downloaded from the BITS Pilani admissions portal."
    );
  }

  // Detect session-1-only or session-2-only PDFs (they lack the combined final score block)
  const hasSession1 = /session\s*1|Session\s*I\b/i.test(cleaned);
  const hasSession2 = /session\s*2|Session\s*II\b/i.test(cleaned);
  const hasFinalBlock = scoreBlockMatch !== null;

  if (!hasFinalBlock && (hasSession1 || hasSession2)) {
    throw new Error(
      "Please upload the combined scorecard (with both sessions and the final score), not a single-session result PDF."
    );
  }

  const data: ExtractedBitsatData = {
    candidateName,
    applicationNumber,
    session2Shift,
    center,
    session1Score,
    session2Score,
    finalScore,
    rawText: cleaned,
  };

  if (!data.applicationNumber) {
    throw new Error("Could not detect application number. Make sure you're uploading the official BITSAT scorecard PDF.");
  }

  if (!data.session1Score && !data.session2Score && !data.finalScore) {
    throw new Error("Could not extract scores from this PDF. Make sure you're uploading the official BITSAT scorecard PDF.");
  }

  return data;
}
