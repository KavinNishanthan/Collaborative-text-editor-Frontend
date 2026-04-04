// Importing Packages
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * This page now redirects to the unified Dashboard with the document opened inline.
 * Direct links like /editor/:documentId still work — they just land on the dashboard.
 */
export default function Editor() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (documentId) {
      navigate(`/dashboard?doc=${documentId}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [documentId, navigate]);

  return (
    <div className='min-h-screen bg-[#F8FAFC] flex items-center justify-center'>
      <span className='w-8 h-8 border-2 border-black/[0.08] border-t-[#4F46E5] rounded-full animate-spin-custom' />
    </div>
  );
}

