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
                c.name AS category_name 
            FROM businesses b
            JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'pending'
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
      "SELECT id, name, status,rejection_reason, created_at FROM businesses WHERE submitted_by = $1 ORDER BY created_at DESC",
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
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name 
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

export default route;