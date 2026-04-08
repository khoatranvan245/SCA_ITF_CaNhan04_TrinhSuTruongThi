import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import CandidateSignUp from "./pages/CandidateSignUp";
import RecruiterSignUp from "./pages/RecruiterSignUp";
import CandidateLogin from "./pages/CandidateLogin";
import RecruiterLogin from "./pages/RecruiterLogin";
import JobListing from "./pages/JobListing";
import CompanyProfile from "./pages/CompanyProfile";
import JobManagement from "./pages/JobManagement";
import JobPost from "./pages/JobPost";
import ApplicationManagement from "./pages/ApplicationManagement";

type StoredUser = {
  role?: {
    role_id?: number;
    title?: string;
  };
};

const RecruiterPrivateRoute = () => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return <Navigate to="/recruiter-login" replace />;
  }

  try {
    const user = JSON.parse(rawUser) as StoredUser;
    const isRecruiter =
      user?.role?.role_id === 2 ||
      user?.role?.title?.toLowerCase() === "recruiter";

    if (!isRecruiter) {
      return <Navigate to="/recruiter-login" replace />;
    }

    return <Outlet />;
  } catch {
    return <Navigate to="/recruiter-login" replace />;
  }
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListing />} />
        <Route path="/job-listing" element={<JobListing />} />

        <Route element={<RecruiterPrivateRoute />}>
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/job-management" element={<Outlet />}>
            <Route index element={<JobManagement />} />
            <Route path="post" element={<JobPost />} />
          </Route>
          <Route
            path="/application-management"
            element={<ApplicationManagement />}
          />
        </Route>

        <Route path="/candidate-signup" element={<CandidateSignUp />} />
        <Route path="/recruiter-signup" element={<RecruiterSignUp />} />
        <Route path="/candidate-login" element={<CandidateLogin />} />
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
