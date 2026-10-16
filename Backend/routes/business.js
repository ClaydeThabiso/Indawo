import express from "express";
import pool from "../config/db.js";
import dotenv from "dotenv";
import { protect } from "../middleware/auth.js";

const route = express.Router();

route.post("/addBusiness", protect, async (req, res) => {
  const {
    BusinessName,
    Description,
    CategoryId,
    AddressName,
    ImageURl,
    lat,
    lng,
  } = req.body;
  const userId = req.user.id;

  if (
    !BusinessName ||
    !CategoryId ||
    !Description ||
    !AddressName ||
    !ImageURl ||
    !lat ||
    !lng
  ) {
    return res
      .status(400)
      .json({
        message: "Provide details on all required fields, including location.",
      });
  }

  const categoryCheck = await pool.query(
    "SELECT id FROM categories WHERE id = $1",
    [CategoryId],
  );

  if (categoryCheck.rows.length === 0) {
    return res.status(400).json({ message: "Invalid category" });
  }

  const duplicateCheck = await pool.query(
    `SELECT id FROM businesses 
     WHERE LOWER(name) = LOWER($1) 
     AND ST_DWithin(
         coordinates::geography, 
         ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 
         50
     )`,
    [BusinessName, lng, lat],
  );

  if (duplicateCheck.rows.length > 0) {
    return res.status(409).json({
      message:
        "A business with this name has already been mapped at this exact location.",
    });
  }

  try {
    const BusinessAdd = await pool.query(
      `INSERT INTO businesses 
            (name, description, category_id, address_name, image_url, submitted_by, coordinates) 
            VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)) 
            RETURNING *`,
      [
        BusinessName,
        Description,
        CategoryId,
        AddressName,
        ImageURl,
        userId,
        lng,
        lat,
      ],
    );

    return res.status(201).json({
      message: "Business added successfully and is pending review.",
      data: BusinessAdd.rows[0],
    });
  } catch (err) {
    console.error("ADD BUSINESS ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});


route.get("/getBusiness", async (req, res) => {
    try {
        // Added WHERE status = 'approved' so the public map only sees verified shops
        const result = await pool.query(`
            SELECT 
                b.id, 
                b.name AS business_name, 
                b.description, 
                b.address_name, 
                b.image_url,
                b.created_at,
                c.name AS category_name,
                c.icon_url,
                ST_Y(b.coordinates) AS lat,
                ST_X(b.coordinates) AS lng,
                COALESCE(r.avg_rating, 0) AS avg_rating,
                COALESCE(r.review_count, 0) AS review_count
            FROM businesses b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN (
                SELECT business_id,
                       ROUND(AVG(rating), 1)::float AS avg_rating,
                       COUNT(*)::int AS review_count
                FROM reviews
                GROUP BY business_id
            ) r ON r.business_id = b.id
            WHERE b.status = 'approved'
        `);
        return res.json(result.rows);
    } catch(err) {
        console.error("Couldn't get businesses:", err);
        return res.status(500).json({ message: err.message });
    }
});

// 1. Fetch only PENDING businesses for the admin to review
route.get("/pending", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id, 
                b.name AS business_name, 
                b.description, 
                c.name AS category_name,
                b.address_name,
                b.image_url,
                ST_Y(b.coordinates) AS lat,
                ST_X(b.coordinates) AS lng,
                b.resubmit_count,
                b.last_rejection_reason
            FROM businesses b
            JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'pending'
            ORDER BY COALESCE(b.resubmitted_at, b.created_at) ASC
        `);
        return res.json(result.rows);
    } catch(err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

// 2. Approve a business (Changes status from pending to approved)
route.put("/approve/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE businesses SET status = 'approved' WHERE id = $1", [id]);
        return res.json({ message: "Business successfully approved!" });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

route.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM categories`);

    return res.json(result.rows);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

// GET: Fetch the logged-in contributor's stats and submission history
route.get("/my-impact", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get the user's name (Make sure the column matches your users table, e.g., 'name' or 'username')
    const userQuery = await pool.query("SELECT first_name FROM users WHERE id = $1", [userId]);
    const userName = userQuery.rows.length > 0 ? userQuery.rows[0].name : "Scout";

    // 2. Get all businesses submitted by this specific user
    const submissionsQuery = await pool.query(
      "SELECT id, name, status, rejection_reason, resubmit_count, created_at FROM businesses WHERE submitted_by = $1 ORDER BY created_at DESC",
      [userId]
    );
    const submissions = submissionsQuery.rows;

    // 3. Calculate the stats right here on the backend
    const approvedCount = submissions.filter(sub => sub.status === 'approved').length;
    const pendingCount = submissions.filter(sub => sub.status === 'pending').length;
    const rejectedCount= submissions.filter(sub=> sub.status ==='rejected').length;
    // Send it all cleanly to the frontend
    return res.json({
      userStats: { 
        name: userName, 
        approvedCount: approvedCount, 
        pendingCount: pendingCount ,
        rejectedCount: rejectedCount
      },
      submissions: submissions
    });

  } catch (err) {
    console.error("Error fetching impact history:", err);
    return res.status(500).json({ message: "Could not fetch dashboard data." });
  }
});
// PUT: Reject a business and save the reason
route.put("/reject/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "A rejection reason is required." });
        }

        // Update the status to 'rejected' and save the reason
        await pool.query(
            "UPDATE businesses SET status = 'rejected', rejection_reason = $1 WHERE id = $2",
            [reason, id]
        );

        return res.json({ message: "Business has been rejected." });
    } catch(err) {
        console.error("Rejection Error:", err);
        return res.status(500).json({ message: err.message });
    }
});
// POST: Submit a new community review for a business
route.post("/add-review", protect, async (req, res) => {
  try {
    const { business_id, rating, comment } = req.body;
    const user_id = req.user.id; // Pulled straight from your protect middleware token

    // 1. Validation check
    if (!business_id || !rating) {
      return res.status(400).json({ message: "Business ID and a star rating are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
    }

    // 2. Insert into your database using your exact column names
    const newReview = await pool.query(
      `INSERT INTO reviews (business_id, user_id, rating, comment, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [business_id, user_id, rating, comment]
    );

    return res.status(201).json({
      message: "Review posted successfully!",
      review: newReview.rows[0]
    });

  } catch (err) {
    console.error("POST REVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

// GET: Fetch all reviews and summary stats for a specific business
route.get("/business-reviews/:business_id", async (req, res) => {
  try {
    const { business_id } = req.params;

    // 1. Get all reviews joined with the users table so we can display their real names
    const reviewsList = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.first_name AS reviewer_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [business_id]
    );

    // 2. Perform a mathematical aggregation to get the Average Star Rating and Total Review Count
    const statsQuery = await pool.query(
      `SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating, COUNT(id) AS total_reviews 
       FROM reviews 
       WHERE business_id = $1`,
      [business_id]
    );

    return res.json({
      stats: statsQuery.rows[0],
      reviews: reviewsList.rows
    });

  } catch (err) {
    console.error("GET REVIEWS ERROR:", err);
    return res.status(500).json({ message: "Could not retrieve reviews." });
  }
});

// ---------------------------------------------------------------------------
// Business detail page
// ---------------------------------------------------------------------------

// Parses ":id" and rejects anything that is not a positive whole number
const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// GET: One approved business with its rating summary (public)
route.get("/detail/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ message: "Business not found." });
  }

  try {
    const result = await pool.query(
      `SELECT
          b.id,
          b.name AS business_name,
          b.description,
          b.address_name,
          b.image_url,
          b.created_at,
          c.name AS category_name,
          ST_Y(b.coordinates) AS lat,
          ST_X(b.coordinates) AS lng,
          COALESCE(r.avg_rating, 0) AS avg_rating,
          COALESCE(r.review_count, 0) AS review_count
       FROM businesses b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN (
          SELECT business_id,
                 ROUND(AVG(rating), 1)::float AS avg_rating,
                 COUNT(*)::int AS review_count
          FROM reviews
          GROUP BY business_id
       ) r ON r.business_id = b.id
       WHERE b.id = $1 AND b.status = 'approved'`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Business not found." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("GET BUSINESS DETAIL ERROR:", err);
    return res.status(500).json({ message: "Could not load this business." });
  }
});

// GET: Link used for sharing. Chat apps such as WhatsApp read the preview
// tags below (name, description, photo); people are sent on to the app.
// Set CLIENT_URL in the server .env (for example https://indawo.co.za).
route.get("/share/:id", async (req, res) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  const id = parseId(req.params.id);

  try {
    let business = null;
    if (id) {
      const result = await pool.query(
        `SELECT b.name, b.description, b.address_name, b.image_url, c.name AS category_name
         FROM businesses b
         JOIN categories c ON b.category_id = c.id
         WHERE b.id = $1 AND b.status = 'approved'`,
        [id],
      );
      business = result.rows[0] || null;
    }

    const target = business ? `${clientUrl}/business/${id}` : `${clientUrl}/map`;
    const title = business ? `${business.name} on Indawo` : "Indawo";
    const summary = business
      ? `${business.category_name} at ${business.address_name}. ${business.description || ""}`
      : "Discover and map the hidden economy in your community.";
    const description = summary.trim().slice(0, 200);
    const image =
      business && typeof business.image_url === "string" && business.image_url.startsWith("https://")
        ? business.image_url
        : null;

    res.status(business ? 200 : 404).type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Indawo">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(target)}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(target)}">
</head>
<body>
<p>Opening <a href="${escapeHtml(target)}">${escapeHtml(title)}</a>…</p>
<script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script>
</body>
</html>`);
  } catch (err) {
    console.error("SHARE PAGE ERROR:", err);
    return res.redirect(`${clientUrl}/map`);
  }
});

// ---------------------------------------------------------------------------
// Edit and resubmit a rejected business
// Needs the columns from migrations/2026-10-14-resubmissions.sql
// ---------------------------------------------------------------------------

// How many times one business can be sent back after rejection
const MAX_RESUBMITS = 3;

// GET: The logged-in contributor's own submission, to fill the edit form
route.get("/my-submission/:id", protect, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ message: "Submission not found." });
  }

  try {
    const result = await pool.query(
      `SELECT
          id,
          name AS business_name,
          description,
          category_id,
          address_name,
          image_url,
          status,
          rejection_reason,
          resubmit_count,
          ST_Y(coordinates) AS lat,
          ST_X(coordinates) AS lng
       FROM businesses
       WHERE id = $1 AND submitted_by = $2`,
      [id, req.user.id],
    );

    // Same answer for "does not exist" and "belongs to someone else"
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Submission not found." });
    }

    return res.json({ ...result.rows[0], max_resubmits: MAX_RESUBMITS });
  } catch (err) {
    console.error("GET MY SUBMISSION ERROR:", err);
    return res.status(500).json({ message: "Could not load this submission." });
  }
});

