import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

export async function extractBitsatData(
  file: File
): Promise<ExtractedBitsatData> {
  const arrayBuffer =
    await file.arrayBuffer();

  const pdf =
    await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

  let fullText = "";

  for (
    let pageNum = 1;
    pageNum <= pdf.numPages;
    pageNum++
  ) {
    const page =
      await pdf.getPage(pageNum);

    const textContent =
      await page.getTextContent();

    const pageText =
      textContent.items
        .map((item: any) => item.str)
        .join(" ");

    fullText += pageText + "\n";
  }

  const cleaned = fullText
    .replace(/\s+/g, " ")
    .trim();

  console.log(cleaned);

  const extract = (
    regex: RegExp
  ): string | null => {
    const match =
      cleaned.match(regex);

    return (
      match?.[1]?.trim() ?? null
    );
  };

  // Candidate name
  const candidateName =
    extract(
      /([A-Z]{2,}(?:\s+[A-Z]{2,})+)\s+\d{8}/
    );

  // Application number
  const applicationNumber =
    extract(/\b(\d{8})\b/);

  // Test date
  const testDate =
    extract(
      /\d{8}\s+([A-Za-z0-9_]+)/i
    );

  // Center
  const center =
    extract(
      /[A-Za-z0-9_]+\s+(iON.+?)\s+\d+\s+Two/i
    );

  // Extract all 3-digit scores
  const allScores =
    cleaned.match(
      /\b(2\d{2}|3\d{2})\b/g
    ) || [];

  // Remove duplicates while preserving order
  const uniqueScores = [
    ...new Set(
      allScores.map((s) =>
        parseInt(s, 10)
      )
    ),
  ];

  /*
    Your PDFs usually end like:

    285 281 285 285 285

    Meaning:
    Session 1 = 281
    Session 2 = 285
    Final     = 285

    So we take:
    - smallest = Session 1
    - largest  = Session 2 / Final
  */

  const session1Score =
    uniqueScores.length
      ? Math.min(...uniqueScores)
      : null;

  const session2Score =
    uniqueScores.length
      ? Math.max(...uniqueScores)
      : null;

  const finalScore =
    session2Score;

  const data: ExtractedBitsatData =
    {
      candidateName,
      applicationNumber,
      testDate,
      center,

      session1Score,
      session2Score,
      finalScore,

      rawText: cleaned,
    };

  if (
    !data.applicationNumber
  ) {
    throw new Error(
      "Could not detect application number."
    );
  }

  if (!data.finalScore) {
    throw new Error(
      "Could not extract final score."
    );
  }

  return data;
}