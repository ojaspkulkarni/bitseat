import { Routes, Route } from "react-router-dom";
import FoundersNote from "../pages/FoundersNote";
import ReferralLanding from "../pages/ReferralLanding";
import { HomePage } from "./HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/founders-note" element={<FoundersNote />} />
      <Route path="/r/:userId" element={<ReferralLanding />} />
    </Routes>
  );
}
