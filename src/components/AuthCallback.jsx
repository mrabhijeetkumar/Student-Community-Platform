import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Insert user profile if not exists
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata.full_name || "",
          gender: "",
          phone: "",
          photo: user.user_metadata.avatar_url || "",
        });
      }

      navigate("/dashboard");
    };

    handleUser();
  }, [navigate]);

  return <div>Loading...</div>;
}

export default AuthCallback;