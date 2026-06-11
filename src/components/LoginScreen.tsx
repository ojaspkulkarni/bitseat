type Props = {
  onLogin: () => void;
};

export default function LoginScreen({
  onLogin,
}: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <button
        onClick={onLogin}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",

          background: "white",
          color: "#1f1f1f",

          border:
            "1px solid #dadce0",

          padding: "0 24px",

          height: "48px",

          borderRadius:
            "9999px",

          fontSize: "16px",
          fontWeight: 500,

          cursor: "pointer",

          boxShadow:
            "0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 48 48"
        >
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />

          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />

          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
          />

          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7.1l6.3 5.3C39.2 37 44 31.1 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>

        <span>
          Continue with Google
        </span>
      </button>
    </div>
  );
}