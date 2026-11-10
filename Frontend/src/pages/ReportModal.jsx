import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { BUSINESS_REASONS, REVIEW_REASONS } from "../constants/reportReasons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_DETAILS = 500;

// targetType: "business" | "review"
// targetLabel: what is being reported, shown in the heading
export default function ReportModal({ isOpen, onClose, targetType, targetId, targetLabel }) {
  const reasons = targetType === "review" ? REVIEW_REASONS : BUSINESS_REASONS;

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const firstRadio = useRef(null);

  // Start fresh each time the form opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDetails("");
      setError("");
      setNeedsLogin(false);
      setSending(false);
      // Focus the first choice so keyboard users start inside the form
      setTimeout(() => firstRadio.current?.focus(), 0);
    }
  }, [isOpen, targetType, targetId]);

  // Escape closes the form
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, sending, onClose]);

  if (!isOpen) return null;

  const detailsRequired = reason === "other";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    if (detailsRequired && details.trim().length < 5) {
      setError("Please tell us what is wrong.");
      return;
    }

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/api/business/report`,
        { target_type: targetType, target_id: targetId, reason, details },
        { withCredentials: true },
      );
      toast.success("Thanks for the report. An admin will take a look.");
      onClose();
    } catch (err) {
      console.error("Report error:", err);
      if (err.response?.status === 401) {
        setNeedsLogin(true);
        setError("Please log in to send a report.");
      } else {
        setError(err.response?.data?.message || "Could not send your report. Please try again.");
      }
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => !sending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1D4A79] text-white px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="min-w-0">
            <h2 id="report-title" className="font-bold text-lg">
              {targetType === "review" ? "Report this review" : "Report this listing"}
            </h2>
            {targetLabel && <p className="text-sm text-blue-100 truncate">{targetLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="shrink-0 text-white/80 hover:text-white font-black text-lg px-1 disabled:opacity-50"
            aria-label="Close report form"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <fieldset disabled={sending} className="space-y-2">
            <legend className="text-sm font-bold text-[#1D4A79] mb-2">What is wrong?</legend>
            {reasons.map((r, i) => (
              <label
                key={r.value}
                htmlFor={`reason-${r.value}`}
                className={`flex gap-3 items-start rounded-lg border p-3 cursor-pointer transition-colors ${
                  reason === r.value
                    ? "border-[#1D4A79] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  ref={i === 0 ? firstRadio : null}
                  id={`reason-${r.value}`}
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-1 accent-[#1D4A79]"
                />
                <span>
                  <span className="block text-sm font-bold text-gray-900">{r.label}</span>
                  <span className="block text-xs text-gray-500">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-4">
            <label htmlFor="report-details" className="block text-sm font-bold text-[#1D4A79]">
              More details {detailsRequired ? "" : "(optional)"}
            </label>
            <textarea
              id="report-details"
              rows="3"
              maxLength={MAX_DETAILS}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={sending}
              placeholder="Anything that helps an admin check this quickly"
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] text-sm resize-none"
            ></textarea>
            <p className="mt-1 text-xs text-gray-400 text-right">
              {details.length}/{MAX_DETAILS}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-medium"
            >
              {error}{" "}
              {needsLogin && (
                <Link to="/login" className="font-bold underline hover:text-red-900">
                  Log in
                </Link>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 bg-white text-gray-700 font-bold py-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-[2] bg-[#1D4A79] hover:bg-blue-900 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send report"}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400 text-center">
            Reports are private. The business owner and reviewer will not see who sent it.
          </p>
        </form>
      </div>
    </div>
  );
}
