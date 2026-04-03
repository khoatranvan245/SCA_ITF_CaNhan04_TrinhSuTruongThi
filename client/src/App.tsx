import { BrowserRouter, Routes, Route } from "react-router-dom";
import CandidateSignUp from "./pages/CandidateSignUp";
import RecruiterSignUp from "./pages/RecruiterSignUp";
import CandidateLogin from "./pages/CandidateLogin";
import RecruiterLogin from "./pages/RecruiterLogin";
import JobListing from "./pages/JobListing";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListing />} />
        <Route path="/job-listing" element={<JobListing />} />
        <Route path="/candidate-signup" element={<CandidateSignUp />} />
        <Route path="/recruiter-signup" element={<RecruiterSignUp />} />
        <Route path="/candidate-login" element={<CandidateLogin />} />
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
