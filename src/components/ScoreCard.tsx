type Props = {
  label: string;
  value: number | null;
  highlight?: boolean;
};

export default function ScoreCard({
  label,
  value,
  highlight = false,
}: Props) {
  return (
    <div
      style={{
        background: highlight
          ? "#004aad"
          : "#f8fbff",

        color: highlight
          ? "white"
          : "#004aad",

        borderRadius: "28px",
        padding: "2rem",

        border:
          "1px solid #dbeafe",
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: "1rem",
          opacity: 0.8,
          fontWeight: 600,
        }}
      >
        {label}
      </p>

      <h1
        style={{
          margin: 0,
          fontSize: "4rem",
          lineHeight: 1,
        }}
      >
        {value ?? "-"}
      </h1>
    </div>
  );
}