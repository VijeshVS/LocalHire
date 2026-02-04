const { supabase } = require("../config/SupabaseClient.js");
const { createNotification } = require("./NotificationController.js");

/* --- 1. GET OR CREATE CONVERSATION --- */
exports.getOrCreateConversation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_role = req.user.role;
    const { other_user_id, other_user_role, job_id } = req.body;

    if (!other_user_id || !other_user_role) {
      return res.status(400).json({ error: "other_user_id and other_user_role are required" });
    }

    // Check if conversation already exists
    let query = supabase
      .from("conversations")
      .select("*");

    // Match participants regardless of order
    const { data: existing, error: searchError } = await query
      .or(`and(participant1_id.eq.${user_id},participant2_id.eq.${other_user_id}),and(participant1_id.eq.${other_user_id},participant2_id.eq.${user_id})`);

    if (searchError) {
      console.error("Search error:", searchError);
    }

    if (existing && existing.length > 0) {
      // Return existing conversation
      return res.json(existing[0]);
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert({
        participant1_id: user_id,
        participant1_role: user_role,
        participant2_id: other_user_id,
        participant2_role: other_user_role,
        job_id: job_id || null
      })
      .select()
      .single();

    if (createError) return res.status(400).json({ error: createError.message });
    res.status(201).json(newConv);
  } catch (err) {
    console.error("Error with conversation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 2. GET ALL CONVERSATIONS FOR USER --- */
exports.getConversations = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all conversations where user is a participant
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        participant1_id,
        participant1_role,
        participant2_id,
        participant2_role,
        job_id,
        last_message,
        last_message_at,
        created_at
      `)
      .or(`participant1_id.eq.${user_id},participant2_id.eq.${user_id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) return res.status(400).json({ error: error.message });

    // Enrich with other user details
    const enrichedConversations = await Promise.all(
      (data || []).map(async (conv) => {
        const isParticipant1 = conv.participant1_id === user_id;
        const otherId = isParticipant1 ? conv.participant2_id : conv.participant1_id;
        const otherRole = isParticipant1 ? conv.participant2_role : conv.participant1_role;

        // Get other user details
        let otherUser = null;
        if (otherRole === "EMPLOYER") {
          const { data: employer, error: empError } = await supabase
            .from("employers")
            .select("id, name, email")
            .eq("id", otherId)
            .single();
          if (empError) {
            console.error("Error fetching employer:", empError);
          }
          otherUser = employer || { id: otherId, name: 'Employer', company_name: null };
        } else {
          const { data: employee, error: empError } = await supabase
            .from("employees")
            .select("id, name, email")
            .eq("id", otherId)
            .single();
          if (empError) {
            console.error("Error fetching employee:", empError);
          }
          otherUser = employee || { id: otherId, name: 'Worker' };
        }

        // Get job details if linked
        let job = null;
        if (conv.job_id) {
          const { data: jobData } = await supabase
            .from("job_postings")
            .select("id, title")
            .eq("id", conv.job_id)
            .single();
          job = jobData;
        }

        // Get unread count for this conversation
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user_id)
          .eq("is_read", false);

        return {
          ...conv,
          other_user: otherUser,
          other_user_role: otherRole,
          job: job,
          unread_count: unreadCount || 0
        };
      })
    );

    res.json(enrichedConversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 3. GET MESSAGES IN A CONVERSATION --- */
exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user is part of this conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .or(`participant1_id.eq.${user_id},participant2_id.eq.${user_id}`)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ error: "Unauthorized access to conversation" });
    }

    // Get messages
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return res.status(400).json({ error: error.message });

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversation_id)
      .neq("sender_id", user_id)
      .eq("is_read", false);

    res.json(data || []);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 4. SEND MESSAGE --- */
exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { text } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Verify user is part of this conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .or(`participant1_id.eq.${user_id},participant2_id.eq.${user_id}`)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ error: "Unauthorized access to conversation" });
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation_id,
        sender_id: user_id,
        sender_role: user_role,
        text: text.trim(),
        is_read: false
      })
      .select()
      .single();

    if (msgError) return res.status(400).json({ error: msgError.message });

    // Update conversation's last message
    await supabase
      .from("conversations")
      .update({
        last_message: text.trim().substring(0, 100),
        last_message_at: new Date().toISOString()
      })
      .eq("id", conversation_id);

    // Send notification to other participant
    const otherId = conv.participant1_id === user_id ? conv.participant2_id : conv.participant1_id;
    const otherRole = conv.participant1_id === user_id ? conv.participant2_role : conv.participant1_role;
    
    // Get sender name
    let senderName = "Someone";
    if (user_role === "EMPLOYER") {
      const { data: employer } = await supabase
        .from("employers")
        .select("name")
        .eq("id", user_id)
        .single();
      senderName = employer?.name || "Employer";
    } else {
      const { data: employee } = await supabase
        .from("employees")
        .select("name")
        .eq("id", user_id)
        .single();
      senderName = employee?.name || "Worker";
    }

    await createNotification(
      otherId,
      otherRole,
      "message",
      `New message from ${senderName}`,
      text.trim().substring(0, 100),
      { conversation_id: conversation_id, sender_id: user_id }
    );

    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* --- 5. GET CONVERSATION DETAILS --- */
exports.getConversationDetails = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.id;

    // Get conversation with verification
    const { data: conv, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .or(`participant1_id.eq.${user_id},participant2_id.eq.${user_id}`)
      .single();

    if (error || !conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Get other user details
    const isParticipant1 = conv.participant1_id === user_id;
    const otherId = isParticipant1 ? conv.participant2_id : conv.participant1_id;
    const otherRole = isParticipant1 ? conv.participant2_role : conv.participant1_role;

    let otherUser = null;
    if (otherRole === "EMPLOYER") {
      const { data: employer } = await supabase
        .from("employers")
        .select("id, name, email, company_name, phone")
        .eq("id", otherId)
        .single();
      otherUser = employer;
    } else {
      const { data: employee } = await supabase
        .from("employees")
        .select("id, name, email, phone")
        .eq("id", otherId)
        .single();
      otherUser = employee;
    }

    // Get job details if linked
    let job = null;
    if (conv.job_id) {
      const { data: jobData } = await supabase
        .from("job_postings")
        .select("id, title, address, wage")
        .eq("id", conv.job_id)
        .single();
      job = jobData;
    }

    res.json({
      ...conv,
      other_user: otherUser,
      other_user_role: otherRole,
      job: job
    });
  } catch (err) {
    console.error("Error fetching conversation details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
