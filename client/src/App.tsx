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
import JobDetail from "./pages/JobDetail";
import CompanyListing from "./pages/CompanyListing";
import CompanyDetail from "./pages/CompanyDetail";
import CompanyProfile from "./pages/CompanyProfile";
import JobManagement from "./pages/JobManagement";
import JobPost from "./pages/JobPost";
import JobEdit from "./pages/JobEdit";
import ApplicationManagement from "./pages/ApplicationManagement";
import CandidateProfile from "./pages/CandidateProfile";
import CandidateApplications from "./pages/CandidateApplications";
import PublicLayout from "./layouts/PublicLayout";

type StoredUser = {
  role?: {
    role_id?: number;
    title?: string;
  };
};

const isRecruiterHost = () => {
  const hostname = window.location.hostname.toLowerCase();

  return (
    hostname === "recruiter.localhost" ||
    hostname === "recruiter.127.0.0.1" ||
    hostname.startsWith("recruiter.")
  );
};

const getStoredUser = () => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

const getUserRole = () => {
  const user = getStoredUser();
  const roleTitle = user?.role?.title?.toLowerCase();

  if (user?.role?.role_id === 2 || roleTitle === "recruiter") {
    return "recruiter";
  }

  if (user?.role?.role_id === 3 || roleTitle === "candidate") {
    return "candidate";
  }

  return null;
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

const CandidatePrivateRoute = () => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return <Navigate to="/candidate-login" replace />;
  }

  try {
    const user = JSON.parse(rawUser) as StoredUser;
    const isCandidate =
      user?.role?.role_id === 3 ||
      user?.role?.title?.toLowerCase() === "candidate";

    if (!isCandidate) {
      return <Navigate to="/candidate-login" replace />;
    }

    return <Outlet />;
  } catch {
    return <Navigate to="/candidate-login" replace />;
  }
};

const PublicOnlyRoute = () => {
  // Child routes decide whether to redirect based on role.
  return <Outlet />;
};

const CandidateLoginRoute = () => {
  if (isRecruiterHost()) {
    return <Navigate to="/recruiter-login" replace />;
  }

  const role = getUserRole();

  if (role === "candidate") {
    return <Navigate to="/" replace />;
  }

  return <CandidateLogin />;
};

const RecruiterLoginRoute = () => {
  const role = getUserRole();

  if (role === "recruiter") {
    return (
      <Navigate to={isRecruiterHost() ? "/job-management" : "/"} replace />
    );
  }

  return <RecruiterLogin />;
};

const CandidateSignUpRoute = () => {
  if (isRecruiterHost()) {
    return <Navigate to="/recruiter-signup" replace />;
  }

  return <CandidateSignUp />;
};

const RecruiterHostRoute = () => {
  if (!isRecruiterHost()) {
    return <Outlet />;
  }

  const role = getUserRole();
  if (role !== "recruiter") {
    return <Navigate to="/recruiter-login" replace />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RecruiterHostRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<JobListing />} />
            <Route path="/job-listing" element={<JobListing />} />
            <Route path="/company-listing" element={<CompanyListing />} />
            <Route path="/companies/:companyId" element={<CompanyDetail />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />

            <Route element={<RecruiterPrivateRoute />}>
              <Route path="/company-profile" element={<CompanyProfile />} />
              <Route
                path="/application-management"
                element={<ApplicationManagement />}
              />
            </Route>

            <Route element={<CandidatePrivateRoute />}>
              <Route path="/candidate-profile" element={<CandidateProfile />} />
              <Route
                path="/candidate-applications"
                element={<CandidateApplications />}
              />
            </Route>
          </Route>

          <Route element={<RecruiterPrivateRoute />}>
            <Route path="/job-management" element={<Outlet />}>
              <Route index element={<JobManagement />} />
              <Route path="post" element={<JobPost />} />
              <Route path="edit/:jobId" element={<JobEdit />} />
            </Route>
          </Route>
        </Route>

        <Route path="/candidate-signup" element={<CandidateSignUpRoute />} />
        <Route path="/recruiter-signup" element={<RecruiterSignUp />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/candidate-login" element={<CandidateLoginRoute />} />
          <Route path="/recruiter-login" element={<RecruiterLoginRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
