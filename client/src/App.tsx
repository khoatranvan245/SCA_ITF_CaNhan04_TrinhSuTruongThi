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
import CompanyProfile from "./pages/CompanyProfile";
import JobManagement from "./pages/JobManagement";
import JobPost from "./pages/JobPost";
import JobEdit from "./pages/JobEdit";
import ApplicationManagement from "./pages/ApplicationManagement";

type StoredUser = {
  role?: {
    role_id?: number;
    title?: string;
  };
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

const PublicOnlyRoute = () => {
  // Child routes decide whether to redirect based on role.
  return <Outlet />;
};

const CandidateLoginRoute = () => {
  const role = getUserRole();

  if (role === "candidate") {
    return <Navigate to="/" replace />;
  }

  return <CandidateLogin />;
};

const RecruiterLoginRoute = () => {
  const role = getUserRole();

  if (role === "recruiter") {
    return <Navigate to="/" replace />;
  }

  return <RecruiterLogin />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListing />} />
        <Route path="/job-listing" element={<JobListing />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />

        <Route element={<RecruiterPrivateRoute />}>
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/job-management" element={<Outlet />}>
            <Route index element={<JobManagement />} />
            <Route path="post" element={<JobPost />} />
            <Route path="edit/:jobId" element={<JobEdit />} />
          </Route>
          <Route
            path="/application-management"
            element={<ApplicationManagement />}
          />
        </Route>

        <Route path="/candidate-signup" element={<CandidateSignUp />} />
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
