import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedBitsatData {
  candidateName: string | null;
  applicationNumber: string | null;
  testDate: string | null;
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
  const testDate = extract(/\d{8}\s+([A-Za-z0-9_]+)/i);
  const center = extract(/[A-Za-z0-9_]+\s+(iON.+?)\s+\d+\s+Two/i);

  const session1Score = scoreBlockMatch ? parseInt(scoreBlockMatch[1], 10) : null;
  const session2Score = scoreBlockMatch ? parseInt(scoreBlockMatch[2], 10) : null;
  const finalScore    = scoreBlockMatch ? parseInt(scoreBlockMatch[4], 10) : null;

  const data: ExtractedBitsatData = {
    candidateName,
    applicationNumber,
    testDate,
    center,
    session1Score,
    session2Score,
    finalScore,
    rawText: cleaned,
  };

  if (!data.applicationNumber) {
    throw new Error("Could not detect application number.");
  }

  if (!data.session1Score && !data.session2Score && !data.finalScore) {
    throw new Error("Could not extract final score.");
  }

  return data;
}