// PUT: Fix a rejected business and send it back for review
route.put("/resubmit/:id", protect, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ message: "Submission not found." });
  }

  const { BusinessName, CategoryId, AddressName, Description, ImageURl, lat, lng } = req.body;

  const name = String(BusinessName ?? "").trim();
  const address = String(AddressName ?? "").trim();
  const description = String(Description ?? "").trim();
  const categoryId = Number(CategoryId);

  if (!name || !address || !description || !Number.isInteger(categoryId)) {
    return res.status(400).json({
      message: "Name, category, street or landmark and description are all required.",
    });
  }
  if (name.length > 120 || address.length > 200 || description.length > 1000) {
    return res.status(400).json({ message: "One of the fields is too long." });
  }

  // Location is optional: leave it out to keep the original pin
  const hasNewLocation = lat != null && lng != null;
  const newLat = Number(lat);
  const newLng = Number(lng);
  if (
    hasNewLocation &&
    !(Number.isFinite(newLat) && Math.abs(newLat) <= 90 && Number.isFinite(newLng) && Math.abs(newLng) <= 180)
  ) {
    return res.status(400).json({ message: "The location is not valid." });
  }

  // Photo is optional: leave it out to keep the original
  const newImage = ImageURl ? String(ImageURl) : null;
  if (newImage && !newImage.startsWith("https://")) {
    return res.status(400).json({ message: "The photo link is not valid." });
  }

  try {
    const existing = await pool.query(
      `SELECT id, status, resubmit_count, ST_Y(coordinates) AS lat, ST_X(coordinates) AS lng
       FROM businesses
       WHERE id = $1 AND submitted_by = $2`,
      [id, req.user.id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Submission not found." });
    }

    const current = existing.rows[0];

    if (current.status !== "rejected") {
      return res.status(409).json({
        message: "Only rejected submissions can be edited and resubmitted.",
      });
    }
    if (current.resubmit_count >= MAX_RESUBMITS) {
      return res.status(403).json({
        message: `This business has already been resubmitted ${MAX_RESUBMITS} times.`,
      });
    }

    const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1", [categoryId]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const finalLat = hasNewLocation ? newLat : Number(current.lat);
    const finalLng = hasNewLocation ? newLng : Number(current.lng);

    // Same duplicate rule as a new submission, ignoring this business itself
    const duplicateCheck = await pool.query(
      `SELECT id FROM businesses
       WHERE LOWER(name) = LOWER($1)
         AND id <> $4
         AND ST_DWithin(
             coordinates::geography,
             ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
             50
         )`,
      [name, finalLng, finalLat, id],
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "A business with this name has already been mapped at this location.",
      });
    }

    // The status and owner checks are repeated here so two quick taps cannot
    // resubmit twice. In an UPDATE, the right-hand side sees the old row, so
    // last_rejection_reason keeps the reason before rejection_reason is cleared.
    const updated = await pool.query(
      `UPDATE businesses SET
          name = $1,
          description = $2,
          category_id = $3,
          address_name = $4,
          image_url = COALESCE($5, image_url),
          coordinates = ST_SetSRID(ST_MakePoint($6, $7), 4326),
          status = 'pending',
          last_rejection_reason = rejection_reason,
          rejection_reason = NULL,
          resubmit_count = resubmit_count + 1,
          resubmitted_at = NOW()
       WHERE id = $8 AND submitted_by = $9 AND status = 'rejected'
       RETURNING id, name, status, resubmit_count`,
      [name, description, categoryId, address, newImage, finalLng, finalLat, id, req.user.id],
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({
        message: "This submission was already resubmitted.",
      });
    }

    return res.json({
      message: "Thanks. Your business was sent back for review.",
      data: updated.rows[0],
    });
  } catch (err) {
    console.error("RESUBMIT ERROR:", err);
    return res.status(500).json({ message: "Could not resubmit this business." });
  }
});

export default route;
