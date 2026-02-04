const { supabase } = require("../config/SupabaseClient.js");

/* --- 1. GET ALL NOTIFICATIONS FOR USER --- */
exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role; // EMPLOYEE or EMPLOYER

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user_id)
      .eq("user_role", user_role)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 2. MARK NOTIFICATION AS READ --- */
exports.markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 3. MARK ALL NOTIFICATIONS AS READ --- */
exports.markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("user_role", user_role)
      .eq("is_read", false)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "All notifications marked as read", count: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 4. DELETE NOTIFICATION --- */
exports.deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const user_id = req.user.id;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notification_id)
      .eq("user_id", user_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 5. CLEAR ALL NOTIFICATIONS --- */
exports.clearAll = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user_id)
      .eq("user_role", user_role);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 6. CREATE NOTIFICATION (Internal use) --- */
exports.createNotification = async (userId, userRole, type, title, message, metadata = {}) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        user_role: userRole,
        type: type, // 'application_accepted', 'application_rejected', 'new_application', 'message', 'job_match'
        title: title,
        message: message,
        metadata: metadata, // { job_id, application_id, chat_id, etc. }
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};

/* --- 7. GET UNREAD COUNT --- */
exports.getUnreadCount = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("user_role", user_role)
      .eq("is_read", false);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ unread_count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
