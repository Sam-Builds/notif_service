const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// Listen for leave request status changes
app.post("/api/check-leave-approval", async (req, res) => {
  try {
    const { leaveRequestId, newStatus, reviewedBy } = req.body;

    // 1. Get the leave request details
    const { data: leaveRequest, error: leaveError } = await supabase
      .from("leave_requests")
      .select("*, employees(*)")
      .eq("id", leaveRequestId)
      .single();

    if (leaveError) throw leaveError;

    // 2. Check if the employee is a faculty
    const employee = leaveRequest.employees;
    if (employee && employee.department && isFaculty(employee.department)) {
      // 3. If status changed to 'approved', send notification
      if (newStatus === "approved") {
        await sendFacultyNotification(
          employee.user_id,
          "Leave Request Approved! 🎉",
          `Your ${leaveRequest.leave_type} leave from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been approved.`,
        );
      }

      // 4. You can add more status checks here
      if (newStatus === "rejected") {
        const express = require("express");
        const cors = require("cors");
        const { createClient } = require("@supabase/supabase-js");

        // Initialize Express app
        const app = express();
        const PORT = process.env.PORT || 3000;

        // Middleware
        app.use(cors());
        app.use(express.json());

        // Initialize Supabase
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY,
        );

        // ==================== BASIC ROUTES ====================

        // Health check endpoint - TEST THIS FIRST
        app.get("/health", (req, res) => {
          res.json({
            status: "OK",
            message: "Notification service is running",
            timestamp: new Date().toISOString(),
          });
        });

        // Root endpoint
        app.get("/", (req, res) => {
          res.json({
            message: "Notification Service API",
            endpoints: [
              "GET /health",
              "POST /api/test-notification",
              "POST /api/test-notification-by-email",
              "POST /api/check-leave-approval",
            ],
          });
        });

        // ==================== YOUR EXISTING CODE ====================

        // Listen for leave request status changes
        app.post("/api/check-leave-approval", async (req, res) => {
          try {
            const { leaveRequestId, newStatus, reviewedBy } = req.body;

            // 1. Get the leave request details
            const { data: leaveRequest, error: leaveError } = await supabase
              .from("leave_requests")
              .select("*, employees(*)")
              .eq("id", leaveRequestId)
              .single();

            if (leaveError) throw leaveError;

            // 2. Check if the employee is a faculty
            const employee = leaveRequest.employees;
            if (
              employee &&
              employee.department &&
              isFaculty(employee.department)
            ) {
              // 3. If status changed to 'approved', send notification
              if (newStatus === "approved") {
                await sendFacultyNotification(
                  employee.user_id,
                  "Leave Request Approved! 🎉",
                  `Your ${leaveRequest.leave_type} leave from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been approved.`,
                );
              }

              // 4. You can add more status checks here
              if (newStatus === "rejected") {
                await sendFacultyNotification(
                  employee.user_id,
                  "Leave Request Update",
                  `Your ${leaveRequest.leave_type} leave request has been ${newStatus}.`,
                );
              }
            }

            res.json({
              success: true,
              message: "Status checked and notifications sent if needed",
            });
          } catch (error) {
            console.error("Error checking leave approval:", error);
            res.status(500).json({ error: error.message });
          }
        });

        // TEST API: Manually trigger notification to specific user
        app.post("/api/test-notification", async (req, res) => {
          try {
            const { userId, title, body } = req.body;

            if (!userId) {
              return res.status(400).json({ error: "userId is required" });
            }

            // Method 1: Direct to notifications table (will trigger realtime)
            const { data, error } = await supabase
              .from("notifications")
              .insert([
                {
                  user_id: userId,
                  title: title || "Test Notification 🧪",
                  body:
                    body || "This is a test notification sent from the server!",
                  type: "test",
                },
              ]);

            if (error) throw error;

            console.log(`📨 Test notification sent to user: ${userId}`);

            res.json({
              success: true,
              message: "Test notification sent! Check your device.",
              notification: data[0],
            });
          } catch (error) {
            console.error("Error sending test notification:", error);
            res.status(500).json({ error: error.message });
          }
        });

        // TEST API 2: Trigger based on employee email (easier for testing)
        app.post("/api/test-notification-by-email", async (req, res) => {
          try {
            const { email, title, body } = req.body;

            if (!email) {
              return res.status(400).json({ error: "email is required" });
            }

            // 1. Find employee by email to get their user_id
            const { data: employee, error: empError } = await supabase
              .from("employees")
              .select("user_id")
              .eq("email", email)
              .single();

            if (empError || !employee) {
              return res
                .status(404)
                .json({ error: "Employee not found with that email" });
            }

            // 2. Send notification to that user
            const { data, error } = await supabase
              .from("notifications")
              .insert([
                {
                  user_id: employee.user_id,
                  title: title || "Test Notification 🧪",
                  body: body || `Test notification for ${email}`,
                  type: "test",
                },
              ]);

            if (error) throw error;

            console.log(
              `📨 Test notification sent to: ${email} (user: ${employee.user_id})`,
            );

            res.json({
              success: true,
              message: `Test notification sent to ${email}!`,
              user_id: employee.user_id,
              notification: data[0],
            });
          } catch (error) {
            console.error("Error sending test notification:", error);
            res.status(500).json({ error: error.message });
          }
        });

        // Helper function to check if user is faculty
        function isFaculty(department) {
          const facultyDepartments = [
            "Computer Science",
            "Mathematics",
            "Physics",
            "Chemistry",
            "Biology",
            "Engineering",
            "Faculty",
            "Teaching",
          ];
          return facultyDepartments.includes(department);
        }

        // Send notification to faculty
        async function sendFacultyNotification(userId, title, body) {
          try {
            // Method 1: Insert into notifications table (triggers realtime)
            const { data, error } = await supabase
              .from("notifications")
              .insert([
                {
                  user_id: userId,
                  title: title,
                  body: body,
                  type: "leave_approval",
                },
              ]);

            if (error) throw error;
            console.log(`Notification sent to faculty user ${userId}`);
          } catch (error) {
            console.error("Error sending notification:", error);
          }
        }

        app.listen(PORT, () => {
          console.log(`🚀 Notification service running on port ${PORT}`);
          console.log(`📍 Health check: http://localhost:${PORT}/health`);
        });
        await sendFacultyNotification(
          employee.user_id,
          "Leave Request Update",
          `Your ${leaveRequest.leave_type} leave request has been ${newStatus}.`,
        );
      }
    }

    res.json({
      success: true,
      message: "Status checked and notifications sent if needed",
    });
  } catch (error) {
    console.error("Error checking leave approval:", error);
    res.status(500).json({ error: error.message });
  }
});
// TEST API: Manually trigger notification to specific user
app.post("/api/test-notification", async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Method 1: Direct to notifications table (will trigger realtime)
    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        title: title || "Test Notification 🧪",
        body: body || "This is a test notification sent from the server!",
        type: "test",
      },
    ]);

    if (error) throw error;

    console.log(`📨 Test notification sent to user: ${userId}`);

    res.json({
      success: true,
      message: "Test notification sent! Check your device.",
      notification: data[0],
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/test-notification-by-email", async (req, res) => {
  try {
    const { email, title, body } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("user_id")
      .eq("email", email)
      .single();

    if (empError || !employee) {
      return res
        .status(404)
        .json({ error: "Employee not found with that email" });
    }

    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: employee.user_id,
        title: title || "Test Notification ",
        body: body || `Test notification for ${email}`,
        type: "test",
      },
    ]);

    if (error) throw error;

    console.log(
      `📨 Test notification sent to: ${email} (user: ${employee.user_id})`,
    );

    res.json({
      success: true,
      message: `Test notification sent to ${email}!`,
      user_id: employee.user_id,
      notification: data[0],
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: error.message });
  }
});
// Helper function to check if user is faculty
function isFaculty(department) {
  const facultyDepartments = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Engineering",
    "Faculty",
    "Teaching",
  ];
  return facultyDepartments.includes(department);
}

// Send notification to faculty
async function sendFacultyNotification(userId, title, body) {
  try {
    // Method 1: Insert into notifications table (triggers realtime)
    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        title: title,
        body: body,
        type: "leave_approval",
      },
    ]);

    if (error) throw error;
    console.log(`Notification sent to faculty user ${userId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
