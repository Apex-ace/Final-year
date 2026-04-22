import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
import FullPageLoader from "../components/FullPageLoader";

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`text-xl transition ${
            star <= value ? "text-yellow-400" : "text-gray-600"
          } ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/reviews/user/${id}`),
        ]);

        setProfile(profileRes.data.profile);
        setReviews(reviewsRes.data.reviews || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const reloadReviews = async () => {
    if (!id) return;
    try {
      setReviewLoading(true);
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/reviews/user/${id}`),
      ]);
      setProfile(profileRes.data.profile);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error(error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRequestSwap = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return setStatusMsg("Please log in first.");
    if (user.id === profile?.id) return setStatusMsg("You can't swap with yourself.");

    try {
      setRequestStatus("sending");

      await api.post("/swaps/request", {
        receiver_id: profile?.id,
        message: `Hi ${profile?.full_name}, I'd like to swap skills!`,
      });

      setRequestStatus("success");
      setStatusMsg("Request Sent ✓");
    } catch {
      setRequestStatus("error");
      setStatusMsg("Failed to send request.");
    }
  };

  const handleSubmitReview = async () => {
    if (!profile?.id) return;
    if (!rating) {
      setStatusMsg("Please select a star rating.");
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post("/reviews/", {
        reviewee_id: profile.id,
        rating,
        comment: comment.trim() || null,
      });

      setComment("");
      setRating(0);
      setStatusMsg("Review submitted successfully ✓");
      await reloadReviews();
    } catch (error: any) {
      console.error(error);
      setStatusMsg(error?.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <FullPageLoader />;
  if (!profile) return <div className="text-center mt-20">User not found</div>;

  return (
    <MobileShell title="Profile" showBack>
      <div className="space-y-6">
        <div className="relative">
          <div className="h-40 rounded-2xl bg-gradient-to-br from-[#00e6c3]/30 to-[#001915]" />

          <div className="flex items-end gap-4 px-4 -mt-16">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00e6c3]/20 blur-xl rounded-full" />

              <div className="relative h-24 w-24 rounded-full overflow-hidden border border-[#1a2a2e] bg-[#0c1317]">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-3xl text-gray-400">
                    {profile.full_name?.[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="pb-2">
              <h2 className="text-lg font-semibold text-white">
                {profile.full_name}
              </h2>
              <p className="text-xs text-gray-400">@{profile.username}</p>

              <div className="flex items-center gap-2 mt-2">
                <StarRating
                  value={Math.round(Number(profile.average_rating || 0))}
                  readonly
                />
                <span className="text-xs text-gray-400">
                  {Number(profile.average_rating || 0).toFixed(1)} ({profile.reviews_count || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 px-4">
          📍 {profile.city || "Unknown"}, {profile.country}
        </p>

        <div className="px-4">
          <h3 className="text-sm text-gray-400 mb-2">About</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {profile.bio || "No bio available"}
          </p>
        </div>

        <div className="px-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Can Help With</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_offered?.map((skill: any) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <p className="text-sm text-gray-400 mb-2">Wants to Learn</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_wanted?.map((skill: any) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* REVIEW FORM */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e] space-y-4">
            <h3 className="text-sm text-gray-300 font-medium">Rate this profile</h3>

            <StarRating value={rating} onChange={setRating} />

            <textarea
              rows={3}
              placeholder="Write your feedback (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0b0f10] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none resize-none"
            />

            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="w-full py-3 rounded-2xl bg-[#00e6c3] text-black font-medium shadow-lg shadow-[#00e6c3]/20 disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="px-4 space-y-3">
          {requestStatus === "success" ? (
            <button className="w-full py-3 rounded-2xl bg-[#003b36] text-teal-300">
              Request Sent ✓
            </button>
          ) : (
            <button
              onClick={handleRequestSwap}
              className="w-full py-3 rounded-2xl bg-[#00e6c3] text-black font-medium shadow-lg shadow-[#00e6c3]/20"
            >
              {requestStatus === "sending" ? "Sending..." : "Request Swap"}
            </button>
          )}

          <Link
            to={`/work?u=${profile.id}`}
            className="block w-full text-center py-3 rounded-2xl bg-[#0c1317] border border-[#1a2a2e] text-white"
          >
            Open Workspace
          </Link>

          {statusMsg && (
            <p className="text-xs text-gray-400 text-center">{statusMsg}</p>
          )}
        </div>

        {/* REVIEW LIST */}
        <div className="px-4 pb-6">
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-300 font-medium">Reviews</h3>
              {reviewLoading && <span className="text-xs text-gray-500">Refreshing...</span>}
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-[#1a2a2e] rounded-xl p-3 bg-[#0b0f10]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StarRating value={Number(review.rating || 0)} readonly />
                    <span className="text-[11px] text-gray-500">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}