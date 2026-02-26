import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard");
  }, [navigate]);

  return <div>Loading...</div>;
}

export default AuthCallback;
