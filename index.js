const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store notifications in memory (for demo)
// In production, use a database
let notifications = [];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Notification service is running' });
});

// Send notification
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { title, body, userId, type } = req.body;

    if (!title || !body || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: title, body, userId'
      });
    }

    // Create notification object
    const notification = {
      id: Date.now().toString(),
      title,
      body,
      userId,
      type: type || 'general',
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store notification
    notifications.push(notification);

    // Here you would integrate with FCM (Firebase Cloud Messaging)
    // For now, we'll just store it locally

    console.log('Notification created:', notification);

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notifications for user
app.get('/api/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userNotifications = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      notifications: userNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
      notification.read = true;
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
